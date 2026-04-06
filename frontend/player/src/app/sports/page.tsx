"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { SportEventCard } from "@/components/SportEventCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  elapsed?: string;
  markets: {
    id: string;
    name: string;
    selections: { id: string; name: string; odds: number }[];
  }[];
}

interface Sport {
  id: string;
  name: string;
  icon: string;
  count: number;
}

/* ------------------------------------------------------------------ */
/*  Placeholder data                                                   */
/* ------------------------------------------------------------------ */

const SPORTS: Sport[] = [
  { id: "football", name: "Fotboll", icon: "\u26BD", count: 42 },
  { id: "ice-hockey", name: "Ishockey", icon: "\uD83C\uDFD2", count: 18 },
  { id: "tennis", name: "Tennis", icon: "\uD83C\uDFBE", count: 15 },
  { id: "basketball", name: "Basket", icon: "\uD83C\uDFC0", count: 12 },
  { id: "handball", name: "Handboll", icon: "\uD83E\uDD3E", count: 8 },
  { id: "esports", name: "Esport", icon: "\uD83C\uDFAE", count: 10 },
  { id: "mma", name: "MMA", icon: "\uD83E\uDD4A", count: 5 },
  { id: "motorsport", name: "Motorsport", icon: "\uD83C\uDFCE\uFE0F", count: 4 },
  { id: "golf", name: "Golf", icon: "\u26F3", count: 6 },
  { id: "table-tennis", name: "Bordtennis", icon: "\uD83C\uDFD3", count: 9 },
];

const POPULAR_LEAGUES = [
  "Allsvenskan",
  "Premier League",
  "La Liga",
  "Serie A",
  "SHL",
  "NBA",
];

