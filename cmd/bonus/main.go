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

	"github.com/odin-platform/odin/cmd/bonus/handler"
	"github.com/odin-platform/odin/cmd/bonus/repository"
	"github.com/odin-platform/odin/cmd/bonus/service"
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

	producer, err := kafka.NewProducer([]string{cfg.KafkaBroker}, nil)
	if err != nil {
		logger.Error("failed to create kafka producer", "error", err)
		os.Exit(1)
	}
	defer producer.Close()

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

	router := setupRoutes(database, producer, jwtMgr, zapLogger, logger)

	// Start Kafka consumers for wagering progress tracking.
	startConsumers(ctx, cfg, database, zapLogger, logger)

	port := 8006
	if cfg.Port != 0 {
		port = cfg.Port
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("bonus service starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down bonus service")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}
}

func startConsumers(ctx context.Context, cfg *config.Config, database *db.DB, zapLogger *zap.Logger, logger *slog.Logger) {
	repo := repository.New(database)
	svc := service.New(repo, nil, logger)
	con := handler.NewConsumerHandler(svc, logger)

	betPlacedConsumer := kafka.NewConsumer(
		[]string{cfg.KafkaBroker},
		kafka.TopicBetPlaced,
		"bonus-bet-placed",
		zapLogger,
	)
	betPlacedConsumer.Subscribe(ctx, con.HandleBetPlaced)

	betSettledConsumer := kafka.NewConsumer(
		[]string{cfg.KafkaBroker},
		kafka.TopicBetSettled,
		"bonus-bet-settled",
		zapLogger,
	)
	betSettledConsumer.Subscribe(ctx, con.HandleBetSettled)
}
