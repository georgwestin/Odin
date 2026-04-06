"use client";

import Link from "next/link";

interface GameCardProps {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  rtp?: string;
  isNew?: boolean;
  isPopular?: boolean;
  isExclusive?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  NetEnt: "#1a8b4e",
  Evolution: "#cc0000",
  "Pragmatic Play": "#0074c8",
  "Play'n GO": "#e6007e",
  Microgaming: "#c4a030",
  Yggdrasil: "#7b2d8e",
  "Red Tiger": "#d4380d",
  "Big Time Gaming": "#1d3557",
  "Nolimit City": "#e63946",
  "Push Gaming": "#2a9d8f",
  "Hacksaw Gaming": "#f77f00",
  "ELK Studios": "#264653",
};

function getInitials(name: string): string {
  return name
    .split(/[\s:]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] || "#6366f1";
}

export function GameCard({
  id,
  name,
  provider,
  thumbnailUrl,
  rtp,
  isNew,
  isPopular,
  isExclusive,
}: GameCardProps) {
  const bgColor = getProviderColor(provider);
  const initials = getInitials(name);

  return (
    <Link
      href={`/casino/${id}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-white font-bold text-3xl tracking-wider font-body opacity-90">
              {initials}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {isNew && (
            <span className="bg-[#0066FF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              NYTT
            </span>
          )}
          {isPopular && (
            <span className="bg-[#FF9500] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              POPULÄRT
            </span>
          )}
          {isExclusive && (
            <span className="bg-[#7b2d8e] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              EXKLUSIVT
            </span>
          )}
        </div>

        {/* RTP tooltip on hover */}
        {rtp && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              RTP {rtp}
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-[#44c868] hover:bg-[#3ab85c] text-white font-bold text-sm px-8 py-2.5 rounded-full transform scale-90 group-hover:scale-100 transition-transform duration-200">
            Spela
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-[#272b33] truncate font-body">
          {name}
        </p>
        <p className="text-xs text-gray-500 font-body">{provider}</p>
      </div>
    </Link>
  );
}
