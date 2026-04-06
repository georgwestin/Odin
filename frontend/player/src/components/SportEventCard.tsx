"use client";

import { useState, useEffect } from "react";
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
  elapsed?: string;
  markets: Market[];
  compact?: boolean;
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
  elapsed,
  markets,
  compact = false,
}: SportEventCardProps) {
  const { addSelection, selections } = useBetSlip();

  const isSelected = (selId: string) => selections.some((s) => s.id === selId);

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

  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    setTimeStr(
      new Date(startTime).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [startTime]);

  /* ---- Compact live card variant ---- */
  if (compact) {
    return (
      <Link
        href={`/sports/${id}`}
        className="block bg-white rounded-xl border border-brand-border p-3 hover:shadow-card-hover transition-shadow min-w-[220px] flex-shrink-0"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-brand-text-muted truncate">
            {competitionName}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-brand-danger">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-danger" />
              </span>
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-brand-text truncate">
            {homeTeam}
          </span>
          {score && (
            <span className="text-sm font-bold text-brand-text">{score.home}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-brand-text truncate">
            {awayTeam}
          </span>
          {score && (
            <span className="text-sm font-bold text-brand-text">{score.away}</span>
          )}
        </div>
        {elapsed && (
          <span className="text-xs text-brand-primary font-semibold">{elapsed}</span>
        )}
        {markets[0] && (
          <div className="flex gap-1.5 mt-2">
            {markets[0].selections.map((sel) => (
              <button
                key={sel.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOddsClick(sel, markets[0].name);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isSelected(sel.id)
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-primary border-brand-border hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                }`}
              >
                <span className="block text-[10px] font-normal text-brand-text-muted mb-0.5">
                  {sel.name}
                </span>
                {sel.odds.toFixed(2)}
              </button>
            ))}
          </div>
        )}
      </Link>
    );
  }

  /* ---- Standard row card ---- */
  return (
    <div className="bg-white flex items-center gap-3 px-4 py-3 border-b border-brand-border last:border-b-0 hover:bg-brand-surface-alt/50 transition-colors group">
      {/* Time / Live badge */}
      <div className="w-14 shrink-0 text-center">
        {isLive ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-[11px] font-bold text-brand-danger">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-danger" />
              </span>
              LIVE
            </span>
            {elapsed && (
              <span className="text-[11px] text-brand-primary font-semibold">
                {elapsed}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-brand-text-muted font-medium">
            {timeStr}
          </span>
        )}
      </div>

      {/* Team names */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text truncate leading-tight">
          {homeTeam}
        </p>
        <p className="text-sm font-semibold text-brand-text truncate leading-tight">
          {awayTeam}
        </p>
      </div>

      {/* Score (live only) */}
      {isLive && score && (
        <div className="w-8 shrink-0 text-center">
          <p className="text-sm font-bold text-brand-text leading-tight">
            {score.home}
          </p>
          <p className="text-sm font-bold text-brand-text leading-tight">
            {score.away}
          </p>
        </div>
      )}

      {/* Odds buttons */}
      {markets[0] && (
        <div className="flex gap-1.5 shrink-0">
          {markets[0].selections.map((sel) => (
            <div key={sel.id} className="text-center">
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
                  className={`min-w-[54px] px-3 py-2 rounded-lg text-sm font-bold transition-all border ${
                    isSelected(sel.id)
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-primary border-brand-border hover:bg-brand-primary hover:text-white hover:border-brand-primary"
                  }`}
                >
                  {sel.odds.toFixed(2)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* More markets */}
      <Link
        href={`/sports/${id}`}
        className="w-8 h-8 rounded-lg border border-brand-border flex items-center justify-center text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-colors shrink-0"
        title="Fler marknader"
      >
        <span className="text-sm font-bold">+</span>
      </Link>
    </div>
  );
}
