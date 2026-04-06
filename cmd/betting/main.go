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

	"github.com/odin-platform/odin/cmd/betting/consumer"
	"github.com/odin-platform/odin/cmd/betting/handler"
	"github.com/odin-platform/odin/cmd/betting/repository"
	"github.com/odin-platform/odin/cmd/betting/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/config"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/kafka"
	odinredis "github.com/odin-platform/odin/internal/redis"
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

	// Connect to Redis.
	rdb, err := odinredis.Connect(ctx, cfg.RedisURL)
	if err != nil {
		logger.Fatal("failed to connect to redis", zap.Error(err))
	}
	defer rdb.Close()

	// Create Kafka producer.
	brokers := cfg.KafkaBrokerList()
	producer, err := kafka.NewProducer(brokers, nil)
	if err != nil {
		logger.Fatal("failed to create kafka producer", zap.Error(err))
	}
	defer producer.Close()

	// Initialize repository and service.
	repo := repository.New(database.Pool)
	svc := service.New(repo, rdb.Client, producer, cfg.WalletServiceURL, logger)

	// Start Kafka consumer for event.resulted topic.
	eventConsumer := consumer.New(svc, logger)
	kafkaConsumer := kafka.NewConsumer(
		brokers,
		"event.resulted",
		"betting-service",
		logger,
	)
	kafkaConsumer.Subscribe(ctx, eventConsumer.Handle)
	defer kafkaConsumer.Close()

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

	h := handler.New(svc, logger)
	setupRoutes(r, h, jwtMgr, cfg.InternalAuthToken)

	// Health check.
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"betting"}`))
	})

	port := 8003
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

		logger.Info("shutting down betting service")
		cancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Error("http server shutdown error", zap.Error(err))
		}
	}()

	logger.Info("betting service starting", zap.Int("port", port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("http server error", zap.Error(err))
	}

	logger.Info("betting service stopped")
}
