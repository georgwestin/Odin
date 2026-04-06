"use client";

import Link from "next/link";

export interface LiveGameCardProps {
  id: string;
  name: string;
  provider: string;
  category: string;
  thumbnailUrl: string;
  isLive: boolean;
  playerCount: number;
  dealerName: string;
  minBet: number;
  maxBet: number;
  tableId: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  Evolution: "from-red-700 to-red-900",
  "Pragmatic Play": "from-blue-600 to-blue-900",
  NetEnt: "from-emerald-600 to-emerald-900",
  Playtech: "from-purple-600 to-purple-900",
  Ezugi: "from-amber-600 to-amber-900",
  "Authentic Gaming": "from-slate-600 to-slate-900",
};

function formatBet(amount: number): string {
  return new Intl.NumberFormat("sv-SE").format(amount);
}

export function LiveGameCard({
  id,
  name,
  provider,
  thumbnailUrl,
  isLive,
  playerCount,
  dealerName,
  minBet,
  maxBet,
  tableId,
}: LiveGameCardProps) {
  const bgGradient = PROVIDER_COLORS[provider] || "from-gray-700 to-gray-900";

  return (
    <Link
      href={`/live-casino/${id}`}
      className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02]"
    >
      <div className={`aspect-[4/3] bg-gradient-to-br ${bgGradient} relative flex flex-col justify-between p-4`}>
        {/* Top row: LIVE badge + player count */}
        <div className="flex items-start justify-between">
          {/* LIVE badge */}
          {isLive && (
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-pill">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live
            </span>
          )}

          {/* Player count */}
          <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-pill">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="opacity-80"
            >
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            {playerCount}
          </span>
        </div>

        {/* Center: game name */}
        <div className="flex-1 flex items-center justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="relative z-10 text-center">
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-lg">
              {name}
            </h3>
            <p className="text-white/60 text-xs mt-1">{provider}</p>
          </div>
        </div>

        {/* Bottom: dealer + limits */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/70 text-[11px]">Dealer</p>
            <p className="text-white text-xs font-semibold">{dealerName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[11px]">Insats</p>
            <p className="text-white text-[11px] font-medium">
              {formatBet(minBet)} kr &ndash; {formatBet(maxBet)} kr
            </p>
          </div>
        </div>

        {/* Hover overlay with join button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-sm px-8 py-2.5 rounded-pill transform scale-90 group-hover:scale-100 transition-transform duration-200">
            G&aring; med
          </span>
        </div>
      </div>
    </Link>
  );
}
