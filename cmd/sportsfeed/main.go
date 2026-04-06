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

	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/kafka"
	odinredis "github.com/odin-platform/odin/internal/redis"
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

	redisClient, err := odinredis.Connect(ctx, cfg.RedisURL)
	if err != nil {
		logger.Error("failed to connect to redis", "error", err)
		os.Exit(1)
	}
	defer redisClient.Close()

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

	router := setupRoutes(redisClient, producer, jwtMgr, zapLogger, logger)

	// Start the development feed simulator.
	startFeedSimulator(ctx, redisClient, producer, logger)

	port := 8005
	if cfg.Port != 0 {
		port = cfg.Port
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second, // Longer for SSE streaming.
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		logger.Info("sportsfeed service starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down sportsfeed service")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}
}
