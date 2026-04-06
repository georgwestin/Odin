"use client";

import Link from "next/link";
import { LiveOdds } from "@/components/LiveOdds";
import { useBetSlip } from "@/stores/betslip";

interface Selection {
  id: string;
  name: string;
  odds: number;
}

interface Market {
  name: string;
  selections: Selection[];
}

interface SportEventCardProps {
  id: string;
  sportName: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
  startTime: string;
  isLive: boolean;
  markets: Market[];
}

export function SportEventCard({
  id,
  sportName,
  competitionName,
  homeTeam,
  awayTeam,
  score,
  startTime,
  isLive,
  markets,
}: SportEventCardProps) {
  const { addSelection } = useBetSlip();

  const handleOddsClick = (sel: Selection, marketName: string) => {
    addSelection({
      id: sel.id,
      eventId: id,
      eventName: `${homeTeam} vs ${awayTeam}`,
      marketName,
      selectionName: sel.name,
      odds: sel.odds,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow border border-brand-border">
      {/* Event Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-text-muted font-medium">
            {sportName}
          </span>
          <span className="text-xs text-brand-text-muted">-</span>
          <span className="text-xs text-brand-text-muted">
            {competitionName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-brand-danger">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-xs text-brand-text-muted">
              {new Date(startTime).toLocaleTimeString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Link
            href={`/sports/${id}`}
            className="text-xs text-brand-primary hover:text-brand-primary-hover font-medium"
          >
            Alla marknader
          </Link>
        </div>
      </div>

      {/* Teams and Score */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-brand-text truncate">
              {homeTeam}
            </p>
            {score && (
              <span className="text-sm font-bold text-brand-primary ml-2">
                {score.home}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-text truncate">
              {awayTeam}
            </p>
            {score && (
              <span className="text-sm font-bold text-brand-primary ml-2">
                {score.away}
              </span>
            )}
          </div>
        </div>

        {/* Odds */}
        {markets[0] && (
          <div className="flex gap-2 shrink-0">
            {markets[0].selections.map((sel) => (
              <div key={sel.id} className="text-center min-w-[56px]">
                <p className="text-[10px] text-brand-text-muted mb-1 truncate">
                  {sel.name}
                </p>
                {isLive ? (
                  <LiveOdds
                    eventId={id}
                    selectionId={sel.id}
                    initialOdds={sel.odds}
                    selectionName={sel.name}
                    eventName={`${homeTeam} vs ${awayTeam}`}
                    marketName={markets[0].name}
                  />
                ) : (
                  <button
                    onClick={() => handleOddsClick(sel, markets[0].name)}
                    className="w-full px-3 py-2 rounded-xl text-sm font-bold bg-white border border-brand-border text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-colors"
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
  );
}
