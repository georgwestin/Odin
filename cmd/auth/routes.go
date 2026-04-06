package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/odin-platform/odin/cmd/auth/handler"
	"github.com/odin-platform/odin/internal/auth"
)

func registerRoutes(r chi.Router, h *handler.Handler, jwtMgr *auth.JWTManager) {
	// Public routes (no authentication required).
	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)
	r.Post("/auth/refresh", h.Refresh)

	// JWKS endpoint for token verification by other services.
	r.Get("/.well-known/jwks.json", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		json.NewEncoder(w).Encode(map[string]interface{}{"keys": []interface{}{}})
	})

	// Authenticated routes.
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))

		r.Post("/auth/logout", h.Logout)
		r.Get("/auth/me", h.Me)

		// Admin-only routes.
		r.Group(func(r chi.Router) {
			r.Use(auth.RequireRole("admin"))
			r.Patch("/auth/kyc", h.UpdateKYC)
		})
	})
}
