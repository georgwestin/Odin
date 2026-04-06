"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { LiveOdds } from "@/components/LiveOdds";
import { useBetSlip } from "@/stores/betslip";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MarketSelection {
  id: string;
  name: string;
  odds: number;
  isActive: boolean;
}

interface Market {
  id: string;
  name: string;
  selections: MarketSelection[];
}

interface EventDetail {
  id: string;
  sportName: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
  matchTime?: string;
  startTime: string;
  isLive: boolean;
  stats?: {
    possession?: { home: number; away: number };
    shots?: { home: number; away: number };
    corners?: { home: number; away: number };
  };
  markets: Market[];
}

interface RelatedEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competitionName: string;
  startTime: string;
}

/* ------------------------------------------------------------------ */
/*  Placeholder data                                                   */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_EVENT: EventDetail = {
  id: "e1",
  sportName: "Fotboll",
  competitionName: "Allsvenskan",
  homeTeam: "Malmö FF",
  awayTeam: "AIK",
  score: { home: 1, away: 0 },
  matchTime: "67'",
  startTime: new Date().toISOString(),
  isLive: true,
  stats: {
    possession: { home: 58, away: 42 },
    shots: { home: 12, away: 7 },
    corners: { home: 6, away: 3 },
  },
  markets: [
    {
      id: "m1",
      name: "Slutresultat (1X2)",
      selections: [
        { id: "s1", name: "1 - Malmö FF", odds: 1.35, isActive: true },
        { id: "s2", name: "X - Oavgjort", odds: 4.80, isActive: true },
        { id: "s3", name: "2 - AIK", odds: 8.50, isActive: true },
      ],
    },
    {
      id: "m2",
      name: "Dubbelchans",
      selections: [
        { id: "s4", name: "1 eller X", odds: 1.10, isActive: true },
        { id: "s5", name: "X eller 2", odds: 2.70, isActive: true },
        { id: "s6", name: "1 eller 2", odds: 1.20, isActive: true },
      ],
    },
    {
      id: "m3",
      name: "Över/Under 2.5 mål",
      selections: [
        { id: "s7", name: "Över 2.5", odds: 1.70, isActive: true },
        { id: "s8", name: "Under 2.5", odds: 2.15, isActive: true },
      ],
    },
    {
      id: "m4",
      name: "Båda lagen gör mål",
      selections: [
        { id: "s9", name: "Ja", odds: 1.85, isActive: true },
        { id: "s10", name: "Nej", odds: 1.95, isActive: true },
      ],
    },
    {
      id: "m5",
      name: "Handikapp",
      selections: [
        { id: "s11", name: "Malmö FF -1", odds: 2.80, isActive: true },
        { id: "s12", name: "Oavgjort", odds: 3.50, isActive: true },
        { id: "s13", name: "AIK +1", odds: 2.40, isActive: true },
      ],
    },
    {
      id: "m6",
      name: "Korrekt resultat",
      selections: [
        { id: "s14", name: "1-0", odds: 5.50, isActive: true },
        { id: "s15", name: "2-0", odds: 7.00, isActive: true },
        { id: "s16", name: "2-1", odds: 6.50, isActive: true },
        { id: "s17", name: "3-0", odds: 12.00, isActive: true },
        { id: "s18", name: "3-1", odds: 10.00, isActive: true },
        { id: "s19", name: "0-0", odds: 9.00, isActive: true },
        { id: "s20", name: "1-1", odds: 5.00, isActive: true },
        { id: "s21", name: "2-2", odds: 11.00, isActive: true },
        { id: "s22", name: "0-1", odds: 13.00, isActive: true },
        { id: "s23", name: "0-2", odds: 21.00, isActive: true },
        { id: "s24", name: "1-2", odds: 15.00, isActive: true },
        { id: "s25", name: "0-3", odds: 40.00, isActive: true },
      ],
    },
    {
      id: "m7",
      name: "Halvtid/Slutresultat",
      selections: [
        { id: "s26", name: "1/1", odds: 2.50, isActive: true },
        { id: "s27", name: "1/X", odds: 12.00, isActive: true },
        { id: "s28", name: "1/2", odds: 25.00, isActive: true },
        { id: "s29", name: "X/1", odds: 4.50, isActive: true },
        { id: "s30", name: "X/X", odds: 5.50, isActive: true },
        { id: "s31", name: "X/2", odds: 8.00, isActive: true },
        { id: "s32", name: "2/1", odds: 20.00, isActive: true },
        { id: "s33", name: "2/X", odds: 15.00, isActive: true },
        { id: "s34", name: "2/2", odds: 10.00, isActive: true },
      ],
    },
  ],
};

