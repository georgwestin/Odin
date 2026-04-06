"use client";

import Link from "next/link";

interface GameCardProps {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export function GameCard({
  id,
  name,
  provider,
  thumbnailUrl,
  isNew,
  isPopular,
}: GameCardProps) {
  return (
    <Link
      href={`/casino/${id}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-brand-surface-alt flex items-center justify-center relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-brand-primary"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <circle cx="15.5" cy="8.5" r="1.5" />
                <circle cx="8.5" cy="15.5" r="1.5" />
                <circle cx="15.5" cy="15.5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </div>
            <p className="text-xs text-brand-text-muted">{provider}</p>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isNew && (
            <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-pill">
              NYTT
            </span>
          )}
          {isPopular && (
            <span className="bg-brand-warning text-white text-[10px] font-bold px-2.5 py-0.5 rounded-pill">
              POPULART
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-brand-secondary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
          <span className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-sm px-8 py-2.5 rounded-pill transform scale-90 group-hover:scale-100 transition-transform">
            Spela
          </span>
          <span className="text-white/70 text-xs font-medium hover:text-white transition-colors cursor-pointer">
            Demo
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-brand-text truncate">
          {name}
        </p>
        <p className="text-xs text-brand-text-muted">{provider}</p>
      </div>
    </Link>
  );
}
