"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "adjustment";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  reference?: string;
  createdAt: string;
}

interface WalletState {
  balance: number;
  bonusBalance: number;
  currency: string;
  transactions: Transaction[];
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  deposit: (amount: number, method: string) => Promise<void>;
  withdraw: (amount: number, method: string) => Promise<void>;
  updateBalance: (balance: number) => void;
}

export const useWallet = create<WalletState>((set) => ({
  balance: 0,
  bonusBalance: 0,
  currency: "EUR",
  transactions: [],
  totalTransactions: 0,
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    try {
      const data = await api.get<{
        balance: number;
        bonusBalance: number;
        currency: string;
      }>("/wallet/balance");
      set({
        balance: data.balance,
        bonusBalance: data.bonusBalance,
        currency: data.currency,
      });
    } catch {
      set({ error: "Kunde inte hamta saldo" });
    }
  },

  fetchTransactions: async (page = 1, limit = 20) => {
    set({ isLoading: true });
    try {
      const data = await api.get<{
        items: Transaction[];
        total: number;
      }>(`/wallet/transactions?page=${page}&limit=${limit}`);
      set({
        transactions: data.items,
        totalTransactions: data.total,
        isLoading: false,
      });
    } catch {
      set({ error: "Kunde inte hamta transaktioner", isLoading: false });
    }
  },

  deposit: async (amount: number, method: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/wallet/deposit", { amount, method });
      const data = await api.get<{
        balance: number;
        bonusBalance: number;
        currency: string;
      }>("/wallet/balance");
      set({
        balance: data.balance,
        bonusBalance: data.bonusBalance,
        isLoading: false,
      });
    } catch {
      set({ error: "Insattningen misslyckades", isLoading: false });
      throw new Error("Insattningen misslyckades");
    }
  },

  withdraw: async (amount: number, method: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/wallet/withdraw", { amount, method });
      const data = await api.get<{
        balance: number;
        bonusBalance: number;
        currency: string;
      }>("/wallet/balance");
      set({
        balance: data.balance,
        bonusBalance: data.bonusBalance,
        isLoading: false,
      });
    } catch {
      set({ error: "Uttaget misslyckades", isLoading: false });
      throw new Error("Uttaget misslyckades");
    }
  },

  updateBalance: (balance: number) => {
    set({ balance });
  },
}));
