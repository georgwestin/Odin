"use client";

import { create } from "zustand";
import { api, setTokens, clearTokens, getAccessToken } from "./api";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth: string;
  country: string;
  kycStatus: "pending" | "verified" | "rejected";
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  dateOfBirth: string;
  country: string;
  acceptTerms: boolean;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const res = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/auth/login", { email, password });
    setTokens(res.accessToken, res.refreshToken);
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  register: async (data: RegisterData) => {
    const res = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>("/auth/register", data);
    setTokens(res.accessToken, res.refreshToken);
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  },

  loadUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await api.get<User>("/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
