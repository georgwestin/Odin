"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
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
  "PG Soft",
  "Playson",
  "Spribe",
];

const SORT_OPTIONS = [
  { id: "popular", label: "Popul\u00e4ra" },
  { id: "new", label: "Nya" },
  { id: "az", label: "A-\u00d6" },
];

const PLACEHOLDER_GAMES: Game[] = [
  // Slots - Pragmatic Play
  { id: "sweet-bonanza-1000", name: "Sweet Bonanza 1000", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/sweet_bonanza_1000-eaa318e2df1742ce95a0030564c8df04.png", rtp: "96.50%", isNew: true, isPopular: true, isExclusive: false },
  { id: "gates-of-olympus-1000", name: "Gates of Olympus 1000", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/gates_of_olympus_1000-9079a11814b04e93a159e220ce7494c3.png", rtp: "96.50%", isNew: true, isPopular: true, isExclusive: false },
  { id: "gates-of-olympus-super-scatter", name: "Gates of Olympus Super Scatter", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/gates_of_olympus_super_scatter-29473d023de6d7906b19880fb7552593.png", rtp: "96.50%", isNew: true, isPopular: true, isExclusive: false },
  { id: "starlight-princess-1000", name: "Starlight Princess 1000", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/starlight-princess-1000-2bfa4c79244cf71474e66b8897b93b9f.png", rtp: "96.50%", isNew: true, isPopular: true, isExclusive: false },
  { id: "fruit-party-2", name: "Fruit Party 2", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/fruit-party-2-bf23587857c5701ef3e28888630e57a4.png", rtp: "96.53%", isNew: false, isPopular: true, isExclusive: false },
  { id: "big-bass-secrets-golden-lake", name: "Big Bass Secrets of the Golden Lake", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/big-bass-secrets-of-the-golden-lake-7c3f95d92c24ffe84f2e27b98e65a886.png", rtp: "96.07%", isNew: true, isPopular: false, isExclusive: false },
  { id: "dog-house-multihold", name: "Dog House Multihold", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/the-dog-house-multihold-027ed03d44a4e7e758820feab7fa82b2.png", rtp: "96.51%", isNew: false, isPopular: false, isExclusive: false },
  { id: "captain-kraken-megaways", name: "Captain Kraken Megaways", provider: "Pragmatic Play", category: "megaways", thumbnailUrl: "https://cdn.mint.io/production/games/images/captain-kraken-megaways-54f7cde6f7ab5ca51a3e78e77d29caad.png", rtp: "96.08%", isNew: true, isPopular: false, isExclusive: false },
  { id: "vikings-wild-feast", name: "Vikings Wild Feast", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/vikings-wild-feast-91f4cb2a8d9bf3aec7aace5450031432.png", rtp: "96.50%", isNew: false, isPopular: false, isExclusive: false },
  { id: "zeus-vs-hades-gods-of-war", name: "Zeus vs Hades: Gods of War", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/zeus-vs-hades-gods-of-war-5215fe933eb0fac798fa02b41311390b.png", rtp: "96.07%", isNew: false, isPopular: true, isExclusive: false },
  { id: "wild-bounty-showdown", name: "Wild Bounty Showdown", provider: "Pragmatic Play", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/wild-bounty-showdown-5fdec402723889a3f924ce9fa09e2f51.png", rtp: "96.50%", isNew: true, isPopular: false, isExclusive: false },

  // Slots - Hacksaw Gaming
  { id: "wanted-dead-or-a-wild", name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild-79b41f71993ec33e3c6f3c5e4f48570b.png", rtp: "96.38%", isNew: false, isPopular: true, isExclusive: true },
  { id: "chaos-crew", name: "Chaos Crew", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/chaos-crew-f969191e1ebe7d27e5306037f89d63b0.png", rtp: "96.30%", isNew: false, isPopular: true, isExclusive: false },
  { id: "chaos-crew-2", name: "Chaos Crew 2", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/chaos-crew-2-2e03414eea4d8c276c69c5916f12dda4.png", rtp: "96.35%", isNew: true, isPopular: true, isExclusive: false },
  { id: "monster-blox", name: "Monster Blox", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/monster-blox-9d40c3d14652187fc4c8418d810b776e.png", rtp: "96.29%", isNew: false, isPopular: false, isExclusive: false },
  { id: "mystic-potion", name: "Mystic Potion", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/mystic-potion-e32dd91f14580b50ee33bbba4dba3ab0.png", rtp: "96.28%", isNew: false, isPopular: false, isExclusive: false },
  { id: "yakuza-honor", name: "Yakuza Honor", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/yakuza-honor-86cbf0243077be5afdf41b6b19e59f25.png", rtp: "96.30%", isNew: true, isPopular: false, isExclusive: false },
  { id: "magic-clovers", name: "Magic Clovers", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/magic-clovers-f17e8b3f2eb0ab69e74f18d2f3e1bef3.png", rtp: "96.27%", isNew: false, isPopular: false, isExclusive: false },
  { id: "haunted-crypt", name: "Haunted Crypt", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/haunted-crypt-7345391baf2a03b487071f1b80d85d6b.png", rtp: "96.25%", isNew: true, isPopular: false, isExclusive: false },
  { id: "rip-city", name: "Rip City", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/rip-city-eebbb3de4f3adb1b3edb25376f55f20a.png", rtp: "96.30%", isNew: true, isPopular: false, isExclusive: true },
  { id: "devils-finger", name: "Devil's Finger", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/devils-finger-8adbc475f8a104bdfd91ef06270e7838.png", rtp: "96.28%", isNew: false, isPopular: false, isExclusive: false },
  { id: "orphan-organ", name: "Orphan Organ", provider: "Hacksaw Gaming", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/orphan-organ-802fc8425d8755a090b8e87f2928e319.png", rtp: "96.25%", isNew: true, isPopular: false, isExclusive: false },

  // Slots - Nolimit City
  { id: "fire-in-the-hole-3", name: "Fire in the Hole 3", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/fire-in-the-hole-3-f88f7401e66348b24a9af5c684677b00.png", rtp: "96.01%", isNew: true, isPopular: true, isExclusive: false },
  { id: "san-quentin-2-death-row", name: "San Quentin 2: Death Row", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/san-quentin-2-death-row-d19bc9e4446b9ce81fbef99de4d6b5d2.png", rtp: "96.03%", isNew: true, isPopular: true, isExclusive: false },
  { id: "mental", name: "Mental", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/mental-ff2d4673f3bb0120fb8424fa63108311.png", rtp: "96.29%", isNew: false, isPopular: true, isExclusive: false },
  { id: "mental-2", name: "Mental 2", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/mental-2-f1518ebf9d2483948665f4f33e482251.png", rtp: "96.30%", isNew: true, isPopular: true, isExclusive: false },
  { id: "tombstone-rip", name: "Tombstone RIP", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/tombstone-rip-3e1e531f095265057b1046919d3fb4e8.png", rtp: "96.08%", isNew: false, isPopular: true, isExclusive: false },
  { id: "deadwood-xnudge", name: "Deadwood xNudge", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/deadwood-xnudge-77026b1e5b5a016b9c4be72deffbe76c.png", rtp: "96.03%", isNew: false, isPopular: false, isExclusive: false },
  { id: "book-of-shadows", name: "Book of Shadows", provider: "Nolimit City", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/book-of-shadows-71d5e73f39d491e0b8d2c19f172cbf2b.png", rtp: "96.19%", isNew: false, isPopular: false, isExclusive: false },

  // Slots - Play'n GO
  { id: "robin-sherwood-marauders", name: "Robin Sherwood Marauders", provider: "Play'n GO", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/robin-sherwood-marauders-47b490fca86039719a70f70da5b61592.png", rtp: "96.20%", isNew: false, isPopular: false, isExclusive: false },

  // Slots - PG Soft
  { id: "egypts-book-of-mystery", name: "Egypt's Book of Mystery", provider: "PG Soft", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/egypts-book-of-mystery-25aeffd51f86ebcbe84a95b1bd4e7a76.png", rtp: "96.73%", isNew: false, isPopular: false, isExclusive: false },
  { id: "fortune-mouse", name: "Fortune Mouse", provider: "PG Soft", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/fortune-mouse-1f3348f08b3e9f2f9f5af9058a2b57d4.png", rtp: "96.76%", isNew: false, isPopular: false, isExclusive: false },
  { id: "mahjong-ways-2", name: "Mahjong Ways 2", provider: "PG Soft", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/mahjong-ways-2-b285fc9a480b242bda591c93092eb393.png", rtp: "96.95%", isNew: false, isPopular: true, isExclusive: false },

  // Slots - Playson
  { id: "solar-queen", name: "Solar Queen", provider: "Playson", category: "slots", thumbnailUrl: "https://cdn.mint.io/production/games/images/solar-queen-14f4559bdeab2c845d35e7cde42e90b8.png", rtp: "96.04%", isNew: false, isPopular: false, isExclusive: false },

  // Live Casino - Evolution
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", rtp: "97.30%", isNew: false, isPopular: true, isExclusive: false },
  { id: "roulette-lobby", name: "Roulette Lobby", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/roulette-lobby-59ce7a1b9dbc5743b752551934b961e0.png", rtp: "97.30%", isNew: false, isPopular: false, isExclusive: false },
  { id: "gravity-roulette", name: "Gravity Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/gravity-roulette-74aced5ec17e0c71d69b8678de082145.png", rtp: "97.30%", isNew: true, isPopular: false, isExclusive: false },
  { id: "power-blackjack", name: "Power Blackjack", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/power-blackjack-101a9f456267277ba54612308f582f9e.png", rtp: "98.80%", isNew: false, isPopular: false, isExclusive: false },

  // Table Games - Evolution
  { id: "blackjack-classic", name: "Blackjack Classic", provider: "Evolution", category: "table", thumbnailUrl: "https://cdn.mint.io/production/games/images/blackjack-classic-d8f428d769ac1da330f108587a3d8abc.png", rtp: "99.50%", isNew: false, isPopular: false, isExclusive: false },

  // Instant - Spribe
  { id: "plinko", name: "Plinko", provider: "Spribe", category: "instant", thumbnailUrl: "https://cdn.mint.io/production/games/images/plinko-76a1ae7ca428ec1cc9497e4f52c76976.png", rtp: "97.00%", isNew: false, isPopular: true, isExclusive: false },
];

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Featured games carousel (Relume Gallery19 style)                   */
/* ------------------------------------------------------------------ */

function FeaturedCarousel({ games }: { games: Game[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = games.filter((g) => g.isPopular).slice(0, 8);

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const child = scrollRef.current.children[index] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setActiveIndex(index);
    }
  };

  return (
    <section className="px-[5%] py-12 md:py-16 lg:py-20">
      <div className="container mx-auto">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-3 text-3xl font-bold text-white md:text-5xl lg:text-6xl">
            Popul&auml;ra spel
          </h2>
          <p className="text-white/60 md:text-lg">
            De mest spelade spelen just nu
          </p>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-none md:gap-4"
        >
          {featured.map((game, i) => (
            <div
              key={game.id}
              className="shrink-0 w-[45%] md:w-[24%]"
              onMouseEnter={() => setActiveIndex(i)}
            >
              <GameCard
                id={game.id}
                name={game.name}
                provider={game.provider}
                thumbnailUrl={game.thumbnailUrl}
                rtp={game.rtp}
                isNew={game.isNew}
                isPopular={game.isPopular}
                isExclusive={game.isExclusive}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-1">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`inline-block size-2 rounded-full transition-colors ${
                activeIndex === i ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

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
      {/* ===================== HERO / Featured Carousel (Relume Gallery19 style) ===================== */}
      <div style={{ backgroundColor: "#010D13" }}>
        <FeaturedCarousel games={games} />
      </div>

      {/* ===================== Browse header (Relume Product2 style) ===================== */}
      <section className="px-[5%] pt-12 pb-4 md:pt-16 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_max-content] lg:gap-12">
            <div className="max-w-lg">
              <p className="mb-2 font-semibold text-brand-text-muted text-sm md:mb-3">Utforska</p>
              <h1 className="mb-2 text-3xl font-bold text-brand-text md:mb-3 md:text-5xl lg:text-6xl">
                Slots
              </h1>
              <p className="text-brand-text-muted md:text-lg">
                Hitta ditt n&auml;sta favoritspel i v&aring;r samling.
              </p>
            </div>
            <div className="hidden md:flex">
              <Link
                href="/casino"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
              >
                Visa alla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar -- sticky below header */}
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
              placeholder="S\u00f6k spel eller leverant\u00f6r..."
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
                <span>{providerFilter === "all" ? "Leverant\u00f6r" : providerFilter}</span>
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
                      Alla leverant&ouml;rer
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

      {/* Game Grid -- dark background */}
      <div id="games" style={{ backgroundColor: "#010D13" }}>
        <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-12">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg font-body">Inga spel hittades.</p>
              <p className="text-gray-600 text-sm mt-1 font-body">
                Prova att &auml;ndra din s&ouml;kning eller dina filter.
              </p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <p className="text-xs mb-4 font-body" style={{ color: "#6b7a8d" }}>
                Visar {Math.min(visibleCount, filtered.length)} av {filtered.length} spel
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                    className="font-semibold text-sm px-8 py-3 rounded-full transition-colors font-body"
                    style={{
                      border: "1px solid #28323D",
                      color: "#6b7a8d",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#00CC9F";
                      e.currentTarget.style.color = "#00CC9F";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#28323D";
                      e.currentTarget.style.color = "#6b7a8d";
                    }}
                  >
                    Visa fler ({remaining} kvar)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===================== CTA Banner (Relume Cta31 style) ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28 bg-white">
        <div className="container mx-auto flex flex-col items-center">
          <div className="mb-12 max-w-lg text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-5 text-3xl font-bold text-brand-text md:text-5xl lg:text-6xl"
            >
              Skaffa din v&auml;lkomstbonus
            </motion.h2>
            <p className="text-brand-text-muted md:text-lg">
              Nya spelare f&aring;r upp till 500 bonuskrediter p&aring; sin f&ouml;rsta ins&auml;ttning. S&auml;kert spel garanterat.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors"
              >
                Spela
              </Link>
              <Link
                href="/bonuses"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
              >
                L&auml;s mer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FAQ Section (Relume Faq14 style) ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28 bg-gray-50">
        <div className="container mx-auto">
          <div className="mx-auto mb-12 w-full max-w-lg text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold text-brand-text md:text-5xl">
              Fr&aring;gor
            </h2>
            <p className="text-brand-text-muted md:text-lg">
              Allt du beh&ouml;ver veta om v&aring;ra spel.
            </p>
          </div>
          <div className="container grid grid-cols-1 items-start justify-center gap-y-10 md:grid-cols-3 md:gap-x-8 lg:gap-x-12">
            {[
              { q: "&Auml;r spelen r&auml;ttvisa?", a: "Alla v&aring;ra spel anv&auml;nder certifierad RNG-teknik och granskas regelbundet." },
              { q: "Vad &auml;r RTP?", a: "Return to Player visar procentandelen av insatta pengar som &aring;terbetalas till spelare &ouml;ver tid." },
              { q: "Kan jag spela p&aring; mobilen?", a: "Ja, v&aring;r plattform fungerar s&ouml;ml&ouml;st p&aring; alla enheter och webbl&auml;sare." },
              { q: "Hur fungerar uttag?", a: "Vinster bearbetas inom 24 timmar till din ursprungliga betalningsmetod." },
              { q: "&Auml;r mina pengar s&auml;kra?", a: "Vi anv&auml;nder bankniv&aring;kryptering och h&aring;ller alla spelarkonton p&aring; separata konton." },
              { q: "Vilka spel har b&auml;st odds?", a: "Blackjack och baccarat erbjuder vanligtvis de h&ouml;gsta RTP-v&auml;rdena." },
            ].map((item) => (
              <div key={item.q} className="flex w-full flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-primary">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3
                  className="mb-2 font-bold text-brand-text md:text-lg"
                  dangerouslySetInnerHTML={{ __html: item.q }}
                />
                <p
                  className="text-sm text-brand-text-muted"
                  dangerouslySetInnerHTML={{ __html: item.a }}
                />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <h4 className="mb-3 text-xl font-bold text-brand-text md:text-2xl">
              Beh&ouml;ver du mer hj&auml;lp?
            </h4>
            <p className="text-brand-text-muted md:text-lg">
              V&aring;rt supportteam &auml;r redo att svara p&aring; alla dina fr&aring;gor.
            </p>
            <div className="mt-6">
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
              >
                Kontakta oss
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
