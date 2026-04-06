"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useBrand } from "@/components/BrandProvider";

interface FeaturedGame {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  category: string;
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
  { id: "1", name: "Starburst", provider: "NetEnt", thumbnailUrl: "", category: "slots" },
  { id: "2", name: "Book of Dead", provider: "Play'n GO", thumbnailUrl: "", category: "slots" },
  { id: "3", name: "Mega Moolah", provider: "Microgaming", thumbnailUrl: "", category: "slots" },
  { id: "4", name: "Gonzo's Quest", provider: "NetEnt", thumbnailUrl: "", category: "slots" },
  { id: "5", name: "Lightning Roulette", provider: "Evolution", thumbnailUrl: "", category: "live" },
  { id: "6", name: "Crazy Time", provider: "Evolution", thumbnailUrl: "", category: "live" },
];

const PLACEHOLDER_EVENTS: LiveEvent[] = [
  {
    id: "e1",
    sportName: "Football",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      {
        name: "Match Result",
        selections: [
          { id: "s1", name: "Arsenal", odds: 1.65 },
          { id: "s2", name: "Draw", odds: 3.8 },
          { id: "s3", name: "Chelsea", odds: 5.2 },
        ],
      },
    ],
  },
  {
    id: "e2",
    sportName: "Tennis",
    competitionName: "ATP Australian Open",
    homeTeam: "Djokovic",
    awayTeam: "Alcaraz",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [
      {
        name: "Match Winner",
        selections: [
          { id: "s4", name: "Djokovic", odds: 2.1 },
          { id: "s5", name: "Alcaraz", odds: 1.75 },
        ],
      },
    ],
  },
  {
    id: "e3",
    sportName: "Basketball",
    competitionName: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    score: { home: 88, away: 92 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      {
        name: "Match Winner",
        selections: [
          { id: "s6", name: "Lakers", odds: 2.35 },
          { id: "s7", name: "Celtics", odds: 1.55 },
        ],
      },
    ],
  },
];

export default function HomePage() {
  const brand = useBrand();
  const [games, setGames] = useState<FeaturedGame[]>(PLACEHOLDER_GAMES);
  const [events, setEvents] = useState<LiveEvent[]>(PLACEHOLDER_EVENTS);

  useEffect(() => {
    api
      .get<{ items: FeaturedGame[] }>("/casino/games?featured=true&limit=6")
      .then((res) => setGames(res.items))
      .catch(() => {});

    api
      .get<{ items: LiveEvent[] }>("/sports/events?live=true&limit=6")
      .then((res) => setEvents(res.items))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-secondary via-brand-background to-brand-surface-alt">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--brand-primary)_0%,_transparent_50%)] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-white leading-tight">
              Your Game.{" "}
              <span className="text-brand-primary">Your Rules.</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-brand-text-muted max-w-lg">
              Casino slots, live dealers, and sports betting -- all in one
              platform. Welcome to {brand.name}.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {brand.features.casino && (
                <Link
                  href="/casino"
                  className="bg-brand-primary hover:bg-brand-primary-hover text-black font-bold px-8 py-3 rounded-xl transition-colors text-sm"
                >
                  Play Casino
                </Link>
              )}
              {brand.features.sports && (
                <Link
                  href="/sports"
                  className="bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-3 rounded-xl transition-colors border border-white/10 text-sm"
                >
                  Bet on Sports
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      {brand.features.casino && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-white">
              Featured Games
            </h2>
            <Link
              href="/casino"
              className="text-brand-primary hover:text-brand-accent text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/casino/${game.id}`}
                className="group relative bg-brand-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-brand-primary/50 transition-all"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-brand-surface-alt to-brand-secondary flex items-center justify-center">
                  {game.thumbnailUrl ? (
                    <img
                      src={game.thumbnailUrl}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <circle cx="15.5" cy="8.5" r="1.5" />
                          <circle cx="8.5" cy="15.5" r="1.5" />
                          <circle cx="15.5" cy="15.5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                        </svg>
                      </div>
                      <p className="text-xs text-brand-text-muted">
                        {game.provider}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white truncate">
                    {game.name}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    {game.provider}
                  </p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-brand-primary text-black font-bold text-sm px-6 py-2 rounded-lg">
                    Play Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Events */}
      {brand.features.sports && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-white">
              Live & Upcoming
            </h2>
            <Link
              href="/sports"
              className="text-brand-primary hover:text-brand-accent text-sm font-medium"
            >
              All Sports
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/sports/${event.id}`}
                className="bg-brand-surface rounded-xl p-4 hover:ring-1 hover:ring-brand-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-brand-text-muted">
                    {event.sportName} - {event.competitionName}
                  </span>
                  {event.isLive ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-danger">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-xs text-brand-text-muted">
                      {new Date(event.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {event.homeTeam}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {event.awayTeam}
                    </p>
                  </div>
                  {event.score && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-primary">
                        {event.score.home}
                      </p>
                      <p className="text-sm font-bold text-brand-primary">
                        {event.score.away}
                      </p>
                    </div>
                  )}
                </div>

                {event.markets[0] && (
                  <div className="flex gap-2">
                    {event.markets[0].selections.map((sel) => (
                      <div
                        key={sel.id}
                        className="flex-1 bg-brand-surface-alt/60 rounded-lg py-2 text-center"
                      >
                        <p className="text-[10px] text-brand-text-muted truncate px-1">
                          {sel.name}
                        </p>
                        <p className="text-sm font-bold text-brand-primary">
                          {sel.odds.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-brand-primary/20 via-brand-surface to-brand-primary/10 rounded-2xl p-8 sm:p-12 border border-brand-primary/20">
          <div className="max-w-lg">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
              Welcome Bonus
            </h2>
            <p className="text-brand-text-muted mb-6">
              Get up to 100% on your first deposit plus free spins on selected
              slots. Start your journey with {brand.name} today.
            </p>
            <Link
              href="/register"
              className="inline-block bg-brand-primary hover:bg-brand-primary-hover text-black font-bold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Claim Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-text-muted">
            <p>{brand.licenseText}</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Responsible Gambling
              </Link>
              <a
                href={`mailto:${brand.supportEmail}`}
                className="hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
