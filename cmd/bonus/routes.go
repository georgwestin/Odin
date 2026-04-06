package main

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/bonus/handler"
	"github.com/odin-platform/odin/cmd/bonus/repository"
	"github.com/odin-platform/odin/cmd/bonus/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/db"
	"github.com/odin-platform/odin/internal/kafka"
	mw "github.com/odin-platform/odin/internal/middleware"
)

func setupRoutes(database *db.DB, producer *kafka.Producer, jwtMgr *auth.JWTManager, zapLogger *zap.Logger, logger *slog.Logger) http.Handler {
	repo := repository.New(database)
	svc := service.New(repo, producer, logger)
	h := handler.New(svc, logger)

	r := chi.NewRouter()

	for _, m := range mw.Common(zapLogger, "bonus") {
		r.Use(m)
	}

	r.Route("/bonuses", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))
		r.Get("/", h.ListBonuses)
		r.Post("/claim", h.ClaimBonus)
	})

	r.Route("/limits", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))
		r.Get("/", h.GetLimits)
		r.Put("/", h.SetLimits)
		r.Post("/cooling-off", h.CoolingOff)
		r.Post("/self-exclude", h.SelfExclude)
	})

	return r
}
