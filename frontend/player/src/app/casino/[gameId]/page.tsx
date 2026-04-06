"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface GameDetail {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  rtp: number;
  volatility: string;
  minBet: number;
  maxBet: number;
  launchUrl: string;
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          name: "Game",
          provider: "Provider",
          category: "slots",
          description: "An exciting casino game.",
          rtp: 96.5,
          volatility: "Medium",
          minBet: 0.1,
          maxBet: 100,
          launchUrl: "",
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
        setError(err.message || "Failed to launch game session.");
      });
  }, [gameId, isAuthenticated, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Link href="/casino" className="hover:text-white transition-colors">
            Casino
          </Link>
          <span>/</span>
          <span className="text-white">{game?.name}</span>
        </nav>
      </div>

      {/* Game Container */}
      <div
        className={`${
          isFullscreen
            ? "fixed inset-0 z-50 bg-black"
            : "max-w-7xl mx-auto px-4"
        }`}
      >
        <div
          className={`${
            isFullscreen ? "w-full h-full" : "aspect-video max-h-[70vh] rounded-2xl overflow-hidden bg-black relative"
          }`}
        >
          {!isAuthenticated && !authLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-surface">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Log In to Play
                </h2>
                <p className="text-brand-text-muted text-sm mb-6">
                  You need to be logged in to play {game?.name}.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href={`/login?redirect=/casino/${gameId}`}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-2.5 rounded-lg text-sm border border-white/10 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-surface">
              <p className="text-brand-danger mb-4">{error}</p>
              <button
                onClick={() => router.back()}
                className="text-brand-primary hover:underline text-sm"
              >
                Go Back
              </button>
            </div>
          ) : sessionUrl ? (
            <iframe
              src={sessionUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={game?.name || "Game"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-brand-surface">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-brand-text-muted text-sm">
                  Loading {game?.name}...
                </p>
              </div>
            </div>
          )}

          {/* Fullscreen Toggle */}
          {sessionUrl && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Game Info */}
      {!isFullscreen && game && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-brand-surface rounded-xl p-6 border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1">
                <h1 className="font-heading text-2xl font-bold text-white mb-1">
                  {game.name}
                </h1>
                <p className="text-brand-text-muted text-sm mb-4">
                  by {game.provider}
                </p>
                <p className="text-brand-text text-sm leading-relaxed">
                  {game.description}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs text-brand-text-muted mb-0.5">RTP</p>
                  <p className="text-sm font-semibold text-white">
                    {game.rtp}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-0.5">
                    Volatility
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {game.volatility}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-0.5">
                    Min Bet
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {game.minBet.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted mb-0.5">
                    Max Bet
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {game.maxBet.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
