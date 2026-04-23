"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LiveGameCardProps } from "@/components/LiveGameCard";

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "all", label: "Alla" },
  { id: "roulette", label: "Roulette" },
  { id: "blackjack", label: "Blackjack" },
  { id: "baccarat", label: "Baccarat" },
  { id: "gameshow", label: "Game Shows" },
  { id: "poker", label: "Poker" },
  { id: "dice", label: "Dice" },
];

/* ------------------------------------------------------------------ */
/*  Placeholder live games                                             */
/* ------------------------------------------------------------------ */

const LIVE_GAMES: LiveGameCardProps[] = [
  { id: "lg1",  name: "Lightning Roulette",         provider: "Evolution",        category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 38, dealerName: "Anna",    minBet: 10,  maxBet: 50000,  tableId: "evo_lr1" },
  { id: "lg2",  name: "Crazy Time",                 provider: "Evolution",        category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 47, dealerName: "Erik",    minBet: 1,   maxBet: 25000,  tableId: "evo_ct1" },
  { id: "lg3",  name: "Monopoly Live",              provider: "Evolution",        category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 31, dealerName: "Sofia",   minBet: 1,   maxBet: 10000,  tableId: "evo_ml1" },
  { id: "lg4",  name: "XXXTreme Lightning Roulette", provider: "Evolution",       category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 24, dealerName: "Maria",   minBet: 10,  maxBet: 50000,  tableId: "evo_xlr1" },
  { id: "lg5",  name: "Mega Ball",                  provider: "Evolution",        category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 19, dealerName: "Johan",   minBet: 1,   maxBet: 10000,  tableId: "evo_mb1" },
  { id: "lg6",  name: "Dream Catcher",              provider: "Evolution",        category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 15, dealerName: "Linda",   minBet: 1,   maxBet: 25000,  tableId: "evo_dc1" },
  { id: "lg7",  name: "Speed Baccarat",             provider: "Evolution",        category: "baccarat",  thumbnailUrl: "", isLive: true, playerCount: 12, dealerName: "Chen",    minBet: 50,  maxBet: 100000, tableId: "evo_sb1" },
  { id: "lg8",  name: "Blackjack VIP",              provider: "Evolution",        category: "blackjack", thumbnailUrl: "", isLive: true, playerCount: 7,  dealerName: "Marcus",  minBet: 500, maxBet: 100000, tableId: "evo_bv1" },
  { id: "lg9",  name: "Swedish Roulette",           provider: "Evolution",        category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 42, dealerName: "Lena",    minBet: 10,  maxBet: 50000,  tableId: "evo_sr1" },
  { id: "lg10", name: "Auto Roulette",              provider: "Evolution",        category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 28, dealerName: "Auto",    minBet: 5,   maxBet: 25000,  tableId: "evo_ar1" },
  { id: "lg11", name: "Infinite Blackjack",         provider: "Evolution",        category: "blackjack", thumbnailUrl: "", isLive: true, playerCount: 50, dealerName: "Karin",   minBet: 10,  maxBet: 25000,  tableId: "evo_ib1" },
  { id: "lg12", name: "Lightning Blackjack",        provider: "Evolution",        category: "blackjack", thumbnailUrl: "", isLive: true, playerCount: 33, dealerName: "David",   minBet: 50,  maxBet: 50000,  tableId: "evo_lb1" },
  { id: "lg13", name: "Immersive Roulette",         provider: "Evolution",        category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 21, dealerName: "Emma",    minBet: 10,  maxBet: 50000,  tableId: "evo_ir1" },
  { id: "lg14", name: "Baccarat Control Squeeze",   provider: "Evolution",        category: "baccarat",  thumbnailUrl: "", isLive: true, playerCount: 9,  dealerName: "Li",      minBet: 100, maxBet: 100000, tableId: "evo_bcs1" },
  { id: "lg15", name: "Sweet Bonanza CandyLand",    provider: "Pragmatic Play",   category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 36, dealerName: "Hanna",   minBet: 1,   maxBet: 10000,  tableId: "pp_sbc1" },
  { id: "lg16", name: "Mega Roulette",              provider: "Pragmatic Play",   category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 18, dealerName: "Clara",   minBet: 10,  maxBet: 25000,  tableId: "pp_mr1" },
  { id: "lg17", name: "Speed Blackjack",            provider: "Pragmatic Play",   category: "blackjack", thumbnailUrl: "", isLive: true, playerCount: 14, dealerName: "Oscar",   minBet: 50,  maxBet: 50000,  tableId: "pp_sb1" },
  { id: "lg18", name: "Casino Hold'em",             provider: "Evolution",        category: "poker",     thumbnailUrl: "", isLive: true, playerCount: 8,  dealerName: "Gustav",  minBet: 50,  maxBet: 25000,  tableId: "evo_ch1" },
  { id: "lg19", name: "Three Card Poker",           provider: "Evolution",        category: "poker",     thumbnailUrl: "", isLive: true, playerCount: 6,  dealerName: "Elsa",    minBet: 50,  maxBet: 25000,  tableId: "evo_tcp1" },
  { id: "lg20", name: "Lightning Dice",             provider: "Evolution",        category: "dice",      thumbnailUrl: "", isLive: true, playerCount: 22, dealerName: "Viktor",  minBet: 5,   maxBet: 10000,  tableId: "evo_ld1" },
  { id: "lg21", name: "Super Sic Bo",               provider: "Evolution",        category: "dice",      thumbnailUrl: "", isLive: true, playerCount: 16, dealerName: "Mai",     minBet: 10,  maxBet: 25000,  tableId: "evo_ssb1" },
  { id: "lg22", name: "Gonzo's Treasure Hunt",      provider: "Evolution",        category: "gameshow",  thumbnailUrl: "", isLive: true, playerCount: 29, dealerName: "Pablo",   minBet: 1,   maxBet: 10000,  tableId: "evo_gth1" },
  { id: "lg23", name: "Speed Roulette",             provider: "Evolution",        category: "roulette",  thumbnailUrl: "", isLive: true, playerCount: 35, dealerName: "Nadia",   minBet: 5,   maxBet: 25000,  tableId: "evo_spr1" },
  { id: "lg24", name: "Free Bet Blackjack",         provider: "Evolution",        category: "blackjack", thumbnailUrl: "", isLive: true, playerCount: 27, dealerName: "Simon",   minBet: 10,  maxBet: 25000,  tableId: "evo_fbb1" },
];

