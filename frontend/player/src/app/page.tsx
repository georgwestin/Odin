"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxChevronRight } from "react-icons/rx";
import { api } from "@/lib/api";
import { GameCard } from "@/components/GameCard";
import { SportEventCard } from "@/components/SportEventCard";
import { QuickDeposit } from "@/components/QuickDeposit";
import { ResponsibleGambling } from "@/components/ResponsibleGambling";
import { useLocale } from "@/lib/locale-context";
import { heroContent, heroImage, heroGradient } from "@/content/hero";

interface FeaturedGame {
  id: string;
  name: string;
  provider: string;
  thumbnailUrl: string;
  category: string;
  isNew?: boolean;
  isPopular?: boolean;
}

interface LiveEvent {
  id: string;
  sportName: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
  startTime: string;
  isLive: boolean;
  markets: {
    name: string;
    selections: {
      id: string;
      name: string;
      odds: number;
    }[];
  }[];
}

const PLACEHOLDER_GAMES: FeaturedGame[] = [
  { id: "sweet-bonanza-1000", name: "Sweet Bonanza 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/sweet_bonanza_1000-eaa318e2df1742ce95a0030564c8df04.png", category: "slots", isNew: true, isPopular: true },
  { id: "gates-of-olympus-1000", name: "Gates of Olympus 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/gates_of_olympus_1000-9079a11814b04e93a159e220ce7494c3.png", category: "slots", isNew: true, isPopular: true },
  { id: "wanted-dead-or-a-wild", name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", thumbnailUrl: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild-79b41f71993ec33e3c6f3c5e4f48570b.png", category: "slots", isPopular: true },
  { id: "mental", name: "Mental", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/mental-ff2d4673f3bb0120fb8424fa63108311.png", category: "slots", isPopular: true },
  { id: "fire-in-the-hole-3", name: "Fire in the Hole 3", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/fire-in-the-hole-3-f88f7401e66348b24a9af5c684677b00.png", category: "slots", isNew: true, isPopular: true },
  { id: "chaos-crew-2", name: "Chaos Crew 2", provider: "Hacksaw Gaming", thumbnailUrl: "https://cdn.mint.io/production/games/images/chaos-crew-2-2e03414eea4d8c276c69c5916f12dda4.png", category: "slots", isNew: true, isPopular: true },
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", thumbnailUrl: "https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png", category: "live", isPopular: true },
  { id: "tombstone-rip", name: "Tombstone RIP", provider: "Nolimit City", thumbnailUrl: "https://cdn.mint.io/production/games/images/tombstone-rip-3e1e531f095265057b1046919d3fb4e8.png", category: "slots", isPopular: true },
  { id: "starlight-princess-1000", name: "Starlight Princess 1000", provider: "Pragmatic Play", thumbnailUrl: "https://cdn.mint.io/production/games/images/starlight-princess-1000-2bfa4c79244cf71474e66b8897b93b9f.png", category: "slots", isNew: true, isPopular: true },
  { id: "plinko", name: "Plinko", provider: "Spribe", thumbnailUrl: "https://cdn.mint.io/production/games/images/plinko-76a1ae7ca428ec1cc9497e4f52c76976.png", category: "instant", isPopular: true },
];

const PLACEHOLDER_EVENTS: LiveEvent[] = [
  {
    id: "e1",
    sportName: "Fotboll",
    competitionName: "Allsvenskan",
    homeTeam: "Malmo FF",
    awayTeam: "AIK",
    score: { home: 1, away: 0 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [{ name: "1X2", selections: [{ id: "s1", name: "1", odds: 1.85 }, { id: "s2", name: "X", odds: 3.6 }, { id: "s3", name: "2", odds: 4.2 }] }],
  },
  {
    id: "e2",
    sportName: "Ishockey",
    competitionName: "SHL",
    homeTeam: "Farjestad",
    awayTeam: "Frolunda",
    score: { home: 3, away: 2 },
    startTime: new Date().toISOString(),
    isLive: true,
    markets: [{ name: "1X2", selections: [{ id: "s4", name: "1", odds: 2.1 }, { id: "s5", name: "X", odds: 4.0 }, { id: "s6", name: "2", odds: 2.8 }] }],
  },
  {
    id: "e3",
    sportName: "Tennis",
    competitionName: "ATP Stockholm Open",
    homeTeam: "Ruud",
    awayTeam: "Rune",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    isLive: false,
    markets: [{ name: "Vinnare", selections: [{ id: "s7", name: "Ruud", odds: 1.75 }, { id: "s8", name: "Rune", odds: 2.05 }] }],
  },
  {
    id: "e4",
    sportName: "Fotboll",
    competitionName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    startTime: new Date(Date.now() + 7200000).toISOString(),
    isLive: false,
    markets: [{ name: "1X2", selections: [{ id: "s9", name: "1", odds: 1.65 }, { id: "s10", name: "X", odds: 3.8 }, { id: "s11", name: "2", odds: 5.2 }] }],
  },
];

const CATEGORIES = [
  { id: "popular", label: "Populara" },
  { id: "new", label: "Nya" },
  { id: "slots", label: "Slots" },
  { id: "table", label: "Bordsspel" },
  { id: "live", label: "Live Casino" },
];

/* Game thumbnail URLs for the scrolling hero grid */
const HERO_GRID_IMAGES = PLACEHOLDER_GAMES.map((g) => g.thumbnailUrl);

export default function HomePage() {
  const [games, setGames] = useState<FeaturedGame[]>(PLACEHOLDER_GAMES);
  const [events, setEvents] = useState<LiveEvent[]>(PLACEHOLDER_EVENTS);
  const [activeCategory, setActiveCategory] = useState("popular");

  useEffect(() => {
    api
      .get<{ items: FeaturedGame[] }>("/casino/games?featured=true&limit=10")
      .then((res) => setGames(res.items))
      .catch(() => {});

    api
      .get<{ items: LiveEvent[] }>("/sports/events?live=true&limit=6")
      .then((res) => setEvents(res.items))
      .catch(() => {});
  }, []);

  const filteredGames = games.filter((g) => {
    if (activeCategory === "popular") return g.isPopular;
    if (activeCategory === "new") return g.isNew;
    return g.category === activeCategory;
  });

  const displayGames = filteredGames.length > 0 ? filteredGames : games.slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header76: Hero with scrolling game grid ===== */}
      <HeroSection />

      {/* ===== Layout239: "Everything you need to win big" ===== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28" style={{ backgroundColor: "#FFD100" }}>
        <div className="container mx-auto">
          <div className="flex flex-col items-center">
            <div className="mb-12 text-center md:mb-18 lg:mb-20">
              <div className="w-full max-w-lg">
                <h2 className="mb-5 text-4xl font-bold text-[#004B9A] md:mb-6 md:text-6xl lg:text-7xl">
                  Everything you need to win big
                </h2>
                <p className="text-black/70 md:text-md">
                  We offer hundreds of casino games and live dealers ready to
                  play. Sports betting runs alongside it all, giving you options
                  that matter.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
              <Link href="/sports" className="flex w-full flex-col items-center text-center group">
                <div className="mb-6 md:mb-8 overflow-hidden rounded-xl">
                  <img
                    src="https://cdn.mint.io/production/games/images/immersive-roulette-066a301e6632725813a55e5dde308937.png"
                    alt="Sports betting"
                    className="w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="mb-5 text-2xl font-bold text-black md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                  Sports betting
                </h3>
                <p className="text-black/70">
                  Place bets on football, hockey, and other major sports worldwide.
                </p>
              </Link>
              <Link href="/casino" className="flex w-full flex-col items-center text-center group">
                <div className="mb-6 md:mb-8 overflow-hidden rounded-xl">
                  <img
                    src="https://cdn.mint.io/production/games/images/sweet_bonanza_1000-eaa318e2df1742ce95a0030564c8df04.png"
                    alt="Casino games"
                    className="w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="mb-5 text-2xl font-bold text-black md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                  Casino games
                </h3>
                <p className="text-black/70">Slots, blackjack, roulette, and poker with real stakes.</p>
              </Link>
              <Link href="/live-casino" className="flex w-full flex-col items-center text-center group">
                <div className="mb-6 md:mb-8 overflow-hidden rounded-xl">
                  <img
                    src="https://cdn.mint.io/production/games/images/gates_of_olympus_1000-9079a11814b04e93a159e220ce7494c3.png"
                    alt="Live dealers"
                    className="w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="mb-5 text-2xl font-bold text-black md:mb-6 md:text-3xl md:leading-[1.3] lg:text-4xl">
                  Live dealers
                </h3>
                <p className="text-black/70">
                  Watch the action unfold with professional dealers in real time.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats15: Trust section ===== */}
      <section className="relative px-[5%] py-16 md:py-24 lg:py-28 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/sweden-audience.webp')" }}
        />
        <div className="absolute inset-0 bg-[#004B9A]/50" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-2 lg:gap-x-[4.75rem]">
            <div>
              <h2 className="mb-5 text-4xl font-bold text-white md:mb-6 md:text-6xl lg:text-7xl">
                You can trust us
              </h2>
              <p className="text-white/80 md:text-md">
                Built and run by trustworthy Swedes being in the industry for 10+
                years. No bullshit bonuses but real money cash back if you happen
                to have a bad week.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-y-8 py-2 md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div className="border-l-2 border-[#00CC9F] pl-8">
                <p className="mb-2 text-6xl font-bold leading-[1.3] text-white md:text-[4rem] lg:text-[5rem]">
                  2,500+
                </p>
                <h3 className="text-md font-bold leading-[1.4] text-white/80 md:text-xl">
                  Games available
                </h3>
              </div>
              <div className="border-l-2 border-[#00CC9F] pl-8">
                <p className="mb-2 text-6xl font-bold leading-[1.3] text-white md:text-[4rem] lg:text-[5rem]">
                  47,000
                </p>
                <h3 className="text-md font-bold leading-[1.4] text-white/80 md:text-xl">
                  Winners this month
                </h3>
              </div>
              <div className="border-l-2 border-[#00CC9F] pl-8">
                <p className="mb-2 text-6xl font-bold leading-[1.3] text-white md:text-[4rem] lg:text-[5rem]">
                  97.1%
                </p>
                <h3 className="text-md font-bold leading-[1.4] text-white/80 md:text-xl">
                  Slot payout percentage
                </h3>
              </div>
              <div className="border-l-2 border-[#00CC9F] pl-8">
                <p className="mb-2 text-6xl font-bold leading-[1.3] text-white md:text-[4rem] lg:text-[5rem]">
                  11,000
                </p>
                <h3 className="text-md font-bold leading-[1.4] text-white/80 md:text-xl">
                  Active players
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sports Betting Preview - Dagens matcher ===== */}
      <section className="bg-brand-surface-alt py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">
              Dagens matcher
            </h2>
            <Link
              href="/sports"
              className="text-brand-primary hover:text-brand-primary-hover text-sm font-semibold"
            >
              Alla sportevent
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event) => (
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
                markets={event.markets}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== EventItemHeader2: Countdown promo ===== */}
      <CountdownPromo />

      {/* ===== Layout300: Four steps to start playing ===== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container mx-auto">
          <div className="flex flex-col items-start">
            <div className="mx-auto mb-12 w-full max-w-lg items-start justify-between gap-5 md:mb-18 lg:mb-20">
              <p className="mb-3 text-center font-semibold text-brand-primary md:mb-4">Process</p>
              <h2 className="mb-5 text-center text-4xl font-bold text-white md:mb-6 md:text-6xl lg:text-7xl">
                Four steps to start playing
              </h2>
              <p className="text-center text-brand-text-muted md:text-md">
                Getting started takes minutes. No long forms, no waiting around.
                Just sign up and play.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">
              {[
                {
                  img: "https://cdn.mint.io/production/games/images/sweet_bonanza_1000-eaa318e2df1742ce95a0030564c8df04.png",
                  title: "Create your account",
                  desc: "Enter your details and verify your email. Takes less than two minutes to complete.",
                },
                {
                  img: "https://cdn.mint.io/production/games/images/gates_of_olympus_1000-9079a11814b04e93a159e220ce7494c3.png",
                  title: "Make your first deposit",
                  desc: "Choose your payment method and add funds. Your bonus arrives instantly with the deposit.",
                },
                {
                  img: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild-79b41f71993ec33e3c6f3c5e4f48570b.png",
                  title: "Pick your game",
                  desc: "Browse casino games or sports betting. Start with whatever interests you most right now.",
                },
                {
                  img: "https://cdn.mint.io/production/games/images/mental-ff2d4673f3bb0120fb8424fa63108311.png",
                  title: "Cash out your winnings",
                  desc: "Withdraw to your account anytime. Most payouts process within 24 hours without hassle.",
                },
              ].map((step, i) => (
                <div key={i} className="w-full">
                  <div className="mb-5 md:mb-6 overflow-hidden rounded-xl">
                    <img
                      src={step.img}
                      alt={step.title}
                      className="w-full object-cover"
                    />
                  </div>
                  <h3 className="mb-3 text-center text-xl font-bold md:mb-4 md:text-2xl">
                    {step.title}
                  </h3>
                  <p className="text-center text-brand-text-muted">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-4 md:mt-18 lg:mt-20">
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-brand-text font-semibold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
              >
                Start
              </Link>
              <Link
                href="/casino"
                className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:underline"
              >
                Browse games <RxChevronRight className="inline" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Faq13: Questions ===== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28 bg-brand-surface-alt">
        <div className="container mx-auto">
          <div className="mb-12 w-full max-w-lg md:mb-18 lg:mb-20">
            <h2 className="mb-5 text-4xl font-bold text-white md:mb-6 md:text-6xl lg:text-7xl">
              Questions
            </h2>
            <p className="text-brand-text-muted md:text-md">
              Find answers about how SwedBet works and what we offer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
            {[
              { q: "Is my money safe here?", a: "We use encryption and secure payment processors to protect your account. Your funds are held in regulated accounts and available for withdrawal anytime you need them." },
              { q: "How fast are payouts?", a: "Most withdrawals process within 24 hours. We don't hold winnings or create delays. What you win is yours to take out immediately." },
              { q: "What payment methods work?", a: "We accept bank transfers, credit cards, and digital wallets. Choose whatever method works best for you and deposit instantly." },
              { q: "Can I set spending limits?", a: "Yes. You can set daily, weekly, or monthly deposit limits on your account. We also offer self-exclusion options if you need to step back." },
              { q: "Do you have live support?", a: "Our support team is available 24/7 through live chat and email. We respond quickly because your questions matter." },
              { q: "What games can I play?", a: "We offer over 2,500 games including slots, table games, live dealers, and sports betting. New games are added regularly so there's always something fresh to try." },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="mb-3 text-base font-bold md:mb-4 md:text-md">
                  {faq.q}
                </h3>
                <p className="text-brand-text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 md:mt-18 lg:mt-20">
            <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
              Need more help?
            </h4>
            <p className="text-brand-text-muted md:text-md">
              Reach out to our team anytime for support.
            </p>
            <div className="mt-6 md:mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-brand-text font-semibold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Cta1: Money back guarantee ===== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-x-20 gap-y-12 md:gap-y-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-5 text-4xl font-bold text-white md:mb-6 md:text-6xl lg:text-7xl">
                Money back guarantee
              </h2>
              <p className="text-brand-text-muted md:text-md">
                Should you have a bad betting week? We give you 10% of the losses
                back every friday! Real money, no questions asked!
              </p>
              <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-brand-text text-white font-semibold hover:bg-brand-text/90 transition-colors"
                >
                  Sign up
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-brand-text font-semibold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
                >
                  See terms
                </Link>
              </div>
            </div>
            <div>
              <img
                src="https://cdn.mint.io/production/games/images/fire-in-the-hole-3-f88f7401e66348b24a9af5c684677b00.png"
                className="w-full object-cover rounded-xl"
                alt="Money back guarantee promotion"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Cta7: Final CTA ===== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28" style={{ backgroundColor: "#010D13" }}>
        <div className="container mx-auto grid w-full grid-cols-1 items-start justify-between gap-6 md:grid-cols-[1fr_max-content] md:gap-x-12 md:gap-y-8 lg:gap-x-20">
          <div className="md:mr-12 lg:mr-0">
            <div className="w-full max-w-lg">
              <h2 className="mb-3 text-4xl font-bold leading-[1.2] text-white md:mb-4 md:text-5xl lg:text-6xl">
                Let&apos;s gooooo Sweden!
              </h2>
              <p className="text-white/70 md:text-md">
                BankID login, familiar games, and real money waiting for you now.
              </p>
            </div>
          </div>
          <div className="flex items-start justify-start gap-4">
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-[#010D13] font-semibold hover:bg-gray-100 transition-colors"
            >
              Play
            </Link>
            <Link
              href="/casino"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-white font-semibold text-white hover:bg-white hover:text-[#010D13] transition-colors"
            >
              Explore
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Provider Logos ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-heading text-lg font-bold text-brand-text text-center mb-8">
          Spelleverantorer
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {["NetEnt", "Evolution", "Pragmatic Play", "Play'n GO", "Microgaming", "Yggdrasil", "Red Tiger", "Big Time Gaming"].map(
            (provider) => (
              <div
                key={provider}
                className="px-5 py-3 rounded-xl border border-brand-border bg-white text-sm font-medium text-brand-text-muted"
              >
                {provider}
              </div>
            )
          )}
        </div>
      </section>

      {/* ===== Payment Methods ===== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {["Swish", "Trustly", "Visa", "Mastercard", "Bankoverfor."].map(
            (method) => (
              <div
                key={method}
                className="px-5 py-2.5 rounded-full border border-brand-border text-sm font-medium text-brand-text-muted"
              >
                {method}
              </div>
            )
          )}
        </div>
      </section>

      {/* ===== Responsible Gambling ===== */}
      <ResponsibleGambling />
    </div>
  );
}

