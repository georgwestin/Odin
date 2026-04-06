"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBanners, urlFor, isSanityConfigured, SanityBanner as SanityBannerType } from "@/lib/sanity";
import { useBrand } from "@/components/BrandProvider";

interface SanityBannerProps {
  placement: string;
  className?: string;
  /** Rendered when Sanity returns no banners. */
  fallback?: React.ReactNode;
}

function BannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden animate-pulse ${className || ""}`}
      style={{ backgroundColor: "#1e2a4a" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-xl space-y-4">
          <div className="h-10 w-3/4 rounded bg-white/10" />
          <div className="h-6 w-1/2 rounded bg-white/10" />
          <div className="h-12 w-40 rounded-full bg-white/10 mt-6" />
        </div>
      </div>
    </div>
  );
}

export function SanityBanner({ placement, className, fallback }: SanityBannerProps) {
  const brand = useBrand();
  const [banner, setBanner] = useState<SanityBannerType | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSanityConfigured()) {
      setLoaded(true);
      return;
    }

    getBanners(brand.slug, placement, "sv")
      .then((banners) => {
        if (banners.length > 0) {
          setBanner(banners[0]);
        }
      })
      .catch(() => {
        // Keep fallback on error
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [brand.slug, placement]);

  // Before Sanity loads (and on server render), show fallback to avoid hydration mismatch
  if (!loaded || !banner) {
    return <>{fallback ?? null}</>;
  }

  // Determine background style
  const hasImage = !!banner.image;
  const hasGradient = !!banner.gradientFrom;

  const backgroundStyle: React.CSSProperties = hasGradient
    ? {
        background: `linear-gradient(135deg, ${banner.gradientFrom}, ${banner.gradientTo || brand.colors.primary})`,
      }
    : {};

  const imageUrl = hasImage
    ? urlFor(banner.image!).width(1920).quality(85).url()
    : undefined;

  return (
    <section
      className={`relative overflow-hidden ${className || ""}`}
      style={backgroundStyle}
    >
      {/* Background image */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
            {banner.headline}
          </h1>
          {banner.subheadline && (
            <p className="mt-4 text-lg sm:text-xl text-white/70 max-w-md">
              {banner.subheadline}
            </p>
          )}
          {banner.ctaText && banner.ctaUrl && (
            <div className="mt-8">
              <Link
                href={banner.ctaUrl}
                className="inline-flex items-center px-8 py-3.5 rounded-full font-bold text-white transition-colors"
                style={{ backgroundColor: brand.colors.accent }}
              >
                {banner.ctaText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
