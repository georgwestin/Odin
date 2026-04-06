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
    accentHover: string;
    surface: string;
    surfaceAlt: string;
    background: string;
    text: string;
    textMuted: string;
    border: string;
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
  id: "swedbet",
  name: "Swedbet",
  slug: "swedbet",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
  colors: {
    primary: "#0066FF",
    primaryHover: "#0052CC",
    secondary: "#1A1A2E",
    accent: "#00C853",
    accentHover: "#00A844",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F5F7",
    background: "#FFFFFF",
    text: "#1A1A2E",
    textMuted: "#4A4A68",
    border: "#E8E8ED",
    success: "#34C759",
    danger: "#FF3B30",
    warning: "#FF9500",
  },
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },
  features: {
    casino: true,
    sports: true,
    liveCasino: true,
    poker: false,
  },
  supportEmail: "support@swedbet.com",
  licenseText:
    "Swedbet drivs under svensk spellicens utfardad av Spelinspektionen. 18+ | Spela ansvarsfullt.",
};

let currentBrand: BrandConfig = DEFAULT_BRAND;

export function getBrand(): BrandConfig {
  return currentBrand;
}

export async function fetchBrandConfig(
  hostname: string
): Promise<BrandConfig> {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    const res = await fetch(
      `${apiBase}/brands/resolve?hostname=${encodeURIComponent(hostname)}`,
      {
        next: { revalidate: 300 },
      }
    );
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
  root.style.setProperty("--brand-accent-hover", c.accentHover);
  root.style.setProperty("--brand-surface", c.surface);
  root.style.setProperty("--brand-surface-alt", c.surfaceAlt);
  root.style.setProperty("--brand-background", c.background);
  root.style.setProperty("--brand-text", c.text);
  root.style.setProperty("--brand-text-muted", c.textMuted);
  root.style.setProperty("--brand-border", c.border);
  root.style.setProperty("--brand-success", c.success);
  root.style.setProperty("--brand-danger", c.danger);
  root.style.setProperty("--brand-warning", c.warning);
  root.style.setProperty("--font-heading", brand.fonts.heading);
  root.style.setProperty("--font-body", brand.fonts.body);
}
