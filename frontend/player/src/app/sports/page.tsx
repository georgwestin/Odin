"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LiveOdds } from "@/components/LiveOdds";

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
  { id: "football", name: "Football", count: 42 },
  { id: "tennis", name: "Tennis", count: 18 },
  { id: "basketball", name: "Basketball", count: 15 },
  { id: "ice-hockey", name: "Ice Hockey", count: 8 },
  { id: "esports", name: "Esports", count: 12 },
  { id: "mma", name: "MMA", count: 5 },
];

const PLACEHOLDER_EVENTS: SportEvent[] = [
  {
    id: "e1",
    sportId: "football",
    sportName: "Football",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      {
        id: "m1",
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
    sportId: "football",
    sportName: "Football",
    competitionName: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    markets: [
      {
        id: "m2",
        name: "Match Result",
        selections: [
          { id: "s4", name: "Barcelona", odds: 2.2 },
          { id: "s5", name: "Draw", odds: 3.4 },
          { id: "s6", name: "Real Madrid", odds: 2.9 },
        ],
      },
    ],
  },
  {
    id: "e3",
    sportId: "tennis",
    sportName: "Tennis",
    competitionName: "ATP Australian Open",
    homeTeam: "Djokovic",
    awayTeam: "Alcaraz",
    score: { home: 2, away: 1 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      {
        id: "m3",
        name: "Match Winner",
        selections: [
          { id: "s7", name: "Djokovic", odds: 2.1 },
          { id: "s8", name: "Alcaraz", odds: 1.75 },
        ],
      },
    ],
  },
  {
    id: "e4",
    sportId: "basketball",
    sportName: "Basketball",
    competitionName: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    score: { home: 88, away: 92 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [
      {
        id: "m4",
        name: "Match Winner",
        selections: [
          { id: "s9", name: "Lakers", odds: 2.35 },
          { id: "s10", name: "Celtics", odds: 1.55 },
        ],
      },
    ],
  },
  {
    id: "e5",
    sportId: "football",
    sportName: "Football",
    competitionName: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    startTime: new Date(Date.now() + 86400000).toISOString(),
    isLive: false,
    markets: [
      {
        id: "m5",
        name: "Match Result",
        selections: [
          { id: "s11", name: "Bayern", odds: 1.45 },
          { id: "s12", name: "Draw", odds: 4.5 },
          { id: "s13", name: "Dortmund", odds: 6.0 },
        ],
      },
    ],
  },
  {
    id: "e6",
    sportId: "esports",
    sportName: "Esports",
    competitionName: "League of Legends Worlds",
    homeTeam: "T1",
    awayTeam: "Gen.G",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [
      {
        id: "m6",
        name: "Match Winner",
        selections: [
          { id: "s14", name: "T1", odds: 1.9 },
          { id: "s15", name: "Gen.G", odds: 1.85 },
        ],
      },
    ],
  },
];

const SPORT_ICONS: Record<string, string> = {
  football: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  tennis: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  basketball: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  default: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
};

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
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sport Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <h2 className="font-heading text-lg font-bold text-white mb-4 hidden lg:block">
            Sports
          </h2>

          {/* Mobile horizontal scroll, Desktop vertical list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0">
            <button
              onClick={() => setSelectedSport("all")}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedSport === "all"
                  ? "bg-brand-primary text-black"
                  : "bg-brand-surface text-brand-text-muted hover:text-white hover:bg-brand-surface-alt"
              }`}
            >
              All Sports
            </button>
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSport === sport.id
                    ? "bg-brand-primary text-black"
                    : "bg-brand-surface text-brand-text-muted hover:text-white hover:bg-brand-surface-alt"
                }`}
              >
                <span>{sport.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedSport === sport.id
                      ? "bg-black/20"
                      : "bg-white/5"
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
            <h1 className="font-heading text-2xl font-bold text-white">
              {selectedSport === "all"
                ? "All Sports"
                : sports.find((s) => s.id === selectedSport)?.name || "Sports"}
            </h1>
          </div>

          {/* Live/Upcoming Toggle */}
          <div className="flex gap-1 bg-brand-surface rounded-lg p-1 mb-6 max-w-xs">
            <button
              onClick={() => setTab("live")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === "live"
                  ? "bg-brand-primary text-black"
                  : "text-brand-text-muted hover:text-white"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab === "live" ? "bg-black" : "bg-brand-danger"} animate-pulse`} />
              Live ({liveCount})
            </button>
            <button
              onClick={() => setTab("upcoming")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === "upcoming"
                  ? "bg-brand-primary text-black"
                  : "text-brand-text-muted hover:text-white"
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
          </div>

          {/* Events */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-brand-text-muted text-lg">
                No {tab} events right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((event) => (
                <div
                  key={event.id}
                  className="bg-brand-surface rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Event Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-text-muted">
                        {event.sportName}
                      </span>
                      <span className="text-xs text-brand-text-muted">-</span>
                      <span className="text-xs text-brand-text-muted">
                        {event.competitionName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.isLive ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-danger">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="text-xs text-brand-text-muted">
                          {new Date(event.startTime).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(event.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <Link
                        href={`/sports/${event.id}`}
                        className="text-xs text-brand-primary hover:text-brand-accent font-medium"
                      >
                        +{event.markets.length > 1 ? event.markets.length - 1 : 0} markets
                      </Link>
                    </div>
                  </div>

                  {/* Teams & Odds */}
                  <div className="flex items-center gap-4">
                    {/* Teams */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {event.homeTeam}
                        </p>
                        {event.score && (
                          <span className="text-sm font-bold text-brand-primary ml-2">
                            {event.score.home}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">
                          {event.awayTeam}
                        </p>
                        {event.score && (
                          <span className="text-sm font-bold text-brand-primary ml-2">
                            {event.score.away}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Odds */}
                    {event.markets[0] && (
                      <div className="flex gap-2 shrink-0">
                        {event.markets[0].selections.map((sel) => (
                          <div key={sel.id} className="text-center min-w-[60px]">
                            <p className="text-[10px] text-brand-text-muted mb-1 truncate">
                              {sel.name}
                            </p>
                            {event.isLive ? (
                              <LiveOdds
                                eventId={event.id}
                                selectionId={sel.id}
                                initialOdds={sel.odds}
                                selectionName={sel.name}
                                eventName={`${event.homeTeam} vs ${event.awayTeam}`}
                                marketName={event.markets[0].name}
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  const { useBetSlip } = require("@/stores/betslip");
                                  useBetSlip.getState().addSelection({
                                    id: sel.id,
                                    eventId: event.id,
                                    eventName: `${event.homeTeam} vs ${event.awayTeam}`,
                                    marketName: event.markets[0].name,
                                    selectionName: sel.name,
                                    odds: sel.odds,
                                  });
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-surface-alt/60 text-white hover:bg-brand-surface-alt transition-colors"
                              >
                                {sel.odds.toFixed(2)}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
