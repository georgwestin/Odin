package main

import (
	"github.com/go-chi/chi/v5"

	"github.com/odin-platform/odin/cmd/casino/handler"
	"github.com/odin-platform/odin/internal/auth"
)

func setupRoutes(r *chi.Mux, h *handler.Handler, jwtMgr *auth.JWTManager) {
	// Player-facing routes (JWT auth required).
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))

		r.Get("/casino/games", h.ListGames)
		r.Post("/casino/sessions", h.CreateSession)
		r.Delete("/casino/sessions/{id}", h.DeleteSession)
	})

	// RGS callback routes (HMAC-SHA256 auth validated in handler).
	r.Post("/internal/casino/debit", h.RGSDebit)
	r.Post("/internal/casino/credit", h.RGSCredit)
}
