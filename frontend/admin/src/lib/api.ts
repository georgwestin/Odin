const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/admin";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

class AdminApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token");
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, params, signal } = options;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(this.buildUrl(path, params), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, { params });
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "POST", body });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PUT", body });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PATCH", body });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  async downloadCsv(path: string, params?: Record<string, string>): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(this.buildUrl(path, { ...params, format: "csv" }), { headers });
    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const api = new AdminApiClient();
