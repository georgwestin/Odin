"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface Game {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  category: string;
  isNew: boolean;
  isPopular: boolean;
}

const CATEGORIES = [
  { id: "all", label: "All Games" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Table Games" },
  { id: "live", label: "Live Casino" },
  { id: "jackpot", label: "Jackpots" },
  { id: "new", label: "New" },
  { id: "popular", label: "Popular" },
];

const PLACEHOLDER_GAMES: Game[] = [
  { id: "g1", name: "Starburst", provider: "NetEnt", thumbnailUrl: "", category: "slots", isNew: false, isPopular: true },
  { id: "g2", name: "Book of Dead", provider: "Play'n GO", thumbnailUrl: "", category: "slots", isNew: false, isPopular: true },
  { id: "g3", name: "Mega Moolah", provider: "Microgaming", thumbnailUrl: "", category: "jackpot", isNew: false, isPopular: true },
  { id: "g4", name: "Gonzo's Quest", provider: "NetEnt", thumbnailUrl: "", category: "slots", isNew: false, isPopular: false },
  { id: "g5", name: "Lightning Roulette", provider: "Evolution", thumbnailUrl: "", category: "live", isNew: false, isPopular: true },
  { id: "g6", name: "Crazy Time", provider: "Evolution", thumbnailUrl: "", category: "live", isNew: true, isPopular: true },
  { id: "g7", name: "Blackjack Classic", provider: "Evolution", thumbnailUrl: "", category: "table", isNew: false, isPopular: false },
  { id: "g8", name: "European Roulette", provider: "NetEnt", thumbnailUrl: "", category: "table", isNew: false, isPopular: false },
  { id: "g9", name: "Sweet Bonanza", provider: "Pragmatic Play", thumbnailUrl: "", category: "slots", isNew: true, isPopular: true },
  { id: "g10", name: "Gates of Olympus", provider: "Pragmatic Play", thumbnailUrl: "", category: "slots", isNew: true, isPopular: true },
  { id: "g11", name: "Monopoly Live", provider: "Evolution", thumbnailUrl: "", category: "live", isNew: false, isPopular: true },
  { id: "g12", name: "Big Bass Bonanza", provider: "Pragmatic Play", thumbnailUrl: "", category: "slots", isNew: false, isPopular: false },
  { id: "g13", name: "Mega Fortune", provider: "NetEnt", thumbnailUrl: "", category: "jackpot", isNew: false, isPopular: false },
  { id: "g14", name: "Baccarat Squeeze", provider: "Evolution", thumbnailUrl: "", category: "live", isNew: false, isPopular: false },
  { id: "g15", name: "Dead or Alive 2", provider: "NetEnt", thumbnailUrl: "", category: "slots", isNew: false, isPopular: true },
  { id: "g16", name: "Reactoonz", provider: "Play'n GO", thumbnailUrl: "", category: "slots", isNew: false, isPopular: false },
];

export default function CasinoPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [games, setGames] = useState<Game[]>(PLACEHOLDER_GAMES);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => {
    api
      .get<{ items: Game[] }>("/casino/games")
      .then((res) => setGames(res.items))
      .catch(() => {});
  }, []);

  const providers = useMemo(() => {
    const set = new Set(games.map((g) => g.provider));
    return Array.from(set).sort();
  }, [games]);

  const filtered = useMemo(() => {
    return games.filter((game) => {
      if (category === "new" && !game.isNew) return false;
      if (category === "popular" && !game.isPopular) return false;
      if (
        category !== "all" &&
        category !== "new" &&
        category !== "popular" &&
        game.category !== category
      )
        return false;

      if (providerFilter !== "all" && game.provider !== providerFilter)
        return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          game.name.toLowerCase().includes(q) ||
          game.provider.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [games, category, search, providerFilter]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Casino
        </h1>
        <p className="text-brand-text-muted">
          Browse our collection of {games.length}+ games
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search games or providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-surface border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="bg-brand-surface border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat.id
                ? "bg-brand-primary text-black"
                : "bg-brand-surface text-brand-text-muted hover:text-white hover:bg-brand-surface-alt"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-text-muted text-lg">No games found.</p>
          <p className="text-brand-text-muted text-sm mt-1">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((game) => (
            <Link
              key={game.id}
              href={`/casino/${game.id}`}
              className="group relative bg-brand-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-brand-primary/50 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-[3/4] bg-gradient-to-br from-brand-surface-alt to-brand-secondary flex items-center justify-center relative">
                {game.thumbnailUrl ? (
                  <img
                    src={game.thumbnailUrl}
                    alt={game.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-3">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <circle cx="15.5" cy="8.5" r="1.5" />
                        <circle cx="8.5" cy="15.5" r="1.5" />
                        <circle cx="15.5" cy="15.5" r="1.5" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {game.isNew && (
                    <span className="bg-brand-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                  {game.isPopular && (
                    <span className="bg-brand-warning text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                      HOT
                    </span>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-brand-primary text-black font-bold text-sm px-6 py-2 rounded-lg transform scale-90 group-hover:scale-100 transition-transform">
                    Play
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-white truncate">
                  {game.name}
                </p>
                <p className="text-xs text-brand-text-muted">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
