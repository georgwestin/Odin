package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/auth/handler"
	"github.com/odin-platform/odin/cmd/auth/repository"
	"github.com/odin-platform/odin/cmd/auth/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/kafka"
	mw "github.com/odin-platform/odin/internal/middleware"
	iredis "github.com/odin-platform/odin/internal/redis"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to PostgreSQL.
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Connect to Redis.
	redisClient, err := iredis.Connect(ctx, cfg.RedisURL)
	if err != nil {
		logger.Fatal("failed to connect to redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Create Kafka producer.
	kafkaProducer, err := kafka.NewProducer([]string{cfg.KafkaBroker}, nil)
	if err != nil {
		logger.Fatal("failed to create kafka producer", zap.Error(err))
	}
	defer kafkaProducer.Close()

	// Initialize JWT manager with RSA keys.
	jwtMgr, err := auth.NewJWTManager(
		cfg.JWTPrivateKeyPath,
		cfg.JWTPublicKeyPath,
		15*time.Minute,
		7*24*time.Hour,
	)
	if err != nil {
		logger.Fatal("failed to initialize JWT manager", zap.Error(err))
	}

	// Build layers.
	repo := repository.New(database.Pool)
	svc := service.New(
		repo,
		redisClient.Client,
		kafkaProducer,
		jwtMgr,
		cfg.WalletServiceURL,
		cfg.InternalAuthToken,
		logger,
	)
	h := handler.New(svc, logger)

	// Build router with common middleware.
	r := chi.NewRouter()
	for _, m := range mw.Common(logger, "auth") {
		r.Use(m)
	}
	r.Use(mw.BrandID)

	// Health check.
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"auth"}`))
	})

	registerRoutes(r, h, jwtMgr)

	// Start HTTP server.
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown.
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("auth service starting", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server error", zap.Error(err))
		}
	}()

	<-done
	logger.Info("auth service shutting down")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", zap.Error(err))
	}

	logger.Info("auth service stopped")
}
