package main

import (
	"github.com/go-chi/chi/v5"

	"github.com/odin-platform/odin/cmd/wallet/handler"
	"github.com/odin-platform/odin/internal/auth"
	"github.com/odin-platform/odin/internal/middleware"
)

func registerRoutes(r chi.Router, h *handler.Handler, jwtMgr *auth.JWTManager, internalToken string) {
	// Player-facing routes (authentication required).
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware(jwtMgr))

		r.Get("/wallet/balance", h.Balance)
		r.Get("/wallet/transactions", h.Transactions)
		r.Post("/wallet/deposit", h.Deposit)
		r.Post("/wallet/withdraw", h.Withdraw)
	})

	// Internal service-to-service routes.
	r.Group(func(r chi.Router) {
		r.Use(middleware.InternalAuth(internalToken))

		r.Post("/wallet/transfer/debit", h.TransferDebit)
		r.Post("/wallet/transfer/credit", h.TransferCredit)
		r.Post("/wallet/internal/create", h.CreateWallet)
	})
}