/* ------------------------------------------------------------------ */
/*  Provider color mapping for card backgrounds                        */
/* ------------------------------------------------------------------ */

const PROVIDER_BG: Record<string, string> = {
  Evolution: "#6b2132",
  "Pragmatic Play": "#1a3a6b",
};

function getProviderBg(provider: string): string {
  return PROVIDER_BG[provider] || "#2c3e50";
}

function formatBet(amount: number): string {
  return new Intl.NumberFormat("sv-SE").format(amount);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function LiveCasinoPage() {
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    if (category === "all") return LIVE_GAMES;
    return LIVE_GAMES.filter((g) => g.category === category);
  }, [category]);

  return (
    <div className="min-h-screen font-body">
      {/* ===================== HEADER SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-3 font-semibold text-[#6b7a8d] md:mb-4"
            >
              Browse
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-4xl font-bold text-[#1a2634] md:text-6xl lg:text-7xl"
            >
              Live Casino
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-[#6b7a8d] md:text-lg"
            >
              Find your next favorite game in our collection.
            </motion.p>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mt-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  category === cat.id
                    ? "bg-[#004B9A] text-white border-[#004B9A]"
                    : "bg-white text-[#6b7a8d] border-gray-300 hover:border-[#004B9A] hover:text-[#004B9A]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== GAME CARD GRID ===================== */}
      <section className="px-[5%] py-12 md:py-16" style={{ backgroundColor: "#1a2634" }}>
        <div className="container mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/60 text-lg">
                Inga bord tillg&auml;ngliga just nu.
              </p>
              <p className="text-white/40 text-sm mt-1">
                Prova att v&auml;lja en annan kategori.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.slice(0, 6).map((game, idx) => (
                <Link
                  key={game.id}
                  href={`/live-casino/${game.id}`}
                  className="group block rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "#0f1923" }}
                >
                  {/* Image/placeholder area */}
                  <div
                    className="aspect-[4/3] relative overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: getProviderBg(game.provider) }}
                  >
                    {/* LIVE badge */}
                    {game.isLive && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                          </span>
                          Live
                        </span>
                      </div>
                    )}

                    {/* Player count */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
                          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 00-3-3.87" />
                          <path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                        {game.playerCount}
                      </span>
                    </div>

                    {/* Game name overlay */}
                    <div className="relative z-10 text-center px-4">
                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                        {game.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {game.name}
                        </h3>
                        <p className="text-[#6b7a8d] text-xs mt-0.5">
                          {game.provider} &middot; Dealer: {game.dealerName}
                        </p>
                      </div>
                      <span className="text-white font-bold text-sm shrink-0">
                        ${formatBet(game.minBet)}
                      </span>
                    </div>

                    {/* Play now / View all button */}
                    <button
                      className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold transition-colors"
                      style={{ backgroundColor: "#FFD100", color: "#1a2634" }}
                    >
                      {idx < 3 ? "View all" : "Play now"}
                    </button>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {/* Second row of cards */}
          {filtered.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6"
            >
              {filtered.slice(6, 12).map((game) => (
                <Link
                  key={game.id}
                  href={`/live-casino/${game.id}`}
                  className="group block rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                  style={{ backgroundColor: "#0f1923" }}
                >
                  <div
                    className="aspect-[4/3] relative overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: getProviderBg(game.provider) }}
                  >
                    {game.isLive && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                          </span>
                          Live
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
                        {game.playerCount}
                      </span>
                    </div>
                    <div className="relative z-10 text-center px-4">
                      <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                        {game.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{game.name}</h3>
                        <p className="text-[#6b7a8d] text-xs mt-0.5">
                          {game.provider} &middot; Dealer: {game.dealerName}
                        </p>
                      </div>
                      <span className="text-white font-bold text-sm shrink-0">
                        ${formatBet(game.minBet)}
                      </span>
                    </div>
                    <button
                      className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold transition-colors"
                      style={{ backgroundColor: "#FFD100", color: "#1a2634" }}
                    >
                      Play now
                    </button>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {/* Bottom Play now button */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/live-casino"
              className="inline-flex items-center justify-center px-10 py-3.5 rounded-lg font-bold text-sm transition-colors"
              style={{ backgroundColor: "#FFD100", color: "#1a2634" }}
            >
              Play now
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== INFO SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#1a2634] mb-4 md:text-3xl">
            Om Live Casino
          </h2>
          <div className="text-[#6b7a8d] text-sm leading-relaxed space-y-3">
            <p>
              Live Casino ger dig den autentiska casinoupplevelsen direkt
              hemifr&aring;n. Professionella dealers leder spelen i realtid via
              HD-videostr&ouml;mning fr&aring;n v&aring;ra moderna studios.
            </p>
            <p>
              Spela klassiker som Roulette, Blackjack och Baccarat, eller prova
              popul&auml;ra game shows som Crazy Time och Monopoly Live.
              Interagera med dealers och andra spelare via livechatten f&ouml;r
              en social spelupplevelse.
            </p>
            <p>
              Alla v&aring;ra livebord drivs av ledande leverant&ouml;rer som
              Evolution och Pragmatic Play Live, och erbjuder insatsniv&aring;er
              f&ouml;r alla &mdash; fr&aring;n nyb&ouml;rjare till VIP-spelare.
              Borden &auml;r &ouml;ppna dygnet runt, s&aring; du kan spela
              n&auml;r det passar dig.
            </p>
            <p className="text-xs text-[#6b7a8d]/60">
              18+ | Spela ansvarsfullt | Stodlinjen.se
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
