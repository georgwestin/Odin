"use client";

import Link from "next/link";
import Image from "next/image";

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
  "PG Soft": "#6d28d9",
  Playson: "#0891b2",
  Spribe: "#059669",
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
      className="group relative block rounded-[10px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      style={{ backgroundColor: "#0f1923" }}
    >
      {/* Dark card container with game image */}
      <div className="aspect-[3/4] relative overflow-hidden" style={{ backgroundColor: "#1a2634" }}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center transition-all duration-300 group-hover:brightness-125"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-white font-bold text-3xl tracking-wider font-body opacity-80">
              {initials}
            </span>
          </div>
        )}

        {/* Subtle permanent bottom gradient for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, rgba(10,20,30,0.6) 0%, rgba(10,20,30,0.15) 35%, transparent 60%)",
          }}
        />

        {/* Hover glow overlay — mint.io style soft brightening */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,204,159,0.08) 0%, rgba(0,204,159,0.02) 50%, transparent 100%)",
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {isNew && (
            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0, 102, 255, 0.85)" }}>
              NYTT
            </span>
          )}
          {isPopular && (
            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(255, 149, 0, 0.85)" }}>
              HOT
            </span>
          )}
          {isExclusive && (
            <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(123, 45, 142, 0.85)" }}>
              EXKLUSIVT
            </span>
          )}
        </div>

        {/* RTP on hover */}
        {rtp && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <span className="text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              RTP {rtp}
            </span>
          </div>
        )}

        {/* Hover play button — appears centered */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <span
            className="text-white font-bold text-sm px-7 py-2 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg"
            style={{ backgroundColor: "#00CC9F" }}
          >
            Spela
          </span>
        </div>
      </div>

      {/* Game info — dark bottom section */}
      <div className="px-3 py-2.5" style={{ backgroundColor: "#0f1923" }}>
        <p className="text-[13px] font-semibold text-white truncate font-body">
          {name}
        </p>
        <p className="text-[11px] font-body" style={{ color: "#6b7a8d" }}>
          {provider}
        </p>
      </div>

      {/* Subtle border glow on hover */}
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(0, 204, 159, 0.15)",
        }}
      />
    </Link>
  );
}