const EVENTS: SportEvent[] = [
  /* --- LIVE --- */
  {
    id: "e1",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "Malmö FF",
    awayTeam: "AIK",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    elapsed: "65'",
    markets: [
      { id: "m1", name: "1X2", selections: [{ id: "s1", name: "1", odds: 1.35 }, { id: "s2", name: "X", odds: 4.80 }, { id: "s3", name: "2", odds: 8.50 }] },
    ],
  },
  {
    id: "e2",
    sportId: "ice-hockey",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Färjestad",
    awayTeam: "Frölunda",
    score: { home: 3, away: 2 },
    startTime: new Date().toISOString(),
    isLive: true,
    elapsed: "48:12",
    markets: [
      { id: "m2", name: "1X2", selections: [{ id: "s4", name: "1", odds: 2.10 }, { id: "s5", name: "X", odds: 4.00 }, { id: "s6", name: "2", odds: 2.80 }] },
    ],
  },
  {
    id: "e3",
    sportId: "basketball",
    sportName: "Basket",
    competitionName: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    score: { home: 88, away: 92 },
    startTime: new Date().toISOString(),
    isLive: true,
    elapsed: "Q3 4:22",
    markets: [
      { id: "m3", name: "Vinnare", selections: [{ id: "s7", name: "Lakers", odds: 2.35 }, { id: "s8", name: "Celtics", odds: 1.55 }] },
    ],
  },
  {
    id: "e4",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    score: { home: 2, away: 1 },
    startTime: new Date().toISOString(),
    isLive: true,
    elapsed: "72'",
    markets: [
      { id: "m4", name: "1X2", selections: [{ id: "s9", name: "1", odds: 1.20 }, { id: "s10", name: "X", odds: 6.50 }, { id: "s11", name: "2", odds: 12.00 }] },
    ],
  },
  /* --- UPCOMING: Allsvenskan --- */
  {
    id: "e5",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "Djurgården",
    awayTeam: "Hammarby",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    markets: [
      { id: "m5", name: "1X2", selections: [{ id: "s12", name: "1", odds: 2.10 }, { id: "s13", name: "X", odds: 3.40 }, { id: "s14", name: "2", odds: 3.25 }] },
    ],
  },
  {
    id: "e6",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "IFK Göteborg",
    awayTeam: "BK Häcken",
    startTime: new Date(Date.now() + 7800000).toISOString(),
    isLive: false,
    markets: [
      { id: "m6", name: "1X2", selections: [{ id: "s15", name: "1", odds: 3.00 }, { id: "s16", name: "X", odds: 3.20 }, { id: "s17", name: "2", odds: 2.30 }] },
    ],
  },
  /* --- UPCOMING: Premier League --- */
  {
    id: "e7",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Liverpool",
    awayTeam: "Man City",
    startTime: new Date(Date.now() + 86400000).toISOString(),
    isLive: false,
    markets: [
      { id: "m7", name: "1X2", selections: [{ id: "s18", name: "1", odds: 2.40 }, { id: "s19", name: "X", odds: 3.30 }, { id: "s20", name: "2", odds: 2.85 }] },
    ],
  },
  {
    id: "e8",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Tottenham",
    awayTeam: "Man United",
    startTime: new Date(Date.now() + 90000000).toISOString(),
    isLive: false,
    markets: [
      { id: "m8", name: "1X2", selections: [{ id: "s21", name: "1", odds: 2.20 }, { id: "s22", name: "X", odds: 3.50 }, { id: "s23", name: "2", odds: 3.10 }] },
    ],
  },
  /* --- UPCOMING: La Liga --- */
  {
    id: "e9",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "La Liga",
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    startTime: new Date(Date.now() + 172800000).toISOString(),
    isLive: false,
    markets: [
      { id: "m9", name: "1X2", selections: [{ id: "s24", name: "1", odds: 1.90 }, { id: "s25", name: "X", odds: 3.60 }, { id: "s26", name: "2", odds: 3.80 }] },
    ],
  },
  /* --- UPCOMING: Serie A --- */
  {
    id: "e10",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Serie A",
    homeTeam: "AC Milan",
    awayTeam: "Inter",
    startTime: new Date(Date.now() + 180000000).toISOString(),
    isLive: false,
    markets: [
      { id: "m10", name: "1X2", selections: [{ id: "s27", name: "1", odds: 2.60 }, { id: "s28", name: "X", odds: 3.20 }, { id: "s29", name: "2", odds: 2.65 }] },
    ],
  },
  /* --- UPCOMING: SHL --- */
  {
    id: "e11",
    sportId: "ice-hockey",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Luleå",
    awayTeam: "Skellefteå",
    startTime: new Date(Date.now() + 10800000).toISOString(),
    isLive: false,
    markets: [
      { id: "m11", name: "1X2", selections: [{ id: "s30", name: "1", odds: 1.85 }, { id: "s31", name: "X", odds: 4.20 }, { id: "s32", name: "2", odds: 3.40 }] },
    ],
  },
  {
    id: "e12",
    sportId: "ice-hockey",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Djurgården Hockey",
    awayTeam: "HV71",
    startTime: new Date(Date.now() + 14400000).toISOString(),
    isLive: false,
    markets: [
      { id: "m12", name: "1X2", selections: [{ id: "s33", name: "1", odds: 1.70 }, { id: "s34", name: "X", odds: 4.50 }, { id: "s35", name: "2", odds: 3.80 }] },
    ],
  },
  /* --- UPCOMING: NBA --- */
  {
    id: "e13",
    sportId: "basketball",
    sportName: "Basket",
    competitionName: "NBA",
    homeTeam: "Warriors",
    awayTeam: "Bucks",
    startTime: new Date(Date.now() + 28800000).toISOString(),
    isLive: false,
    markets: [
      { id: "m13", name: "Vinnare", selections: [{ id: "s36", name: "Warriors", odds: 1.90 }, { id: "s37", name: "Bucks", odds: 1.90 }] },
    ],
  },
  /* --- UPCOMING: Tennis --- */
  {
    id: "e14",
    sportId: "tennis",
    sportName: "Tennis",
    competitionName: "ATP Stockholm Open",
    homeTeam: "Ruud",
    awayTeam: "Rune",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [
      { id: "m14", name: "Vinnare", selections: [{ id: "s38", name: "Ruud", odds: 1.75 }, { id: "s39", name: "Rune", odds: 2.05 }] },
    ],
  },
  /* --- UPCOMING: Bundesliga --- */
  {
    id: "e15",
    sportId: "football",
    sportName: "Fotboll",
    competitionName: "Bundesliga",
    homeTeam: "Bayern München",
    awayTeam: "Dortmund",
    startTime: new Date(Date.now() + 86400000).toISOString(),
    isLive: false,
    markets: [
      { id: "m15", name: "1X2", selections: [{ id: "s40", name: "1", odds: 1.45 }, { id: "s41", name: "X", odds: 4.50 }, { id: "s42", name: "2", odds: 6.00 }] },
    ],
  },
  /* --- UPCOMING: Esport --- */
  {
    id: "e16",
    sportId: "esports",
    sportName: "Esport",
    competitionName: "LEC Spring",
    homeTeam: "G2 Esports",
    awayTeam: "Fnatic",
    startTime: new Date(Date.now() + 43200000).toISOString(),
    isLive: false,
    markets: [
      { id: "m16", name: "Vinnare", selections: [{ id: "s43", name: "G2", odds: 1.65 }, { id: "s44", name: "Fnatic", odds: 2.15 }] },
    ],
  },
  /* --- UPCOMING: Handboll --- */
  {
    id: "e17",
    sportId: "handball",
    sportName: "Handboll",
    competitionName: "Handbollsligan",
    homeTeam: "IFK Kristianstad",
    awayTeam: "Alingsås HK",
    startTime: new Date(Date.now() + 50400000).toISOString(),
    isLive: false,
    markets: [
      { id: "m17", name: "1X2", selections: [{ id: "s45", name: "1", odds: 1.55 }, { id: "s46", name: "X", odds: 5.00 }, { id: "s47", name: "2", odds: 4.20 }] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>(SPORTS);
  const [events, setEvents] = useState<SportEvent[]>(EVENTS);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: Sport[] }>("/sports/list")
      .then((res) => setSports(res.items.length ? res.items : SPORTS))
      .catch(() => {});
    api
      .get<{ items: SportEvent[] }>("/sports/events")
      .then((res) => setEvents(res.items.length ? res.items : EVENTS))
      .catch(() => {});
  }, []);

  /* --- derived data --- */
  const liveEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.isLive &&
          (selectedSport === "all" || e.sportId === selectedSport)
      ),
    [events, selectedSport]
  );

  const upcomingEvents = useMemo(() => {
    let filtered = events.filter(
      (e) =>
        !e.isLive &&
        (selectedSport === "all" || e.sportId === selectedSport)
    );
    if (activeLeague) {
      filtered = filtered.filter((e) => e.competitionName === activeLeague);
    }
    return filtered;
  }, [events, selectedSport, activeLeague]);

  /* Group upcoming events by competition */
  const groupedUpcoming = useMemo(() => {
    const map = new Map<string, SportEvent[]>();
    upcomingEvents.forEach((e) => {
      const key = e.competitionName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [upcomingEvents]);

  /* Available league pills */
  const availableLeagues = useMemo(() => {
    const upcoming = events.filter(
      (e) =>
        !e.isLive &&
        (selectedSport === "all" || e.sportId === selectedSport)
    );
    const leagueSet = new Set(upcoming.map((e) => e.competitionName));
    return POPULAR_LEAGUES.filter((l) => leagueSet.has(l));
  }, [events, selectedSport]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ===================== LEFT SIDEBAR (desktop) ===================== */}
          <aside className="hidden lg:block w-56 shrink-0">
            <h2 className="font-heading text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3">
              Sporter
            </h2>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedSport("all")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSport === "all"
                    ? "bg-brand-primary text-white"
                    : "text-brand-text hover:bg-brand-surface-alt"
                }`}
              >
                <span>Alla sporter</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedSport === "all"
                      ? "bg-white/20"
                      : "bg-brand-surface-alt text-brand-text-muted"
                  }`}
                >
                  {events.length}
                </span>
              </button>

              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setActiveLeague(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedSport === sport.id
                      ? "bg-brand-primary text-white"
                      : "text-brand-text hover:bg-brand-surface-alt"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{sport.icon}</span>
                    <span>{sport.name}</span>
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedSport === sport.id
                        ? "bg-white/20"
                        : "bg-brand-surface-alt text-brand-text-muted"
                    }`}
                  >
                    {sport.count}
                  </span>
                </button>
              ))}
            </nav>

            {/* A-Ö browse */}
            <div className="mt-6 pt-4 border-t border-brand-border">
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-text-muted hover:bg-brand-surface-alt transition-colors">
                <span className="text-base">A-Ö</span>
                <span>Alla sporter A-Ö</span>
              </button>
            </div>
          </aside>

          {/* ===================== MAIN CONTENT ===================== */}
          <div className="flex-1 min-w-0">
            {/* Mobile sport pills (horizontal scroll) */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4">
              <button
                onClick={() => {
                  setSelectedSport("all");
                  setActiveLeague(null);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedSport === "all"
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-text border-brand-border"
                }`}
              >
                Alla
              </button>
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setActiveLeague(null);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedSport === sport.id
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-text border-brand-border"
                  }`}
                >
                  <span>{sport.icon}</span>
                  <span>{sport.name}</span>
                </button>
              ))}
            </div>

            {/* ---- LIVE SECTION ---- */}
            {liveEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-danger text-white text-xs font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    LIVE
                  </span>
                  <h2 className="font-heading text-lg font-bold text-brand-text">
                    Live just nu
                  </h2>
                  <span className="text-sm text-brand-text-muted">
                    ({liveEvents.length})
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
                  {liveEvents.map((event) => (
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
                      elapsed={event.elapsed}
                      markets={event.markets}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ---- LEAGUE FILTER PILLS ---- */}
            {availableLeagues.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
                <button
                  onClick={() => setActiveLeague(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    activeLeague === null
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-text border-brand-border hover:border-brand-text-muted"
                  }`}
                >
                  Alla ligor
                </button>
                {availableLeagues.map((league) => (
                  <button
                    key={league}
                    onClick={() =>
                      setActiveLeague(activeLeague === league ? null : league)
                    }
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      activeLeague === league
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white text-brand-text border-brand-border hover:border-brand-text-muted"
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
            )}

            {/* ---- UPCOMING EVENTS ---- */}
            <section>
              <h2 className="font-heading text-lg font-bold text-brand-text mb-4">
                Kommande matcher
              </h2>

              {groupedUpcoming.length === 0 ? (
                <div className="text-center py-16 bg-brand-surface-alt rounded-xl">
                  <p className="text-brand-text-muted">
                    Inga kommande matcher just nu.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedUpcoming.map(([league, leagueEvents]) => (
                    <div
                      key={league}
                      className="rounded-xl border border-brand-border overflow-hidden"
                    >
                      {/* League header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-brand-surface-alt border-b border-brand-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-text">
                            {league}
                          </span>
                        </div>
                        {leagueEvents[0]?.markets[0] && (
                          <div className="hidden sm:flex gap-1.5">
                            {leagueEvents[0].markets[0].selections.map(
                              (sel) => (
                                <span
                                  key={sel.id}
                                  className="w-[54px] text-center text-xs font-medium text-brand-text-muted"
                                >
                                  {sel.name}
                                </span>
                              )
                            )}
                            <span className="w-8" />
                          </div>
                        )}
                      </div>

                      {/* Event rows */}
                      {leagueEvents.map((event) => (
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
                          elapsed={event.elapsed}
                          markets={event.markets}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