const RELATED_EVENTS: RelatedEvent[] = [
  {
    id: "e5",
    homeTeam: "Djurgården",
    awayTeam: "Hammarby",
    competitionName: "Allsvenskan",
    startTime: new Date(Date.now() + 7200000).toISOString(),
  },
  {
    id: "e6",
    homeTeam: "IFK Göteborg",
    awayTeam: "BK Häcken",
    competitionName: "Allsvenskan",
    startTime: new Date(Date.now() + 7800000).toISOString(),
  },
  {
    id: "e7",
    homeTeam: "Liverpool",
    awayTeam: "Man City",
    competitionName: "Premier League",
    startTime: new Date(Date.now() + 86400000).toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { addSelection, selections } = useBetSlip();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setLoading(true);
    api
      .get<EventDetail>(`/sports/events/${eventId}`)
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => {
        setEvent({ ...PLACEHOLDER_EVENT, id: eventId });
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    if (event) {
      setExpandedMarkets(new Set(event.markets.map((m) => m.id)));
    }
  }, [event]);

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSelectionSelected = (selId: string) =>
    selections.some((s) => s.id === selId);

  const handleSelectOdds = (market: Market, sel: MarketSelection) => {
    addSelection({
      id: sel.id,
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      marketName: market.name,
      selectionName: sel.name,
      odds: sel.odds,
    });
  };

  const toggleMarket = (marketId: string) => {
    setExpandedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(marketId)) next.delete(marketId);
      else next.add(marketId);
      return next;
    });
  };

  const gridCols = (count: number) => {
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-3 sm:grid-cols-4";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
          <Link
            href="/sports"
            className="hover:text-brand-primary transition-colors"
          >
            Sportspel
          </Link>
          <span className="text-brand-border">/</span>
          <span>{event.sportName}</span>
          <span className="text-brand-border">/</span>
          <span>{event.competitionName}</span>
          <span className="text-brand-border">/</span>
          <span className="text-brand-text font-medium">
            {event.homeTeam} vs {event.awayTeam}
          </span>
        </nav>

        {/* ===================== MATCH HEADER ===================== */}
        <div className="bg-white rounded-xl border border-brand-border p-6 mb-6">
          {/* Competition + live badge */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-brand-text-muted font-medium">
              {event.sportName} &middot; {event.competitionName}
            </span>
            {event.isLive ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-danger text-white text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE {event.matchTime && `\u2013 ${event.matchTime}`}
              </span>
            ) : (
              <span className="text-sm text-brand-text-muted">
                {new Date(event.startTime).toLocaleDateString("sv-SE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                kl.{" "}
                {new Date(event.startTime).toLocaleTimeString("sv-SE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-surface-alt flex items-center justify-center border border-brand-border">
                <span className="font-heading font-bold text-xl text-brand-primary">
                  {event.homeTeam.charAt(0)}
                </span>
              </div>
              <p className="font-heading font-bold text-brand-text text-lg">
                {event.homeTeam}
              </p>
            </div>

            {event.score ? (
              <div className="text-center">
                <div className="font-heading text-5xl font-black text-brand-text tracking-tight">
                  {event.score.home}
                  <span className="text-brand-border mx-2">&ndash;</span>
                  {event.score.away}
                </div>
                {event.matchTime && (
                  <p className="text-sm text-brand-primary mt-2 font-semibold">
                    {event.matchTime}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-bold text-brand-border">vs</p>
              </div>
            )}

            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-surface-alt flex items-center justify-center border border-brand-border">
                <span className="font-heading font-bold text-xl text-brand-primary">
                  {event.awayTeam.charAt(0)}
                </span>
              </div>
              <p className="font-heading font-bold text-brand-text text-lg">
                {event.awayTeam}
              </p>
            </div>
          </div>

          {/* Live stats */}
          {event.isLive && event.stats && (
            <div className="mt-6 pt-5 border-t border-brand-border space-y-3">
              {event.stats.possession && (
                <div>
                  <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1.5">
                    <span className="font-semibold text-brand-text">
                      {event.stats.possession.home}%
                    </span>
                    <span>Bollinnehav</span>
                    <span className="font-semibold text-brand-text">
                      {event.stats.possession.away}%
                    </span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-brand-surface-alt">
                    <div
                      className="bg-brand-primary rounded-l-full transition-all"
                      style={{ width: `${event.stats.possession.home}%` }}
                    />
                    <div
                      className="bg-brand-border rounded-r-full"
                      style={{ width: `${event.stats.possession.away}%` }}
                    />
                  </div>
                </div>
              )}
              {event.stats.shots && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text font-semibold">
                    {event.stats.shots.home}
                  </span>
                  <span className="text-brand-text-muted">Skott</span>
                  <span className="text-brand-text font-semibold">
                    {event.stats.shots.away}
                  </span>
                </div>
              )}
              {event.stats.corners && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text font-semibold">
                    {event.stats.corners.home}
                  </span>
                  <span className="text-brand-text-muted">Hörnor</span>
                  <span className="text-brand-text font-semibold">
                    {event.stats.corners.away}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================== MARKETS (Accordion) ===================== */}
        <div className="space-y-3">
          {event.markets.map((market) => (
            <div
              key={market.id}
              className="bg-white rounded-xl border border-brand-border overflow-hidden"
            >
              {/* Market header */}
              <button
                onClick={() => toggleMarket(market.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-brand-surface-alt/50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-brand-text">
                  {market.name}
                </h3>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-brand-text-muted transition-transform duration-200 ${
                    expandedMarkets.has(market.id) ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Selections grid */}
              {expandedMarkets.has(market.id) && (
                <div className="px-4 pb-4">
                  <div
                    className={`grid gap-2 ${gridCols(
                      market.selections.length
                    )}`}
                  >
                    {market.selections.map((sel) => (
                      <div key={sel.id}>
                        {event.isLive && sel.isActive ? (
                          <div className="text-center">
                            <p className="text-xs text-brand-text-muted mb-1">
                              {sel.name}
                            </p>
                            <LiveOdds
                              eventId={event.id}
                              selectionId={sel.id}
                              initialOdds={sel.odds}
                              selectionName={sel.name}
                              eventName={`${event.homeTeam} vs ${event.awayTeam}`}
                              marketName={market.name}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectOdds(market, sel)}
                            disabled={!sel.isActive}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                              isSelectionSelected(sel.id)
                                ? "bg-brand-primary text-white border-brand-primary"
                                : sel.isActive
                                ? "bg-white text-brand-text border-brand-border hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                                : "bg-brand-surface-alt text-brand-text-muted border-brand-border cursor-not-allowed opacity-60"
                            }`}
                          >
                            <span className="truncate mr-2">{sel.name}</span>
                            <span
                              className={`font-bold shrink-0 ${
                                isSelectionSelected(sel.id)
                                  ? "text-white"
                                  : "text-brand-primary"
                              }`}
                            >
                              {sel.odds.toFixed(2)}
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ===================== RELATED EVENTS ===================== */}
        <section className="mt-10">
          <h2 className="font-heading text-lg font-bold text-brand-text mb-4">
            Fler matcher i {event.competitionName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RELATED_EVENTS.map((rel) => (
              <Link
                key={rel.id}
                href={`/sports/${rel.id}`}
                className="block bg-white rounded-xl border border-brand-border p-4 hover:shadow-card-hover hover:border-brand-primary/30 transition-all"
              >
                <span className="text-xs text-brand-text-muted block mb-2">
                  {rel.competitionName}
                </span>
                <p className="text-sm font-semibold text-brand-text">
                  {rel.homeTeam} vs {rel.awayTeam}
                </p>
                <span className="text-xs text-brand-text-muted mt-1 block">
                  {new Date(rel.startTime).toLocaleDateString("sv-SE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  kl.{" "}
                  {new Date(rel.startTime).toLocaleTimeString("sv-SE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
