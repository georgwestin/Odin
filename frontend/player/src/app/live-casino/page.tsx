"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LiveGameCard, LiveGameCardProps } from "@/components/LiveGameCard";

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

/* Top 3 featured tables -- sorted by player count */
const FEATURED_GAMES = [...LIVE_GAMES]
  .sort((a, b) => b.playerCount - a.playerCount)
  .slice(0, 3);

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function LiveCasinoPage() {
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    if (category === "all") return LIVE_GAMES;
    return LIVE_GAMES.filter((g) => g.category === category);
  }, [category]);

  function formatBet(amount: number): string {
    return new Intl.NumberFormat("sv-SE").format(amount);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/*  Hero Section (Relume Product10 style header)                  */}
      {/* ============================================================ */}
      <section className="relative bg-gradient-to-br from-[#0f1629] via-[#1a1040] to-[#2d1b69] overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
          {/* Header text -- Relume Product10 centered style */}
          <div className="text-center mb-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-semibold text-white/60 mb-3"
            >
              Utforska
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
            >
              Live Casino
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-white/60 text-base sm:text-lg max-w-md mx-auto"
            >
              Spela med riktiga dealers i realtid
            </motion.p>
          </div>

          {/* Featured tables -- horizontal scroll on mobile, 3-col on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible">
            {FEATURED_GAMES.map((game) => {
              const bgGradient =
                game.provider === "Evolution"
                  ? "from-red-700 to-red-900"
                  : game.provider === "Pragmatic Play"
                  ? "from-blue-600 to-blue-900"
                  : "from-gray-700 to-gray-900";

              return (
                <a
                  key={game.id}
                  href={`/live-casino/${game.id}`}
                  className={`group relative shrink-0 w-[85vw] sm:w-auto rounded-2xl overflow-hidden bg-gradient-to-br ${bgGradient} p-5 sm:p-6 flex flex-col justify-between min-h-[180px] hover:scale-[1.02] transition-transform duration-200`}
                >
                  {/* LIVE badge */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-pill">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                      </span>
                      Live
                    </span>
                    <span className="inline-flex items-center gap-1 text-white/80 text-xs font-medium">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      {game.playerCount} spelare
                    </span>
                  </div>

                  {/* Game name */}
                  <div className="mt-auto">
                    <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight drop-shadow-lg">
                      {game.name}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">
                      {game.provider} &middot; Dealer: {game.dealerName}
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">
                      Min {formatBet(game.minBet)} kr &ndash; Max{" "}
                      {formatBet(game.maxBet)} kr
                    </p>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-2xl">
                    <span className="bg-brand-accent text-white font-bold text-sm px-8 py-2.5 rounded-pill transform scale-90 group-hover:scale-100 transition-transform duration-200">
                      G&aring; med
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Main content (Relume Product10 grid style)                    */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
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

        {/* Game grid -- 3-col like Relume Product10 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-text-muted text-lg">
              Inga bord tillg&auml;ngliga just nu.
            </p>
            <p className="text-brand-text-muted text-sm mt-1">
              Prova att v&auml;lja en annan kategori.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((game) => (
              <LiveGameCard key={game.id} {...game} />
            ))}
          </motion.div>
        )}

        {/* View more button -- Relume Product10 style centered */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/live-casino"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
          >
            Visa alla bord
          </Link>
        </div>

        {/* ============================================================ */}
        {/*  Om Live Casino                                               */}
        {/* ============================================================ */}
        <section className="mt-16 mb-8 border-t border-brand-border pt-10">
          <h2 className="font-heading text-2xl font-bold text-brand-text mb-4">
            Om Live Casino
          </h2>
          <div className="max-w-3xl text-brand-text-muted text-sm leading-relaxed space-y-3">
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
            <p className="text-xs text-brand-text-muted/60">
              18+ | Spela ansvarsfullt | Stodlinjen.se
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
