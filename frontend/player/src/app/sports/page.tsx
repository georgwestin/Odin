"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { SportEventCard } from "@/components/SportEventCard";

interface SportEvent {
  id: string;
  sportId: string;
  sportName: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
  startTime: string;
  isLive: boolean;
  markets: {
    id: string;
    name: string;
    selections: {
      id: string;
      name: string;
      odds: number;
    }[];
  }[];
}

interface Sport {
  id: string;
  name: string;
  count: number;
}

const PLACEHOLDER_SPORTS: Sport[] = [
  { id: "football", name: "Fotboll", count: 42 },
  { id: "ice-hockey", name: "Ishockey", count: 18 },
  { id: "tennis", name: "Tennis", count: 15 },
  { id: "basketball", name: "Basket", count: 12 },
  { id: "handball", name: "Handboll", count: 8 },
  { id: "esports", name: "Esport", count: 10 },
  { id: "mma", name: "MMA", count: 5 },
];

const PLACEHOLDER_EVENTS: SportEvent[] = [
  {
    id: "e1",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "Malmo FF",
    awayTeam: "AIK",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      { id: "m1", name: "1X2", selections: [{ id: "s1", name: "1", odds: 1.85 }, { id: "s2", name: "X", odds: 3.6 }, { id: "s3", name: "2", odds: 4.2 }] },
    ],
  },
  {
    id: "e2",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    markets: [
      { id: "m2", name: "1X2", selections: [{ id: "s4", name: "1", odds: 1.65 }, { id: "s5", name: "X", odds: 3.8 }, { id: "s6", name: "2", odds: 5.2 }] },
    ],
  },
  {
    id: "e3",
    sportId: "ice-hockey",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Farjestad",
    awayTeam: "Frolunda",
    score: { home: 3, away: 2 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      { id: "m3", name: "1X2", selections: [{ id: "s7", name: "1", odds: 2.1 }, { id: "s8", name: "X", odds: 4.0 }, { id: "s9", name: "2", odds: 2.8 }] },
    ],
  },
  {
    id: "e4",
    sportId: "tennis",
    sportName: "Tennis",
    competitionName: "ATP Stockholm Open",
    homeTeam: "Ruud",
    awayTeam: "Rune",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [
      { id: "m4", name: "Vinnare", selections: [{ id: "s10", name: "Ruud", odds: 1.75 }, { id: "s11", name: "Rune", odds: 2.05 }] },
    ],
  },
  {
    id: "e5",
    sportId: "basketball",
    sportName: "Basket",
    competitionName: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    score: { home: 88, away: 92 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      { id: "m5", name: "Vinnare", selections: [{ id: "s12", name: "Lakers", odds: 2.35 }, { id: "s13", name: "Celtics", odds: 1.55 }] },
    ],
  },
  {
    id: "e6",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Bundesliga",
    homeTeam: "Bayern Munchen",
    awayTeam: "Dortmund",
    startTime: new Date(Date.now() + 86400000).toISOString(),
    isLive: false,
    markets: [
      { id: "m6", name: "1X2", selections: [{ id: "s14", name: "1", odds: 1.45 }, { id: "s15", name: "X", odds: 4.5 }, { id: "s16", name: "2", odds: 6.0 }] },
    ],
  },
];

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>(PLACEHOLDER_SPORTS);
  const [events, setEvents] = useState<SportEvent[]>(PLACEHOLDER_EVENTS);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [tab, setTab] = useState<"live" | "upcoming">("live");

  useEffect(() => {
    api
      .get<{ items: Sport[] }>("/sports/list")
      .then((res) => setSports(res.items))
      .catch(() => {});

    api
      .get<{ items: SportEvent[] }>("/sports/events")
      .then((res) => setEvents(res.items))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedSport !== "all" && e.sportId !== selectedSport) return false;
      if (tab === "live" && !e.isLive) return false;
      if (tab === "upcoming" && e.isLive) return false;
      return true;
    });
  }, [events, selectedSport, tab]);

  const liveCount = events.filter((e) => e.isLive).length;
  const upcomingCount = events.filter((e) => !e.isLive).length;

  return (
    <div className="min-h-screen bg-brand-surface-alt">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sport Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <h2 className="font-heading text-lg font-bold text-brand-text mb-4 hidden lg:block">
              Sporter
            </h2>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedSport("all")}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                  selectedSport === "all"
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-text-muted border-brand-border hover:text-brand-text hover:border-brand-text-muted"
                }`}
              >
                Alla sporter
              </button>
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    selectedSport === sport.id
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-text-muted border-brand-border hover:text-brand-text hover:border-brand-text-muted"
                  }`}
                >
                  <span>{sport.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedSport === sport.id
                        ? "bg-white/20"
                        : "bg-brand-surface-alt"
                    }`}
                  >
                    {sport.count}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-heading text-2xl font-bold text-brand-text">
                {selectedSport === "all"
                  ? "Alla sporter"
                  : sports.find((s) => s.id === selectedSport)?.name ||
                    "Sporter"}
              </h1>
            </div>

            {/* Live/Upcoming Toggle */}
            <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 max-w-xs border border-brand-border">
              <button
                onClick={() => setTab("live")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === "live"
                    ? "bg-brand-primary text-white"
                    : "text-brand-text-muted hover:text-brand-text"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    tab === "live" ? "bg-white" : "bg-brand-danger"
                  } animate-pulse`}
                />
                Live ({liveCount})
              </button>
              <button
                onClick={() => setTab("upcoming")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === "upcoming"
                    ? "bg-brand-primary text-white"
                    : "text-brand-text-muted hover:text-brand-text"
                }`}
              >
                Kommande ({upcomingCount})
              </button>
            </div>

            {/* Events */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-brand-border">
                <p className="text-brand-text-muted text-lg">
                  Inga {tab === "live" ? "live" : "kommande"} event just nu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((event) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
