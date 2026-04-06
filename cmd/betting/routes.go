package main

import (
	"github.com/go-chi/chi/v5"

	"github.com/odin-platform/odin/cmd/betting/handler"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/middleware"
)

func setupRoutes(r *chi.Mux, h *handler.Handler, jwtMgr *auth.JWTManager, internalToken string) {
	// Player-facing routes (JWT auth required).
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))

		r.Post("/bets", h.PlaceBet)
		r.Get("/bets", h.GetBets)
		r.Get("/bets/{id}", h.GetBet)
		r.Post("/bets/{id}/cashout", h.Cashout)
	})

	// Internal service-to-service routes.
	r.Group(func(r chi.Router) {
		r.Use(middleware.InternalAuth(internalToken))

		r.Post("/internal/bets/settle", h.SettleBets)
	})
}
