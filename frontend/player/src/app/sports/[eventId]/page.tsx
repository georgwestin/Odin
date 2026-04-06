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
  sportName: "Football",
  competitionName: "Premier League",
  homeTeam: "Arsenal",
  awayTeam: "Chelsea",
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
      name: "Match Result",
      selections: [
        { id: "s1", name: "Arsenal", odds: 1.35, isActive: true },
        { id: "s2", name: "Draw", odds: 4.8, isActive: true },
        { id: "s3", name: "Chelsea", odds: 8.5, isActive: true },
      ],
    },
    {
      id: "m2",
      name: "Both Teams to Score",
      selections: [
        { id: "s4", name: "Yes", odds: 1.85, isActive: true },
        { id: "s5", name: "No", odds: 1.95, isActive: true },
      ],
    },
    {
      id: "m3",
      name: "Over/Under 2.5 Goals",
      selections: [
        { id: "s6", name: "Over 2.5", odds: 1.7, isActive: true },
        { id: "s7", name: "Under 2.5", odds: 2.15, isActive: true },
      ],
    },
    {
      id: "m4",
      name: "Double Chance",
      selections: [
        { id: "s8", name: "Arsenal or Draw", odds: 1.1, isActive: true },
        { id: "s9", name: "Draw or Chelsea", odds: 2.7, isActive: true },
        { id: "s10", name: "Arsenal or Chelsea", odds: 1.2, isActive: true },
      ],
    },
    {
      id: "m5",
      name: "Correct Score",
      selections: [
        { id: "s11", name: "1-0", odds: 5.5, isActive: true },
        { id: "s12", name: "2-0", odds: 6.0, isActive: true },
        { id: "s13", name: "2-1", odds: 7.5, isActive: true },
        { id: "s14", name: "1-1", odds: 8.0, isActive: true },
        { id: "s15", name: "0-1", odds: 12.0, isActive: true },
        { id: "s16", name: "0-2", odds: 18.0, isActive: true },
      ],
    },
    {
      id: "m6",
      name: "Next Goal",
      selections: [
        { id: "s17", name: "Arsenal", odds: 1.6, isActive: true },
        { id: "s18", name: "No Goal", odds: 5.0, isActive: true },
        { id: "s19", name: "Chelsea", odds: 3.2, isActive: true },
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

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
        <Link href="/sports" className="hover:text-white transition-colors">
          Sports
        </Link>
        <span>/</span>
        <span>{event.sportName}</span>
        <span>/</span>
        <span className="text-white">
          {event.homeTeam} vs {event.awayTeam}
        </span>
      </nav>

      {/* Match Header */}
      <div className="bg-brand-surface rounded-2xl p-6 border border-white/5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-brand-text-muted">
            {event.sportName} - {event.competitionName}
          </span>
          {event.isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-danger">
              <span className="w-2 h-2 rounded-full bg-brand-danger animate-pulse" />
              LIVE {event.matchTime && `- ${event.matchTime}`}
            </span>
          ) : (
            <span className="text-xs text-brand-text-muted">
              {new Date(event.startTime).toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(event.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center flex-1">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-surface-alt flex items-center justify-center">
              <span className="font-heading font-bold text-xl text-brand-primary">
                {event.homeTeam.charAt(0)}
              </span>
            </div>
            <p className="font-heading font-bold text-white text-lg">
              {event.homeTeam}
            </p>
          </div>

          {event.score ? (
            <div className="text-center">
              <div className="font-heading text-4xl font-extrabold text-white">
                {event.score.home}{" "}
                <span className="text-brand-text-muted">-</span>{" "}
                {event.score.away}
              </div>
              {event.matchTime && (
                <p className="text-sm text-brand-primary mt-1 font-medium">
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
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-brand-surface-alt flex items-center justify-center">
              <span className="font-heading font-bold text-xl text-brand-primary">
                {event.awayTeam.charAt(0)}
              </span>
            </div>
            <p className="font-heading font-bold text-white text-lg">
              {event.awayTeam}
            </p>
          </div>
        </div>

        {/* Live Stats */}
        {event.isLive && event.stats && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            {event.stats.possession && (
              <div>
                <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                  <span>{event.stats.possession.home}%</span>
                  <span>Possession</span>
                  <span>{event.stats.possession.away}%</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-brand-surface-alt">
                  <div
                    className="bg-brand-primary rounded-l-full"
                    style={{ width: `${event.stats.possession.home}%` }}
                  />
                  <div
                    className="bg-white/30 rounded-r-full"
                    style={{ width: `${event.stats.possession.away}%` }}
                  />
                </div>
              </div>
            )}
            {event.stats.shots && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">{event.stats.shots.home}</span>
                <span className="text-brand-text-muted">Shots</span>
                <span className="text-white font-medium">{event.stats.shots.away}</span>
              </div>
            )}
            {event.stats.corners && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">{event.stats.corners.home}</span>
                <span className="text-brand-text-muted">Corners</span>
                <span className="text-white font-medium">{event.stats.corners.away}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markets */}
      <div className="space-y-4">
        {event.markets.map((market) => (
          <div
            key={market.id}
            className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">
                {market.name}
              </h3>
            </div>
            <div className="p-3">
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
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          isSelectionSelected(sel.id)
                            ? "bg-brand-primary text-black ring-2 ring-brand-primary"
                            : sel.isActive
                            ? "bg-brand-surface-alt/60 text-white hover:bg-brand-surface-alt"
                            : "bg-brand-surface-alt/30 text-brand-text-muted cursor-not-allowed"
                        }`}
                      >
                        <span className="truncate mr-2">{sel.name}</span>
                        <span className="font-bold shrink-0">
                          {sel.odds.toFixed(2)}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
