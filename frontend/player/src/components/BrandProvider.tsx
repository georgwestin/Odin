"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { BrandConfig, fetchBrandConfig, applyBrandTheme, getBrand } from "@/lib/brand";

const BrandContext = createContext<BrandConfig | null>(null);

export function useBrand(): BrandConfig {
  const ctx = useContext(BrandContext);
  if (!ctx) return getBrand();
  return ctx;
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(getBrand());

  useEffect(() => {
    const hostname = window.location.hostname;
    fetchBrandConfig(hostname).then((b) => {
      setBrand(b);
      applyBrandTheme(b);
    });
  }, []);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}
