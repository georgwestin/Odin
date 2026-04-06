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
	chimw "github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/casino/handler"
	"github.com/odin-platform/odin/cmd/casino/provider"
	"github.com/odin-platform/odin/cmd/casino/repository"
	"github.com/odin-platform/odin/cmd/casino/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/db"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to PostgreSQL.
	database, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Initialize provider registry.
	registry := provider.NewRegistry()

	// Register the generic provider adapter. In production, additional providers
	// (e.g., Evolution, Pragmatic Play) would be registered from config.
	genericProv := provider.NewGenericProvider(
		"generic",
		os.Getenv("GENERIC_RGS_URL"),
		os.Getenv("GENERIC_RGS_API_KEY"),
		os.Getenv("GENERIC_RGS_HMAC_KEY"),
	)
	registry.Register(genericProv)

	// Initialize repository and service.
	repo := repository.New(database.Pool)
	svc := service.New(repo, registry, cfg.WalletServiceURL, logger)

	// Set up HTTP router.
	r := chi.NewRouter()
	r.Use(chimw.RealIP)
	r.Use(chimw.RequestID)
	r.Use(chimw.Recoverer)

	// Initialize JWT manager for auth middleware.
	jwtMgr, err := auth.NewJWTManager(
		cfg.AuthPrivateKeyPath, cfg.AuthPublicKeyPath,
		15*time.Minute, 7*24*time.Hour,
	)
	if err != nil {
		logger.Fatal("failed to initialize JWT manager", zap.Error(err))
	}

	h := handler.New(svc, registry, logger)
	setupRoutes(r, h, jwtMgr)

	// Health check.
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"casino"}`))
	})

	port := 8004
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown.
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		logger.Info("shutting down casino service")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Error("http server shutdown error", zap.Error(err))
		}
	}()

	logger.Info("casino service starting", zap.Int("port", port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("http server error", zap.Error(err))
	}

	logger.Info("casino service stopped")
}
