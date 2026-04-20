"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GameCard } from "@/components/GameCard";

/* ------------------------------------------------------------------ */
/*  Roulette game data                                                 */
/* ------------------------------------------------------------------ */

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

const ROULETTE_GAMES: Game[] = [
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", rtp: "97.30%", isNew: false, isPopular: true, isExclusive: false },
  { id: "roulette-lobby", name: "Roulette Lobby", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/roulette-lobby-59ce7a1b9dbc5743b752551934b961e0.png", rtp: "97.30%", isNew: false, isPopular: true, isExclusive: false },
  { id: "gravity-roulette", name: "Gravity Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/gravity-roulette-74aced5ec17e0c71d69b8678de082145.png", rtp: "97.30%", isNew: true, isPopular: true, isExclusive: false },
  { id: "rl-xxxtreme", name: "XXXTreme Lightning Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", rtp: "97.10%", isNew: true, isPopular: true, isExclusive: false },
  { id: "rl-swedish", name: "Swedish Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/roulette-lobby-59ce7a1b9dbc5743b752551934b961e0.png", rtp: "97.30%", isNew: false, isPopular: false, isExclusive: true },
  { id: "rl-auto", name: "Auto Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/gravity-roulette-74aced5ec17e0c71d69b8678de082145.png", rtp: "97.30%", isNew: false, isPopular: false, isExclusive: false },
  { id: "rl-immersive", name: "Immersive Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", rtp: "97.30%", isNew: false, isPopular: true, isExclusive: false },
  { id: "rl-speed", name: "Speed Roulette", provider: "Evolution", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/roulette-lobby-59ce7a1b9dbc5743b752551934b961e0.png", rtp: "97.30%", isNew: false, isPopular: false, isExclusive: false },
  { id: "rl-mega", name: "Mega Roulette", provider: "Pragmatic Play", category: "live", thumbnailUrl: "https://cdn.mint.io/production/games/images/gravity-roulette-74aced5ec17e0c71d69b8678de082145.png", rtp: "97.30%", isNew: true, isPopular: false, isExclusive: false },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Popul\u00e4ra" },
  { id: "new", label: "Nya" },
  { id: "az", label: "A-\u00d6" },
  { id: "rtp", label: "H\u00f6gst RTP" },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function RoulettePage() {
  const [sortBy, setSortBy] = useState("popular");

  const sorted = useMemo(() => {
    const games = [...ROULETTE_GAMES];
    if (sortBy === "popular") {
      return games.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
    } else if (sortBy === "new") {
      return games.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      });
    } else if (sortBy === "az") {
      return games.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    } else if (sortBy === "rtp") {
      return games.sort((a, b) => parseFloat(b.rtp) - parseFloat(a.rtp));
    }
    return games;
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ===================== HERO SECTION (Relume Product2 style) ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container mx-auto">
          <div className="mb-12 grid grid-cols-1 items-end gap-8 md:mb-16 md:grid-cols-[1fr_max-content] lg:mb-20 lg:gap-20">
            <div className="max-w-lg">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-3 font-semibold text-brand-text-muted md:mb-4"
              >
                Utforska
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-3 text-4xl font-bold text-brand-text md:mb-4 md:text-6xl lg:text-7xl"
              >
                Roulette
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-brand-text-muted md:text-lg"
              >
                Snurra hjulet och k&auml;nn sp&auml;nningen i v&aring;ra roulette-bord.
              </motion.p>
            </div>
            <div className="hidden md:flex">
              <Link
                href="/casino"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
              >
                Visa alla spel
              </Link>
            </div>
          </div>

          {/* Sort pills */}
          <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none mb-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  sortBy === opt.id
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-text-muted border-brand-border hover:text-brand-text hover:border-brand-text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Game Grid (Relume Product2 style -- 4 col) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-2 gap-x-5 gap-y-8 md:gap-x-8 md:gap-y-12 lg:grid-cols-4"
          >
            {sorted.map((game) => (
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
          </motion.div>
        </div>
      </section>

      {/* ===================== INFO SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-brand-text mb-6 md:text-3xl">
            Om Roulette
          </h2>
          <div className="text-brand-text-muted text-sm leading-relaxed space-y-4">
            <p>
              Roulette &auml;r det klassiska casinospelet d&auml;r sp&auml;nningen byggs upp
              med varje snurr av hjulet. Satsa p&aring; r&ouml;tt, svart, nummer eller
              kombinationer och se kulan best&auml;mma ditt &ouml;de.
            </p>
            <p>
              V&aring;rt roulette-utbud inkluderar Lightning Roulette med multiplicerade
              vinster, Immersive Roulette med slow-motion replays, och den
              exklusiva Swedish Roulette med svenskttalande dealer.
              Alla bord erbjuder europeisk roulette med enkel nolla f&ouml;r b&auml;sta m&ouml;jliga RTP.
            </p>
            <p className="text-xs text-brand-text-muted/60">
              18+ | Spela ansvarsfullt | Stodlinjen.se
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
