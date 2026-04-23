const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface TokenStore {
  accessToken: string | null;
  refreshToken: string | null;
}

const tokenStore: TokenStore = {
  accessToken: null,
  refreshToken: null,
};

export function setTokens(access: string, refresh: string) {
  tokenStore.accessToken = access;
  tokenStore.refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("odin_access_token", access);
    localStorage.setItem("odin_refresh_token", refresh);
    // Also set cookie so server-side middleware can check auth
    document.cookie = `odin_access_token=${access};path=/;max-age=900;SameSite=Lax`;
  }
}

export function getAccessToken(): string | null {
  if (tokenStore.accessToken) return tokenStore.accessToken;
  if (typeof window !== "undefined") {
    tokenStore.accessToken = localStorage.getItem("odin_access_token");
    tokenStore.refreshToken = localStorage.getItem("odin_refresh_token");
  }
  return tokenStore.accessToken;
}

export function clearTokens() {
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("odin_access_token");
    localStorage.removeItem("odin_refresh_token");
    document.cookie = "odin_access_token=;path=/;max-age=0";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refresh = tokenStore.refreshToken || localStorage.getItem("odin_refresh_token");
      if (!refresh) return false;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokenStore.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw { status: 401, message: "Session expired" } as ApiError;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw {
      status: res.status,
      message: body.message || res.statusText,
      code: body.code,
    } as ApiError;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
