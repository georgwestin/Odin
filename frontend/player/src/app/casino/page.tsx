"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GameCard } from "@/components/GameCard";

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
  { id: "all", label: "Alla spel" },
  { id: "popular", label: "Populara" },
  { id: "new", label: "Nya spel" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Bordsspel" },
  { id: "live", label: "Live Casino" },
  { id: "jackpot", label: "Jackpottar" },
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
  const [visibleCount, setVisibleCount] = useState(12);

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">
            Casino
          </h1>
          <p className="text-brand-text-muted">
            Utforska vart utbud av {games.length}+ spel
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted"
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
              placeholder="Sok spel eller leverantor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-brand-border rounded-xl pl-10 pr-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          >
            <option value="all">Alla leverantorer</option>
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
              onClick={() => {
                setCategory(cat.id);
                setVisibleCount(12);
              }}
              className={`shrink-0 px-5 py-2.5 rounded-pill text-sm font-medium transition-colors border ${
                category === cat.id
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-brand-text-muted border-brand-border hover:text-brand-text hover:border-brand-text-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Game Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-text-muted text-lg">
              Inga spel hittades.
            </p>
            <p className="text-brand-text-muted text-sm mt-1">
              Prova att andra din sokning eller dina filter.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.slice(0, visibleCount).map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  name={game.name}
                  provider={game.provider}
                  thumbnailUrl={game.thumbnailUrl}
                  isNew={game.isNew}
                  isPopular={game.isPopular}
                />
              ))}
            </div>

            {/* Load More */}
            {visibleCount < filtered.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="bg-white border border-brand-border hover:border-brand-primary hover:text-brand-primary text-brand-text-muted font-semibold text-sm px-8 py-3 rounded-pill transition-colors"
                >
                  Visa fler spel ({filtered.length - visibleCount} kvar)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
