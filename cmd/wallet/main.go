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

	"github.com/odin-platform/odin/cmd/wallet/finshark"
	"github.com/odin-platform/odin/cmd/wallet/handler"
	"github.com/odin-platform/odin/cmd/wallet/repository"
	"github.com/odin-platform/odin/cmd/wallet/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/kafka"
	mw "github.com/odin-platform/odin/internal/middleware"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	// Override default port for the wallet service.
	if cfg.Port == 8001 {
		cfg.Port = 8002
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to PostgreSQL.
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Create Kafka producer.
	kafkaProducer, err := kafka.NewProducer([]string{cfg.KafkaBroker}, nil)
	if err != nil {
		logger.Fatal("failed to create kafka producer", zap.Error(err))
	}
	defer kafkaProducer.Close()

	// Initialize JWT manager (wallet service only needs the public key for validation,
	// but we load both for consistency with the auth package API).
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
	svc := service.New(repo, kafkaProducer, logger)
	h := handler.New(svc, logger)

	// Initialize FinShark payment handler.
	fsCfg := finshark.DefaultConfig()
	fsh := finshark.NewHandler(fsCfg, database.Pool, svc, logger)

	// Build router with common middleware.
	r := chi.NewRouter()
	for _, m := range mw.Common(logger, "wallet") {
		r.Use(m)
	}
	r.Use(mw.BrandID)

	// Health check.
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"wallet"}`))
	})

	registerRoutes(r, h, fsh, jwtMgr, cfg.InternalAuthToken)

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
		logger.Info("wallet service starting", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server error", zap.Error(err))
		}
	}()

	<-done
	logger.Info("wallet service shutting down")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", zap.Error(err))
	}

	logger.Info("wallet service stopped")
}
