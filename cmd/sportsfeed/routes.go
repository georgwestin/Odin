package main

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/sportsfeed/feed"
	"github.com/odin-platform/odin/cmd/sportsfeed/handler"
	"github.com/odin-platform/odin/cmd/sportsfeed/repository"
	"github.com/odin-platform/odin/cmd/sportsfeed/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/kafka"
	mw "github.com/odin-platform/odin/internal/middleware"
	odinredis "github.com/odin-platform/odin/internal/redis"
)

func setupRoutes(redisClient *odinredis.Client, producer *kafka.Producer, jwtMgr *auth.JWTManager, zapLogger *zap.Logger, logger *slog.Logger) http.Handler {
	repo := repository.New(redisClient)
	svc := service.New(repo, logger)
	h := handler.New(svc, logger)

	r := chi.NewRouter()

	for _, m := range mw.Common(zapLogger, "sportsfeed") {
		r.Use(m)
	}

	r.Route("/sports", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))
		r.Get("/", h.ListSports)
		r.Get("/{id}/events", h.ListEventsBySport)
	})

	r.Route("/events", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))
		r.Get("/{id}", h.GetEvent)
		r.Get("/{id}/stream", h.StreamOdds)
	})

	return r
}

func startFeedSimulator(ctx context.Context, redisClient *odinredis.Client, producer *kafka.Producer, logger *slog.Logger) {
	repo := repository.New(redisClient)
	sim := feed.NewSimulator(repo, producer, logger)
	go sim.Run(ctx)
}
