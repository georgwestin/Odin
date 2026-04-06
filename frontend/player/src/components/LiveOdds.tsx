"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useBetSlip, BetSelection } from "@/stores/betslip";

interface OddsUpdate {
  selectionId: string;
  odds: number;
}

interface LiveOddsProps {
  eventId: string;
  selectionId: string;
  initialOdds: number;
  selectionName: string;
  eventName: string;
  marketName: string;
}

export function LiveOdds({
  eventId,
  selectionId,
  initialOdds,
  selectionName,
  eventName,
  marketName,
}: LiveOddsProps) {
  const [odds, setOdds] = useState(initialOdds);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const prevOddsRef = useRef(initialOdds);

  const { addSelection, selections, updateOdds } = useBetSlip();
  const isSelected = selections.some((s) => s.id === selectionId);

  const handleOddsUpdate = useCallback(
    (update: OddsUpdate) => {
      if (update.selectionId === selectionId) {
        const prev = prevOddsRef.current;
        const next = update.odds;

        if (next > prev) setDirection("up");
        else if (next < prev) setDirection("down");

        prevOddsRef.current = next;
        setOdds(next);
        updateOdds(selectionId, next);

        setTimeout(() => setDirection(null), 1500);
      }
    },
    [selectionId, updateOdds]
  );

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws/odds";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe", eventId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "odds_update") {
            handleOddsUpdate(data.payload);
          }
        } catch {
          // Invalid message, ignore
        }
      };

      ws.onerror = () => {
        // WebSocket error, will attempt reconnect via onclose
      };

      ws.onclose = () => {
        // Reconnect after delay
        setTimeout(() => {
          if (wsRef.current === ws) {
            const newWs = new WebSocket(wsUrl);
            wsRef.current = newWs;
          }
        }, 3000);
      };
    } catch {
      // WebSocket not available
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [eventId, handleOddsUpdate]);

  const handleClick = () => {
    const selection: BetSelection = {
      id: selectionId,
      eventId,
      eventName,
      marketName,
      selectionName,
      odds,
    };
    addSelection(selection);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
        ${
          isSelected
            ? "bg-brand-primary text-black ring-2 ring-brand-primary"
            : "bg-brand-surface-alt/60 text-white hover:bg-brand-surface-alt"
        }
        ${direction === "up" ? "animate-odds-up" : ""}
        ${direction === "down" ? "animate-odds-down" : ""}
      `}
    >
      {direction === "up" && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-success" />
      )}
      {direction === "down" && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-danger" />
      )}
      {odds.toFixed(2)}
    </button>
  );
}
