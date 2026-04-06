package main

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"

	"github.com/odin-platform/odin/cmd/reporting/handler"
	"github.com/odin-platform/odin/cmd/reporting/repository"
	"github.com/odin-platform/odin/cmd/reporting/service"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/db"
	mw "github.com/odin-platform/odin/internal/middleware"
)

func setupRoutes(database *db.DB, jwtMgr *auth.JWTManager, zapLogger *zap.Logger, logger *slog.Logger) http.Handler {
	repo := repository.New(database)
	svc := service.New(repo, logger)
	h := handler.New(svc, logger)

	r := chi.NewRouter()

	for _, m := range mw.Common(zapLogger, "reporting") {
		r.Use(m)
	}

	// All reporting routes require admin role.
	r.Route("/reports", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))
		r.Use(auth.RequireRole("admin"))

		r.Get("/ggr", h.GGRReport)
		r.Get("/players", h.PlayerActivityReport)
		r.Get("/transactions", h.TransactionReport)
		r.Get("/bets", h.BetHistoryReport)
		r.Get("/responsible-gambling", h.ResponsibleGamblingReport)
		r.Get("/dashboard", h.DashboardStats)
	})

	return r
}
