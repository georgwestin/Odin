"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GameCard } from "@/components/GameCard";

interface Game {
  id: string;
  name: string;
  provider: string;
  category: string;
  thumbnailUrl: string;
  rtp: string;
  isNew: boolean;
  isPopular: boolean;
  isExclusive: boolean;
}

const PROVIDERS = [
  "NetEnt",
  "Evolution",
  "Pragmatic Play",
  "Play'n GO",
  "Microgaming",
  "Yggdrasil",
  "Red Tiger",
  "Big Time Gaming",
  "Nolimit City",
  "Push Gaming",
  "Hacksaw Gaming",
  "ELK Studios",
];

const SORT_OPTIONS = [
  { id: "popular", label: "Populära" },
  { id: "new", label: "Nya" },
  { id: "az", label: "A-Ö" },
];

const PLACEHOLDER_GAMES: Game[] = [
  // Slots
  { id: "g1", name: "Starburst", provider: "NetEnt", category: "slots", thumbnailUrl: "", rtp: "96.1%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g2", name: "Book of Dead", provider: "Play'n GO", category: "slots", thumbnailUrl: "", rtp: "96.2%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g3", name: "Gonzo's Quest", provider: "NetEnt", category: "slots", thumbnailUrl: "", rtp: "95.9%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g4", name: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g5", name: "Gates of Olympus", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g6", name: "Big Bass Bonanza", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "", rtp: "96.7%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g7", name: "Dead or Alive 2", provider: "NetEnt", category: "slots", thumbnailUrl: "", rtp: "96.8%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g8", name: "Reactoonz", provider: "Play'n GO", category: "slots", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g9", name: "Vikings Unleashed", provider: "Big Time Gaming", category: "megaways", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g10", name: "The Dog House", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: false, isExclusive: false },
  // Jackpots
  { id: "g11", name: "Mega Moolah", provider: "Microgaming", category: "jackpots", thumbnailUrl: "", rtp: "88.1%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g12", name: "Mega Fortune", provider: "NetEnt", category: "jackpots", thumbnailUrl: "", rtp: "96.6%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g13", name: "Hall of Gods", provider: "NetEnt", category: "jackpots", thumbnailUrl: "", rtp: "95.5%", isNew: false, isPopular: false, isExclusive: false },
  // Live Casino
  { id: "g14", name: "Lightning Roulette", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "97.3%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g15", name: "Crazy Time", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "95.5%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g16", name: "Monopoly Live", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "96.2%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g17", name: "Dream Catcher", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "96.6%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g18", name: "Mega Ball", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "95.4%", isNew: true, isPopular: false, isExclusive: false },
  // Table Games
  { id: "g19", name: "Blackjack Classic", provider: "Evolution", category: "table", thumbnailUrl: "", rtp: "99.5%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g20", name: "European Roulette", provider: "NetEnt", category: "table", thumbnailUrl: "", rtp: "97.3%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g21", name: "Baccarat Pro", provider: "Play'n GO", category: "table", thumbnailUrl: "", rtp: "98.9%", isNew: false, isPopular: false, isExclusive: false },
  // Megaways
  { id: "g22", name: "Bonanza Megaways", provider: "Big Time Gaming", category: "megaways", thumbnailUrl: "", rtp: "96.0%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g23", name: "Extra Chilli", provider: "Big Time Gaming", category: "megaways", thumbnailUrl: "", rtp: "96.2%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g24", name: "Gems Bonanza", provider: "Pragmatic Play", category: "megaways", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: false, isExclusive: false },
  // Bonus Buy
  { id: "g25", name: "Money Train 3", provider: "Nolimit City", category: "bonus_buy", thumbnailUrl: "", rtp: "96.4%", isNew: true, isPopular: true, isExclusive: false },
  { id: "g26", name: "Mental", provider: "Nolimit City", category: "bonus_buy", thumbnailUrl: "", rtp: "96.3%", isNew: true, isPopular: true, isExclusive: false },
  { id: "g27", name: "Tombstone RIP", provider: "Nolimit City", category: "bonus_buy", thumbnailUrl: "", rtp: "96.1%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g28", name: "Fruit Party", provider: "Pragmatic Play", category: "bonus_buy", thumbnailUrl: "", rtp: "96.5%", isNew: false, isPopular: false, isExclusive: false },
  // More slots variety
  { id: "g29", name: "Fire Joker", provider: "Play'n GO", category: "slots", thumbnailUrl: "", rtp: "96.2%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g30", name: "Valley of the Gods", provider: "Yggdrasil", category: "slots", thumbnailUrl: "", rtp: "96.2%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g31", name: "Piggy Riches", provider: "Red Tiger", category: "slots", thumbnailUrl: "", rtp: "96.4%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g32", name: "Razor Shark", provider: "Push Gaming", category: "slots", thumbnailUrl: "", rtp: "96.7%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g33", name: "Chaos Crew", provider: "Hacksaw Gaming", category: "bonus_buy", thumbnailUrl: "", rtp: "96.3%", isNew: true, isPopular: true, isExclusive: false },
  { id: "g34", name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "bonus_buy", thumbnailUrl: "", rtp: "96.4%", isNew: true, isPopular: true, isExclusive: true },
  { id: "g35", name: "Tahiti Gold", provider: "ELK Studios", category: "slots", thumbnailUrl: "", rtp: "96.3%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g36", name: "Kaiju", provider: "ELK Studios", category: "slots", thumbnailUrl: "", rtp: "96.3%", isNew: true, isPopular: false, isExclusive: false },
  { id: "g37", name: "Dragon Tiger", provider: "Evolution", category: "live", thumbnailUrl: "", rtp: "96.3%", isNew: false, isPopular: false, isExclusive: false },
  { id: "g38", name: "Immortal Romance", provider: "Microgaming", category: "slots", thumbnailUrl: "", rtp: "96.9%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g39", name: "San Quentin xWays", provider: "Nolimit City", category: "bonus_buy", thumbnailUrl: "", rtp: "96.0%", isNew: false, isPopular: true, isExclusive: false },
  { id: "g40", name: "Jammin' Jars 2", provider: "Push Gaming", category: "slots", thumbnailUrl: "", rtp: "96.4%", isNew: false, isPopular: false, isExclusive: false },
];

