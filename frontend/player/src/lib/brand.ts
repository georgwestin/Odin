"use client";

export interface BrandConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  faviconUrl: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    surface: string;
    surfaceAlt: string;
    background: string;
    text: string;
    textMuted: string;
    success: string;
    danger: string;
    warning: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  features: {
    casino: boolean;
    sports: boolean;
    liveCasino: boolean;
    poker: boolean;
  };
  supportEmail: string;
  licenseText: string;
}

const DEFAULT_BRAND: BrandConfig = {
  id: "default",
  name: "Odin",
  slug: "odin",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  colors: {
    primary: "#d4a017",
    primaryHover: "#b8860b",
    secondary: "#1a1a2e",
    accent: "#e6c200",
    surface: "#16213e",
    surfaceAlt: "#0f3460",
    background: "#0a0a1a",
    text: "#e0e0e0",
    textMuted: "#8a8aa0",
    success: "#00c853",
    danger: "#ff1744",
    warning: "#ff9100",
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  features: {
    casino: true,
    sports: true,
    liveCasino: true,
    poker: false,
  },
  supportEmail: "support@odin.gg",
  licenseText: "Licensed and regulated. Play responsibly. 18+",
};

let currentBrand: BrandConfig = DEFAULT_BRAND;

export function getBrand(): BrandConfig {
  return currentBrand;
}

export async function fetchBrandConfig(hostname: string): Promise<BrandConfig> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    const res = await fetch(`${apiBase}/brands/resolve?hostname=${encodeURIComponent(hostname)}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const brand = await res.json();
      currentBrand = brand;
      return brand;
    }
  } catch {
    // Fall back to default brand
  }
  return DEFAULT_BRAND;
}

export function applyBrandTheme(brand: BrandConfig) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const c = brand.colors;

  root.style.setProperty("--brand-primary", c.primary);
  root.style.setProperty("--brand-primary-hover", c.primaryHover);
  root.style.setProperty("--brand-secondary", c.secondary);
  root.style.setProperty("--brand-accent", c.accent);
  root.style.setProperty("--brand-surface", c.surface);
  root.style.setProperty("--brand-surface-alt", c.surfaceAlt);
  root.style.setProperty("--brand-background", c.background);
  root.style.setProperty("--brand-text", c.text);
  root.style.setProperty("--brand-text-muted", c.textMuted);
  root.style.setProperty("--brand-success", c.success);
  root.style.setProperty("--brand-danger", c.danger);
  root.style.setProperty("--brand-warning", c.warning);
  root.style.setProperty("--font-heading", brand.fonts.heading);
  root.style.setProperty("--font-body", brand.fonts.body);
}
