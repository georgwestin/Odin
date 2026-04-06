"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { GameCard } from "@/components/GameCard";
import { SportEventCard } from "@/components/SportEventCard";
import { QuickDeposit } from "@/components/QuickDeposit";
import { ResponsibleGambling } from "@/components/ResponsibleGambling";
import { SanityBanner } from "@/components/SanityBanner";

interface FeaturedGame {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  category: string;
  isNew?: boolean;
  isPopular?: boolean;
}

interface LiveEvent {
  id: string;
  sportName: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
  startTime: string;
  isLive: boolean;
  markets: {
    name: string;
    selections: {
      id: string;
      name: string;
      odds: number;
    }[];
  }[];
}

const PLACEHOLDER_GAMES: FeaturedGame[] = [
  { id: "sweet-bonanza-1000", name: "Sweet Bonanza 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/sweet_bonanza_1000-eaa318e2df1742ce95a0030564c8df04.png", category: "slots", isNew: true, isPopular: true },
  { id: "gates-of-olympus-1000", name: "Gates of Olympus 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/gates_of_olympus_1000-9079a11814b04e93a159e220ce7494c3.png", category: "slots", isNew: true, isPopular: true },
  { id: "wanted-dead-or-a-wild", name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", thumbnailUrl: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild-79b41f71993ec33e3c6f3c5e4f48570b.png", category: "slots", isPopular: true },
  { id: "mental", name: "Mental", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/mental-ff2d4673f3bb0120fb8424fa63108311.png", category: "slots", isPopular: true },
  { id: "fire-in-the-hole-3", name: "Fire in the Hole 3", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/fire-in-the-hole-3-f88f7401e66348b24a9af5c684677b00.png", category: "slots", isNew: true, isPopular: true },
  { id: "chaos-crew-2", name: "Chaos Crew 2", provider: "Hacksaw Gaming", thumbnailUrl: "https://cdn.mint.io/production/games/images/chaos-crew-2-2e03414eea4d8c276c69c5916f12dda4.png", category: "slots", isNew: true, isPopular: true },
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", category: "live", isPopular: true },
  { id: "tombstone-rip", name: "Tombstone RIP", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/tombstone-rip-3e1e531f095265057b1046919d3fb4e8.png", category: "slots", isPopular: true },
  { id: "starlight-princess-1000", name: "Starlight Princess 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/starlight-princess-1000-2bfa4c79244cf71474e66b8897b93b9f.png", category: "slots", isNew: true, isPopular: true },
  { id: "plinko", name: "Plinko", provider: "Spribe", thumbnailUrl: "https://cdn.mint.io/production/games/images/plinko-76a1ae7ca428ec1cc9497e4f52c76976.png", category: "instant", isPopular: true },
];

const PLACEHOLDER_EVENTS: LiveEvent[] = [
  {
    id: "e1",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "Malmo FF",
    awayTeam: "AIK",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [{ name: "1X2", selections: [{ id: "s1", name: "1", odds: 1.85 }, { id: "s2", name: "X", odds: 3.6 }, { id: "s3", name: "2", odds: 4.2 }] }],
  },
  {
    id: "e2",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Farjestad",
    awayTeam: "Frolunda",
    score: { home: 3, away: 2 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [{ name: "1X2", selections: [{ id: "s4", name: "1", odds: 2.1 }, { id: "s5", name: "X", odds: 4.0 }, { id: "s6", name: "2", odds: 2.8 }] }],
  },
  {
    id: "e3",
    sportName: "Tennis",
    competitionName: "ATP Stockholm Open",
    homeTeam: "Ruud",
    awayTeam: "Rune",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [{ name: "Vinnare", selections: [{ id: "s7", name: "Ruud", odds: 1.75 }, { id: "s8", name: "Rune", odds: 2.05 }] }],
  },
  {
    id: "e4",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    markets: [{ name: "1X2", selections: [{ id: "s9", name: "1", odds: 1.65 }, { id: "s10", name: "X", odds: 3.8 }, { id: "s11", name: "2", odds: 5.2 }] }],
  },
];

const CATEGORIES = [
  { id: "popular", label: "Populara" },
  { id: "new", label: "Nya" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Bordsspel" },
  { id: "live", label: "Live Casino" },
];

export default function HomePage() {
  const [games, setGames] = useState<FeaturedGame[]>(PLACEHOLDER_GAMES);
  const [events, setEvents] = useState<LiveEvent[]>(PLACEHOLDER_EVENTS);
  const [activeCategory, setActiveCategory] = useState("popular");

  useEffect(() => {
    api
      .get<{ items: FeaturedGame[] }>("/casino/games?featured=true&limit=10")
      .then((res) => setGames(res.items))
      .catch(() => {});

    api
      .get<{ items: LiveEvent[] }>("/sports/events?live=true&limit=6")
      .then((res) => setEvents(res.items))
      .catch(() => {});
  }, []);

  // Filter games by category (client-side for demo)
  const filteredGames = games.filter((g) => {
    if (activeCategory === "popular") return g.isPopular;
    if (activeCategory === "new") return g.isNew;
    return g.category === activeCategory;
  });

  const displayGames = filteredGames.length > 0 ? filteredGames : games.slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section — CMS-driven with static fallback */}
      <SanityBanner
        placement="hero"
        fallback={
          <section className="relative overflow-hidden bg-gradient-to-br from-brand-secondary via-[#1e2a4a] to-brand-primary/90">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,102,255,0.3)_0%,_transparent_60%)]" />
            <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
              <div className="max-w-xl">
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                  Valkommen till{" "}
                  <span className="text-brand-accent">Swedbet</span>
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-white/70 max-w-md">
                  Det smarta spelbolaget. Casino, betting och live casino med snabba
                  uttag.
                </p>
                <div className="mt-8">
                  <QuickDeposit />
                </div>
              </div>
            </div>
          </section>
        }
      />

      {/* Popular Games - Horizontal Scroll — dark section */}
      <section style={{ backgroundColor: "#010D13" }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-white">
              Populära spel
            </h2>
            <Link
              href="/casino"
              className="text-sm font-semibold"
              style={{ color: "#00CC9F" }}
            >
              Visa alla →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4">
            {games.slice(0, 8).map((game) => (
              <div key={game.id} className="shrink-0 w-40 sm:w-48">
                <GameCard
                  id={game.id}
                  name={game.name}
                  provider={game.provider}
                  thumbnailUrl={game.thumbnailUrl}
                  isNew={game.isNew}
                  isPopular={game.isPopular}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Tabs + Game Grid — dark section */}
      <section style={{ backgroundColor: "#010D13" }}>
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="shrink-0 px-5 py-2.5 rounded-pill text-sm font-medium transition-colors"
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: "#00CC9F", color: "#010D13", border: "1px solid #00CC9F" }
                    : { backgroundColor: "transparent", color: "#6b7a8d", border: "1px solid #28323D" }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Game Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
            {displayGames.map((game) => (
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
        </div>
      </section>

      {/* Sports Betting Preview - Dagens matcher */}
      <section className="bg-brand-surface-alt py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">
              Dagens matcher
            </h2>
            <Link
              href="/sports"
              className="text-brand-primary hover:text-brand-primary-hover text-sm font-semibold"
            >
              Alla sportevent
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
              <SportEventCard
                key={event.id}
                id={event.id}
                sportName={event.sportName}
                competitionName={event.competitionName}
                homeTeam={event.homeTeam}
                awayTeam={event.awayTeam}
                score={event.score}
                startTime={event.startTime}
                isLive={event.isLive}
                markets={event.markets}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Provider Logos */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-heading text-lg font-bold text-brand-text text-center mb-8">
          Spelleverantorer
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {["NetEnt", "Evolution", "Pragmatic Play", "Play'n GO", "Microgaming", "Yggdrasil", "Red Tiger", "Big Time Gaming"].map(
            (provider) => (
              <div
                key={provider}
                className="px-5 py-3 rounded-xl border border-brand-border bg-white text-sm font-medium text-brand-text-muted"
              >
                {provider}
              </div>
            )
          )}
        </div>
      </section>

      {/* Varfor Swedbet */}
      <section className="bg-brand-surface-alt py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-heading text-2xl font-bold text-brand-text text-center mb-10">
            Varfor Swedbet?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-brand-primary"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-text mb-2">
                Snabba uttag
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                Fa dina vinster direkt med Swish och Trustly. Uttag bearbetas
                inom minuter, inte dagar.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-brand-accent"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-text mb-2">
                Svenskt spelbolag
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                Licensierat av Spelinspektionen. Tryggt, sakert och fullt
                lagligt for svenska spelare.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-warning/10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-brand-warning"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-text mb-2">
                Basta spelen
              </h3>
              <p className="text-sm text-brand-text-muted leading-relaxed">
                Over 2000 spel fran varldens basta leverantorer. Slots, live
                casino, bordsspel och jackpottar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {["Swish", "Trustly", "Visa", "Mastercard", "Bankoverfor."].map(
            (method) => (
              <div
                key={method}
                className="px-5 py-2.5 rounded-pill border border-brand-border text-sm font-medium text-brand-text-muted"
              >
                {method}
              </div>
            )
          )}
        </div>
      </section>

      {/* Responsible Gambling */}
      <ResponsibleGambling />

      {/* Footer */}
      <footer className="bg-brand-secondary text-white/60">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-1 mb-3">
                <span className="font-heading font-black text-xl text-white">
                  Swed
                </span>
                <span className="font-heading font-black text-xl text-brand-primary">
                  bet
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Det smarta spelbolaget for svenska spelare. Licensierat av
                Spelinspektionen.
              </p>
            </div>
            {/* Casino */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Casino</h4>
              <div className="space-y-2">
                <Link href="/casino" className="block text-sm hover:text-white transition-colors">
                  Alla spel
                </Link>
                <Link href="/casino?category=slots" className="block text-sm hover:text-white transition-colors">
                  Slots
                </Link>
                <Link href="/casino?category=live" className="block text-sm hover:text-white transition-colors">
                  Live Casino
                </Link>
                <Link href="/casino?category=table" className="block text-sm hover:text-white transition-colors">
                  Bordsspel
                </Link>
              </div>
            </div>
            {/* Betting */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Betting
              </h4>
              <div className="space-y-2">
                <Link href="/sports" className="block text-sm hover:text-white transition-colors">
                  Alla sporter
                </Link>
                <Link href="/sports?sport=football" className="block text-sm hover:text-white transition-colors">
                  Fotboll
                </Link>
                <Link href="/sports?sport=hockey" className="block text-sm hover:text-white transition-colors">
                  Ishockey
                </Link>
                <Link href="/sports?sport=tennis" className="block text-sm hover:text-white transition-colors">
                  Tennis
                </Link>
              </div>
            </div>
            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">
                Support
              </h4>
              <div className="space-y-2">
                <Link href="#" className="block text-sm hover:text-white transition-colors">
                  Hjalpcenter
                </Link>
                <Link href="#" className="block text-sm hover:text-white transition-colors">
                  Kontakta oss
                </Link>
                <Link href="#" className="block text-sm hover:text-white transition-colors">
                  Villkor
                </Link>
                <Link href="#" className="block text-sm hover:text-white transition-colors">
                  Integritetspolicy
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>
              Swedbet drivs under svensk spellicens utfardad av
              Spelinspektionen. 18+ | Spela ansvarsfullt.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.stodlinjen.se"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                stodlinjen.se
              </a>
              <a
                href="https://www.spelpaus.se"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                spelpaus.se
              </a>
              <a
                href="mailto:support@swedbet.com"
                className="hover:text-white"
              >
                support@swedbet.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
