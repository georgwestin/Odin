import { create } from "zustand";
import { api } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "viewer" | "support";
  brands: string[];
}

interface AuthState {
  user: AdminUser | null;
  isLoading: boolean;
  activeBrand: string;
  setActiveBrand: (brand: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  hasPermission: (requiredRole: string) => boolean;
}

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 4,
  admin: 3,
  support: 2,
  viewer: 1,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  activeBrand: "all",

  setActiveBrand: (brand: string) => {
    set({ activeBrand: brand });
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_active_brand", brand);
    }
  },

  login: async (email: string, password: string) => {
    const response = await api.post<{ token: string; user: AdminUser }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("admin_token", response.token);
    localStorage.setItem("admin_user", JSON.stringify(response.user));
    set({ user: response.user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_active_brand");
    set({ user: null, activeBrand: "all" });
    window.location.href = "/login";
  },

  loadUser: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }
    const stored = localStorage.getItem("admin_user");
    const token = localStorage.getItem("admin_token");
    const brand = localStorage.getItem("admin_active_brand") || "all";
    if (stored && token) {
      try {
        const user = JSON.parse(stored) as AdminUser;
        set({ user, isLoading: false, activeBrand: brand });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  hasPermission: (requiredRole: string) => {
    const user = get().user;
    if (!user) return false;
    return (ROLE_HIERARCHY[user.role] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
  },
}));