/** Hero section with animated scrolling game image grid (Header76 pattern) */
function HeroSection() {
  const { locale } = useLocale();
  const content = locale === "en" ? heroContent.en : heroContent.sv;

  const col1Images = HERO_GRID_IMAGES.slice(0, 5);
  const col2Images = HERO_GRID_IMAGES.slice(5, 10);
  /* Duplicate for seamless loop */
  const col1Loop = [...col1Images, ...col1Images];
  const col2Loop = [...col2Images, ...col2Images];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${heroGradient.from}, ${heroGradient.to})` }}
    >
      <div className="max-w-[1400px] mx-auto px-[5%] py-10 md:py-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left: text */}
          <div className="flex-1 md:max-w-xl w-full">
            <h1 className="mb-4 text-3xl font-bold text-white md:mb-6 md:text-6xl lg:text-7xl">
              {content.headline}
            </h1>
            <p className="text-white/70 md:text-lg">
              {content.subheadline}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
              <Link
                href={content.ctaUrl}
                className="inline-flex items-center px-8 py-3 bg-[#FFD100] text-black text-base font-semibold hover:bg-[#e6bc00] transition-colors"
              >
                {content.ctaText}
              </Link>
            </div>
            {/* Mobile horizontal carousel */}
            <div className="md:hidden mt-8 overflow-hidden">
              <div className="animate-loop-horizontally flex gap-3 w-max">
                {[
                  "/images/captain-kraken-megaways.webp",
                  "/images/crashgame.webp",
                  "/images/dragon-tiger.webp",
                  "/images/good-girl-bad-girl.webp",
                  "/images/haunted-crypt.webp",
                  "/images/immersive-roulette.webp",
                  "/images/jelly-express.webp",
                  "/images/original_dice.webp",
                  "/images/starlight-princess.webp",
                  "/images/captain-kraken-megaways.webp",
                  "/images/crashgame.webp",
                  "/images/dragon-tiger.webp",
                  "/images/good-girl-bad-girl.webp",
                  "/images/haunted-crypt.webp",
                  "/images/immersive-roulette.webp",
                  "/images/jelly-express.webp",
                  "/images/original_dice.webp",
                  "/images/starlight-princess.webp",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Right: scrolling game images (desktop only) */}
          <div className="hidden md:block w-[300px] lg:w-[380px] h-[500px] overflow-hidden rounded-2xl shrink-0">
            <div className="grid grid-cols-2 gap-3">
              {/* Column 1 */}
              <div className="animate-loop-vertically flex flex-col gap-3" style={{ marginTop: "-100%" }}>
                {col1Loop.map((src, i) => (
                  <img
                    key={`c1-${i}`}
                    className="w-full rounded-xl"
                    style={{ aspectRatio: "3/4" }}
                    src={src}
                    alt=""
                  />
                ))}
              </div>
              {/* Column 2 */}
              <div className="animate-loop-vertically flex flex-col gap-3">
                {col2Loop.map((src, i) => (
                  <img
                    key={`c2-${i}`}
                    className="w-full rounded-xl"
                    style={{ aspectRatio: "3/4" }}
                    src={src}
                    alt=""
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Countdown promo section (EventItemHeader2 pattern) */
function CountdownPromo() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    /* 15th June 2026 at 04:00 CET (03:00 UTC) */
    const target = new Date("2026-06-15T03:00:00Z");

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, mins, secs });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative px-[5%] py-16 md:py-24 lg:py-28 bg-brand-surface-alt">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <h2 className="mt-3 text-5xl font-bold md:mt-4 md:text-7xl lg:text-8xl">
          Sweden is playing the World Cup!
        </h2>
        <p className="mt-5 text-brand-text-muted text-base md:mt-6 md:text-md">
          You are never more Swedish than when being abroad!
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 border border-brand-border rounded-xl px-4 py-4 sm:flex-nowrap sm:px-6 bg-white">
          <div className="flex min-w-[4.5rem] flex-col items-center">
            <span className="text-4xl font-bold leading-[1.2] md:text-5xl lg:text-6xl">
              {countdown.days}
            </span>
            <span className="text-brand-text-muted text-sm">Days</span>
          </div>
          <div className="hidden w-px bg-brand-border sm:block" />
          <div className="flex min-w-[4.5rem] flex-col items-center">
            <span className="text-4xl font-bold leading-[1.2] md:text-5xl lg:text-6xl">
              {countdown.hours}
            </span>
            <span className="text-brand-text-muted text-sm">Hours</span>
          </div>
          <div className="hidden w-px bg-brand-border sm:block" />
          <div className="flex min-w-[4.5rem] flex-col items-center">
            <span className="text-4xl font-bold leading-[1.2] md:text-5xl lg:text-6xl">
              {countdown.mins}
            </span>
            <span className="text-brand-text-muted text-sm">Mins</span>
          </div>
          <div className="hidden w-px bg-brand-border sm:block" />
          <div className="flex min-w-[4.5rem] flex-col items-center">
            <span className="text-4xl font-bold leading-[1.2] md:text-5xl lg:text-6xl">
              {countdown.secs}
            </span>
            <span className="text-brand-text-muted text-sm">Secs</span>
          </div>
        </div>
        <div className="mt-6 w-full max-w-sm md:mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-brand-text text-white font-semibold hover:bg-brand-text/90 transition-colors"
          >
            Claim bonus
          </Link>
          <p className="mt-4 text-xs text-brand-text-muted">
            By claiming your bonus you agree to our terms and responsible gaming
            policies.
          </p>
        </div>
      </div>
    </section>
  );
}