const PAGE_SIZE = 20;

export default function CasinoPage() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || searchParams.get("category") || "";

  const [games, setGames] = useState<Game[]>(PLACEHOLDER_GAMES);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Game[] }>("/casino/games")
      .then((res) => setGames(res.items))
      .catch(() => {});
  }, []);

  // Map URL cat params to category filters
  const categoryFromUrl = useMemo(() => {
    const catMap: Record<string, string> = {
      jackpots: "jackpots",
      nya: "new",
      exklusiva: "exclusive",
      klassiker: "slots",
      bonuskop: "bonus_buy",
      bordsspel: "table",
      live: "live",
    };
    return catMap[initialCat] || "";
  }, [initialCat]);

  const providers = useMemo(() => {
    const set = new Set(games.map((g) => g.provider));
    return Array.from(set).sort();
  }, [games]);

  const filtered = useMemo(() => {
    let result = games.filter((game) => {
      // Category from URL
      if (categoryFromUrl === "new" && !game.isNew) return false;
      if (categoryFromUrl === "exclusive" && !game.isExclusive) return false;
      if (
        categoryFromUrl &&
        categoryFromUrl !== "new" &&
        categoryFromUrl !== "exclusive" &&
        game.category !== categoryFromUrl
      )
        return false;

      if (providerFilter !== "all" && game.provider !== providerFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          game.name.toLowerCase().includes(q) ||
          game.provider.toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Sort
    if (sortBy === "popular") {
      result = [...result].sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
    } else if (sortBy === "new") {
      result = [...result].sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      });
    } else if (sortBy === "az") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "sv"));
    }

    return result;
  }, [games, search, providerFilter, sortBy, categoryFromUrl]);

  const visibleGames = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Promotional Banner */}
      <div className="max-w-[1400px] mx-auto px-4 pt-5 pb-2">
        <div
          className="rounded-2xl px-6 py-5 md:px-10 md:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #818cf8 40%, #a5b4fc 100%)",
          }}
        >
          <div>
            <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1 font-body">
              Swedbet Casino
            </p>
            <h2 className="text-white text-xl md:text-2xl font-bold font-body">
              Veckans topplista
            </h2>
            <p className="text-white/80 text-sm mt-1 font-body">
              Upptäck de mest spelade spelen just nu
            </p>
          </div>
          <a
            href="#games"
            className="shrink-0 bg-white text-[#6366f1] font-bold text-sm px-7 py-2.5 rounded-full hover:bg-white/90 transition-colors font-body"
          >
            Spela nu
          </a>
        </div>
      </div>

      {/* Filter Bar — sticky below header */}
      <div className="sticky top-[132px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-0">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
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
              placeholder="Sök spel eller leverantör..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full bg-[#f5f5f7] border-none rounded-full pl-10 pr-4 py-2.5 text-sm text-[#272b33] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 font-body"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Provider Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProviderDropdownOpen(!providerDropdownOpen);
                  setSortDropdownOpen(false);
                }}
                className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-200 transition-colors font-body whitespace-nowrap"
              >
                <span>{providerFilter === "all" ? "Leverantör" : providerFilter}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </button>
              {providerDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProviderDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
                    <button
                      onClick={() => { setProviderFilter("all"); setProviderDropdownOpen(false); setVisibleCount(PAGE_SIZE); }}
                      className={`w-full text-left px-4 py-2 text-sm font-body hover:bg-gray-50 ${providerFilter === "all" ? "font-semibold text-[#0066FF]" : "text-[#272b33]"}`}
                    >
                      Alla leverantörer
                    </button>
                    {providers.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setProviderFilter(p); setProviderDropdownOpen(false); setVisibleCount(PAGE_SIZE); }}
                        className={`w-full text-left px-4 py-2 text-sm font-body hover:bg-gray-50 ${providerFilter === p ? "font-semibold text-[#0066FF]" : "text-[#272b33]"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setProviderDropdownOpen(false);
                }}
                className="flex items-center gap-2 bg-[#f5f5f7] rounded-full px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-200 transition-colors font-body whitespace-nowrap"
              >
                <span>{SORT_OPTIONS.find((s) => s.id === sortBy)?.label || "Sortera"}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </button>
              {sortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id); setSortDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm font-body hover:bg-gray-50 ${sortBy === opt.id ? "font-semibold text-[#0066FF]" : "text-[#272b33]"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div id="games" className="max-w-[1400px] mx-auto px-4 pt-6 pb-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg font-body">Inga spel hittades.</p>
            <p className="text-gray-400 text-sm mt-1 font-body">
              Prova att ändra din sökning eller dina filter.
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-xs text-gray-400 mb-4 font-body">
              Visar {Math.min(visibleCount, filtered.length)} av {filtered.length} spel
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {visibleGames.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  name={game.name}
                  provider={game.provider}
                  thumbnailUrl={game.thumbnailUrl}
                  rtp={game.rtp}
                  isNew={game.isNew}
                  isPopular={game.isPopular}
                  isExclusive={game.isExclusive}
                />
              ))}
            </div>

            {/* Load More */}
            {remaining > 0 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="border border-gray-300 hover:border-[#272b33] text-[#272b33] font-semibold text-sm px-8 py-3 rounded-full transition-colors font-body"
                >
                  Visa fler ({remaining} kvar)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
