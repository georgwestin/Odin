"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { LiveOdds } from "@/components/LiveOdds";
import { useBetSlip } from "@/stores/betslip";

interface Market {
  id: string;
  name: string;
  selections: {
    id: string;
    name: string;
    odds: number;
    isActive: boolean;
  }[];
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

const PLACEHOLDER_EVENT: EventDetail = {
  id: "e1",
  sportName: "Fotboll",
  competitionName: "Allsvenskan",
  homeTeam: "Malmo FF",
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
      name: "1X2",
      selections: [
        { id: "s1", name: "1", odds: 1.35, isActive: true },
        { id: "s2", name: "X", odds: 4.8, isActive: true },
        { id: "s3", name: "2", odds: 8.5, isActive: true },
      ],
    },
    {
      id: "m2",
      name: "Bada lagen gor mal",
      selections: [
        { id: "s4", name: "Ja", odds: 1.85, isActive: true },
        { id: "s5", name: "Nej", odds: 1.95, isActive: true },
      ],
    },
    {
      id: "m3",
      name: "Over/Under 2.5 mal",
      selections: [
        { id: "s6", name: "Over 2.5", odds: 1.7, isActive: true },
        { id: "s7", name: "Under 2.5", odds: 2.15, isActive: true },
      ],
    },
    {
      id: "m4",
      name: "Dubbel chans",
      selections: [
        { id: "s8", name: "1 eller X", odds: 1.1, isActive: true },
        { id: "s9", name: "X eller 2", odds: 2.7, isActive: true },
        { id: "s10", name: "1 eller 2", odds: 1.2, isActive: true },
      ],
    },
    {
      id: "m5",
      name: "Handikapp",
      selections: [
        { id: "s11", name: "Malmo FF -1", odds: 2.8, isActive: true },
        { id: "s12", name: "Oavgjort", odds: 3.5, isActive: true },
        { id: "s13", name: "AIK +1", odds: 2.4, isActive: true },
      ],
    },
    {
      id: "m6",
      name: "Nasta mal",
      selections: [
        { id: "s17", name: "Malmo FF", odds: 1.6, isActive: true },
        { id: "s18", name: "Inget mal", odds: 5.0, isActive: true },
        { id: "s19", name: "AIK", odds: 3.2, isActive: true },
      ],
    },
  ],
};

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

  // Expand all markets by default
  useEffect(() => {
    if (event) {
      setExpandedMarkets(new Set(event.markets.map((m) => m.id)));
    }
  }, [event]);

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-surface-alt">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSelectionSelected = (selId: string) =>
    selections.some((s) => s.id === selId);

  const handleSelectOdds = (market: Market, sel: Market["selections"][0]) => {
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
      if (next.has(marketId)) {
        next.delete(marketId);
      } else {
        next.add(marketId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-brand-surface-alt">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
          <Link
            href="/sports"
            className="hover:text-brand-text transition-colors"
          >
            Sporter
          </Link>
          <span>/</span>
          <span>{event.sportName}</span>
          <span>/</span>
          <span className="text-brand-text font-medium">
            {event.homeTeam} vs {event.awayTeam}
          </span>
        </nav>

        {/* Match Header */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-brand-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-brand-text-muted font-medium">
              {event.sportName} - {event.competitionName}
            </span>
            {event.isLive ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-danger">
                <span className="w-2 h-2 rounded-full bg-brand-danger animate-pulse" />
                LIVE {event.matchTime && `- ${event.matchTime}`}
              </span>
            ) : (
              <span className="text-xs text-brand-text-muted">
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

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 py-6">
            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-surface-alt flex items-center justify-center border border-brand-border">
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
                <div className="font-heading text-4xl font-black text-brand-text">
                  {event.score.home}{" "}
                  <span className="text-brand-text-muted">-</span>{" "}
                  {event.score.away}
                </div>
                {event.matchTime && (
                  <p className="text-sm text-brand-primary mt-1 font-semibold">
                    {event.matchTime}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-text-muted">vs</p>
              </div>
            )}

            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-surface-alt flex items-center justify-center border border-brand-border">
                <span className="font-heading font-bold text-xl text-brand-primary">
                  {event.awayTeam.charAt(0)}
                </span>
              </div>
              <p className="font-heading font-bold text-brand-text text-lg">
                {event.awayTeam}
              </p>
            </div>
          </div>

          {/* Live Stats */}
          {event.isLive && event.stats && (
            <div className="mt-4 pt-4 border-t border-brand-border space-y-3">
              {event.stats.possession && (
                <div>
                  <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                    <span className="font-medium">{event.stats.possession.home}%</span>
                    <span>Bollinnehav</span>
                    <span className="font-medium">{event.stats.possession.away}%</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-brand-surface-alt">
                    <div
                      className="bg-brand-primary rounded-l-full"
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
                  <span className="text-brand-text font-medium">
                    {event.stats.shots.home}
                  </span>
                  <span className="text-brand-text-muted">Skott</span>
                  <span className="text-brand-text font-medium">
                    {event.stats.shots.away}
                  </span>
                </div>
              )}
              {event.stats.corners && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text font-medium">
                    {event.stats.corners.home}
                  </span>
                  <span className="text-brand-text-muted">Hornsparkar</span>
                  <span className="text-brand-text font-medium">
                    {event.stats.corners.away}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Markets (Accordion) */}
        <div className="space-y-3">
          {event.markets.map((market) => (
            <div
              key={market.id}
              className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-card"
            >
              <button
                onClick={() => toggleMarket(market.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-surface-alt transition-colors"
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
                  strokeWidth="2"
                  className={`text-brand-text-muted transition-transform ${
                    expandedMarkets.has(market.id) ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {expandedMarkets.has(market.id) && (
                <div className="px-4 pb-4">
                  <div
                    className={`grid gap-2 ${
                      market.selections.length === 2
                        ? "grid-cols-2"
                        : market.selections.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-3"
                    }`}
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
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                              isSelectionSelected(sel.id)
                                ? "bg-brand-primary text-white border-brand-primary shadow-card"
                                : sel.isActive
                                ? "bg-white text-brand-text border-brand-border hover:border-brand-primary/30 hover:bg-brand-primary/5"
                                : "bg-brand-surface-alt text-brand-text-muted border-brand-border cursor-not-allowed"
                            }`}
                          >
                            <span className="truncate mr-2">{sel.name}</span>
                            <span className="font-bold text-brand-primary shrink-0">
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
      </div>
    </div>
  );
}
