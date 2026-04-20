"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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
    <div className="min-h-screen font-body">
      {/* ===================== HEADER SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28" style={{ backgroundColor: "#2c5aa0" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-3 font-semibold text-white/70 md:mb-4"
            >
              Browse
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-4xl font-bold text-white md:text-6xl lg:text-7xl"
            >
              Roulette
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-white/70 md:text-lg"
            >
              Find your next favorite game in our collection.
            </motion.p>
          </div>

          {/* Sort pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mt-10">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  sortBy === opt.id
                    ? "bg-white text-[#2c5aa0] border-white"
                    : "bg-transparent text-white/80 border-white/30 hover:border-white hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== GAME CARD GRID ===================== */}
      <section className="px-[5%] py-12 md:py-16" style={{ backgroundColor: "#1a2634" }}>
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {sorted.map((game, idx) => (
              <Link
                key={game.id}
                href={`/casino/${game.id}`}
                className="group block rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
                style={{ backgroundColor: "#0f1923" }}
              >
                {/* Image area */}
                <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: "#1a2634" }}>
                  {game.thumbnailUrl ? (
                    <Image
                      src={game.thumbnailUrl}
                      alt={game.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2c5aa0]">
                      <span className="text-white/60 text-3xl font-bold">
                        {game.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {game.isNew && (
                      <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/90">
                        NYTT
                      </span>
                    )}
                    {game.isPopular && (
                      <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/90">
                        HOT
                      </span>
                    )}
                    {game.isExclusive && (
                      <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600/90">
                        EXKLUSIVT
                      </span>
                    )}
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
                        {game.provider}
                      </p>
                    </div>
                    <span className="text-white font-bold text-sm shrink-0">
                      ${(100 + idx * 25).toString()}
                    </span>
                  </div>

                  {/* Play now / View all button */}
                  <button
                    className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold transition-colors"
                    style={{ backgroundColor: "#fdf04d", color: "#1a2634" }}
                  >
                    {idx < 3 ? "View all" : "Play now"}
                  </button>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== INFO SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[#1a2634] mb-6 md:text-3xl">
            Om Roulette
          </h2>
          <div className="text-[#6b7a8d] text-sm leading-relaxed space-y-4">
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
            <p className="text-xs text-[#6b7a8d]/60">
              18+ | Spela ansvarsfullt | Stodlinjen.se
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
