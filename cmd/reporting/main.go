package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/reporting/consumer"
	"github.com/odin-platform/odin/cmd/reporting/repository"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/kafka"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	zapLogger, _ := zap.NewProduction()
	defer zapLogger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	jwtMgr, err := auth.NewJWTManager(
		cfg.JWTPrivateKeyPath,
		cfg.JWTPublicKeyPath,
		15*time.Minute,
		24*time.Hour,
	)
	if err != nil {
		logger.Error("failed to create jwt manager", "error", err)
		os.Exit(1)
	}

	router := setupRoutes(database, jwtMgr, zapLogger, logger)

	// Start Kafka consumers to build aggregate tables.
	repo := repository.New(database)
	startConsumers(ctx, cfg, repo, zapLogger, logger)

	port := 8007
	if cfg.Port != 0 {
		port = cfg.Port
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("reporting service starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down reporting service")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}
}

func startConsumers(ctx context.Context, cfg *config.Config, repo *repository.Repository, zapLogger *zap.Logger, logger *slog.Logger) {
	c := consumer.New(repo, logger)

	brokers := []string{cfg.KafkaBroker}

	playerConsumer := kafka.NewConsumer(brokers, kafka.TopicPlayerRegistered, "reporting-player-registered", zapLogger)
	playerConsumer.Subscribe(ctx, c.HandlePlayerRegistered)

	txnConsumer := kafka.NewConsumer(brokers, kafka.TopicWalletTransaction, "reporting-wallet-transaction", zapLogger)
	txnConsumer.Subscribe(ctx, c.HandleWalletTransaction)

	betPlacedConsumer := kafka.NewConsumer(brokers, kafka.TopicBetPlaced, "reporting-bet-placed", zapLogger)
	betPlacedConsumer.Subscribe(ctx, c.HandleBetPlaced)

	betSettledConsumer := kafka.NewConsumer(brokers, kafka.TopicBetSettled, "reporting-bet-settled", zapLogger)
	betSettledConsumer.Subscribe(ctx, c.HandleBetSettled)
}
