"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";
import { GameCard } from "@/components/GameCard";

interface GameDetail {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  rtp: string;
  volatility: string;
  minBet: number;
  maxBet: number;
  launchUrl: string;
  thumbnailUrl: string;
}

/* Fallback catalog for related games when API is unavailable */
const RELATED_CATALOG: GameDetail[] = [
  { id: "g1", name: "Starburst", provider: "NetEnt", category: "slots", description: "", rtp: "96.1%", volatility: "Låg", minBet: 1, maxBet: 2000, launchUrl: "", thumbnailUrl: "" },
  { id: "g4", name: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", description: "", rtp: "96.5%", volatility: "Hög", minBet: 2, maxBet: 5000, launchUrl: "", thumbnailUrl: "" },
  { id: "g14", name: "Lightning Roulette", provider: "Evolution", category: "live", description: "", rtp: "97.3%", volatility: "Medel", minBet: 5, maxBet: 10000, launchUrl: "", thumbnailUrl: "" },
  { id: "g22", name: "Bonanza Megaways", provider: "Big Time Gaming", category: "megaways", description: "", rtp: "96.0%", volatility: "Hög", minBet: 2, maxBet: 4000, launchUrl: "", thumbnailUrl: "" },
  { id: "g25", name: "Money Train 3", provider: "Nolimit City", category: "bonus_buy", description: "", rtp: "96.4%", volatility: "Mycket hög", minBet: 2, maxBet: 5000, launchUrl: "", thumbnailUrl: "" },
  { id: "g32", name: "Razor Shark", provider: "Push Gaming", category: "slots", description: "", rtp: "96.7%", volatility: "Hög", minBet: 1, maxBet: 5000, launchUrl: "", thumbnailUrl: "" },
];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { balance, currency } = useWallet();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 0,
    }).format(amount);

  useEffect(() => {
    setLoading(true);
    api
      .get<GameDetail>(`/casino/games/${gameId}`)
      .then((data) => {
        setGame(data);
        setLoading(false);
      })
      .catch(() => {
        setGame({
          id: gameId,
          name: "Casino Spel",
          provider: "NetEnt",
          category: "slots",
          description: "Ett spännande casinospel med hög underhållningsfaktor och chans till stora vinster.",
          rtp: "96.5%",
          volatility: "Medel",
          minBet: 1,
          maxBet: 5000,
          launchUrl: "",
          thumbnailUrl: "",
        });
        setLoading(false);
      });
  }, [gameId]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    api
      .post<{ sessionUrl: string }>(`/casino/games/${gameId}/launch`)
      .then((data) => {
        setSessionUrl(data.sessionUrl);
      })
      .catch((err) => {
        setError(err.message || "Kunde inte starta spelsessionen.");
      });
  }, [gameId, isAuthenticated, authLoading]);

  const relatedGames = useMemo(() => {
    return RELATED_CATALOG.filter((g) => g.id !== gameId).slice(0, 5);
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const infoItems = [
    { label: "RTP", value: game?.rtp || "-" },
    { label: "Volatilitet", value: game?.volatility || "-" },
    { label: "Leverantör", value: game?.provider || "-" },
    { label: "Min insats", value: game?.minBet ? `${game.minBet} kr` : "-" },
    { label: "Max insats", value: game?.maxBet ? `${game.maxBet} kr` : "-" },
  ];

  return (
    <div className="min-h-screen bg-white font-body">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="shrink-0 w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center text-gray-500 hover:text-[#272b33] hover:bg-gray-200 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#272b33] truncate font-body">
                {game?.name}
              </p>
              <p className="text-xs text-gray-500 font-body">{game?.provider}</p>
            </div>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 bg-[#f5f5f7] px-4 py-1.5 rounded-full shrink-0">
              <span className="text-xs text-gray-500 font-body">Saldo:</span>
              <span className="text-sm font-bold text-[#272b33] font-body">
                {formatBalance(balance)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Game iframe container — 16:9 */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4">
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#1A1A2E] shadow-card" style={{ aspectRatio: "16/9" }}>
          {!isAuthenticated && !authLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
              <div className="text-center max-w-sm px-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-gray-400"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[#272b33] mb-1 font-body">
                  Logga in för att spela
                </h2>
                <p className="text-gray-500 text-sm mb-5 font-body">
                  Du måste vara inloggad för att spela {game?.name}.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href={`/login?redirect=/casino/${gameId}`}
                    className="bg-[#44c868] hover:bg-[#3ab85c] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors font-body"
                  >
                    Logga in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-[#f5f5f7] hover:bg-gray-200 text-[#272b33] font-semibold px-6 py-2.5 rounded-full text-sm border border-gray-200 transition-colors font-body"
                  >
                    Skapa konto
                  </Link>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
              <p className="text-red-500 mb-4 font-body">{error}</p>
              <button
                onClick={() => router.back()}
                className="text-[#0066FF] hover:underline text-sm font-body"
              >
                Gå tillbaka
              </button>
            </div>
          ) : sessionUrl ? (
            <iframe
              src={sessionUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={game?.name || "Spel"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <p className="text-white/50 text-sm font-body">
                  Laddar {game?.name}...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Info Card */}
      {game && (
        <div className="max-w-[1400px] mx-auto px-4 pt-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 font-body">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-[#272b33] font-body">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Games */}
      <div className="max-w-[1400px] mx-auto px-4 pt-8 pb-12">
        <h3 className="text-base font-bold text-[#272b33] mb-4 font-body">
          Liknande spel
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {relatedGames.map((g) => (
            <GameCard
              key={g.id}
              id={g.id}
              name={g.name}
              provider={g.provider}
              thumbnailUrl={g.thumbnailUrl}
              rtp={g.rtp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
