"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

// Game interface
interface Game {
  id: string;
  name: string;
  slug: string;
  provider: string;
  category: string;
  description: string;
  imageUrl: string;
  launchUrl: string;
  rtp: number;
  volatility: string;
  minBet: number;
  maxBet: number;
  active: boolean;
  isNew: boolean;
  isPopular: boolean;
  isExclusive: boolean;
  brands: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// 35 placeholder games with realistic data
const mockGames: Game[] = [
  { id: "g1", name: "Sweet Bonanza", slug: "sweet-bonanza", provider: "Pragmatic Play", category: "slots", description: "Popular candy slot with tumble feature", imageUrl: "https://cdn.mint.io/production/games/images/sweet-bonanza.jpg", launchUrl: "/launch/sweet-bonanza", rtp: 96.48, volatility: "medium-high", minBet: 1, maxBet: 1250, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["tumble", "free-spins", "multiplier"], createdAt: "2025-06-01", updatedAt: "2026-03-15" },
  { id: "g2", name: "Gates of Olympus", slug: "gates-of-olympus", provider: "Pragmatic Play", category: "slots", description: "Zeus theme with multipliers", imageUrl: "https://cdn.mint.io/production/games/images/gates-of-olympus.jpg", launchUrl: "/launch/gates-of-olympus", rtp: 96.50, volatility: "high", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming"], tags: ["tumble", "multiplier", "bonus-buy"], createdAt: "2025-06-01", updatedAt: "2026-03-20" },
  { id: "g3", name: "Book of Dead", slug: "book-of-dead", provider: "Play'n GO", category: "slots", description: "Classic Egyptian adventure slot", imageUrl: "https://cdn.mint.io/production/games/images/book-of-dead.jpg", launchUrl: "/launch/book-of-dead", rtp: 96.21, volatility: "high", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["free-spins", "expanding-symbols"], createdAt: "2025-05-15", updatedAt: "2026-02-10" },
  { id: "g4", name: "Starburst", slug: "starburst", provider: "NetEnt", category: "slots", description: "Iconic jewel slot with expanding wilds", imageUrl: "https://cdn.mint.io/production/games/images/starburst.jpg", launchUrl: "/launch/starburst", rtp: 96.09, volatility: "low", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"], tags: ["expanding-wilds", "both-ways"], createdAt: "2025-04-01", updatedAt: "2026-01-05" },
  { id: "g5", name: "Wanted Dead or a Wild", slug: "wanted-dead-or-a-wild", provider: "Hacksaw Gaming", category: "slots", description: "Wild West theme with duel feature", imageUrl: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild.jpg", launchUrl: "/launch/wanted-dead-or-a-wild", rtp: 96.38, volatility: "extreme", minBet: 2, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["bonus-buy", "multiplier", "duel"], createdAt: "2025-07-10", updatedAt: "2026-03-25" },
  { id: "g6", name: "Mental", slug: "mental", provider: "Nolimit City", category: "slots", description: "Dark slot with extreme multipliers", imageUrl: "https://cdn.mint.io/production/games/images/mental.jpg", launchUrl: "/launch/mental", rtp: 96.08, volatility: "extreme", minBet: 2, maxBet: 600, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["bonus-buy", "xways", "dark-theme"], createdAt: "2025-08-01", updatedAt: "2026-02-20" },
  { id: "g7", name: "Gonzo's Quest Megaways", slug: "gonzos-quest-megaways", provider: "NetEnt", category: "megaways", description: "Megaways version of the classic", imageUrl: "https://cdn.mint.io/production/games/images/gonzos-quest-megaways.jpg", launchUrl: "/launch/gonzos-quest-megaways", rtp: 96.00, volatility: "high", minBet: 1, maxBet: 400, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["megaways", "avalanche", "free-spins"], createdAt: "2025-06-15", updatedAt: "2026-01-30" },
  { id: "g8", name: "Reactoonz 2", slug: "reactoonz-2", provider: "Play'n GO", category: "slots", description: "Cute space monsters with cluster wins", imageUrl: "https://cdn.mint.io/production/games/images/reactoonz-2.jpg", launchUrl: "/launch/reactoonz-2", rtp: 96.20, volatility: "high", minBet: 2, maxBet: 1000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["cluster-pays", "cascading"], createdAt: "2025-05-20", updatedAt: "2026-02-15" },
  { id: "g9", name: "Immortal Romance", slug: "immortal-romance", provider: "Microgaming", category: "slots", description: "Vampire theme with free spins features", imageUrl: "https://cdn.mint.io/production/games/images/immortal-romance.jpg", launchUrl: "/launch/immortal-romance", rtp: 96.86, volatility: "medium", minBet: 1, maxBet: 300, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["free-spins", "wild-desire"], createdAt: "2025-04-10", updatedAt: "2025-12-01" },
  { id: "g10", name: "Vikings Go Berzerk", slug: "vikings-go-berzerk", provider: "Yggdrasil", category: "slots", description: "Viking theme with berserk mode", imageUrl: "https://cdn.mint.io/production/games/images/vikings-go-berzerk.jpg", launchUrl: "/launch/vikings-go-berzerk", rtp: 96.10, volatility: "medium-high", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming", "Valhalla Bet"], tags: ["free-spins", "rage-meter"], createdAt: "2025-05-01", updatedAt: "2026-01-15" },
  { id: "g11", name: "Bounty Hunters", slug: "bounty-hunters", provider: "Nolimit City", category: "slots", description: "Bounty hunters in the Wild West", imageUrl: "https://cdn.mint.io/production/games/images/bounty-hunters.jpg", launchUrl: "/launch/bounty-hunters", rtp: 96.04, volatility: "extreme", minBet: 2, maxBet: 800, active: true, isNew: true, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["bonus-buy", "xways"], createdAt: "2026-03-01", updatedAt: "2026-04-01" },
  { id: "g12", name: "Mega Moolah", slug: "mega-moolah", provider: "Microgaming", category: "jackpot", description: "Classic progressive jackpot slot", imageUrl: "https://cdn.mint.io/production/games/images/mega-moolah.jpg", launchUrl: "/launch/mega-moolah", rtp: 88.12, volatility: "medium", minBet: 1, maxBet: 125, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"], tags: ["jackpot", "progressive"], createdAt: "2025-04-01", updatedAt: "2025-11-20" },
  { id: "g13", name: "Crazy Time", slug: "crazy-time", provider: "Evolution", category: "game-shows", description: "Live game show with bonus rounds", imageUrl: "https://cdn.mint.io/production/games/images/crazy-time.jpg", launchUrl: "/launch/crazy-time", rtp: 95.50, volatility: "high", minBet: 5, maxBet: 5000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["live", "game-show", "multiplier"], createdAt: "2025-06-01", updatedAt: "2026-03-10" },
  { id: "g14", name: "Lightning Roulette", slug: "lightning-roulette", provider: "Evolution", category: "live", description: "Live roulette with random multipliers", imageUrl: "https://cdn.mint.io/production/games/images/lightning-roulette.jpg", launchUrl: "/launch/lightning-roulette", rtp: 97.30, volatility: "medium", minBet: 5, maxBet: 10000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet", "Thor Gaming"], tags: ["live", "roulette", "multiplier"], createdAt: "2025-05-01", updatedAt: "2026-02-28" },
  { id: "g15", name: "Blackjack VIP", slug: "blackjack-vip", provider: "Evolution", category: "live", description: "VIP blackjack with high stakes", imageUrl: "https://cdn.mint.io/production/games/images/blackjack-vip.jpg", launchUrl: "/launch/blackjack-vip", rtp: 99.28, volatility: "low", minBet: 50, maxBet: 25000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["live", "blackjack", "vip"], createdAt: "2025-04-15", updatedAt: "2026-01-10" },
  { id: "g16", name: "Bonanza Megaways", slug: "bonanza-megaways", provider: "Big Time Gaming", category: "megaways", description: "Mining theme with up to 117,649 win lines", imageUrl: "https://cdn.mint.io/production/games/images/bonanza-megaways.jpg", launchUrl: "/launch/bonanza-megaways", rtp: 96.00, volatility: "high", minBet: 2, maxBet: 400, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["megaways", "free-spins", "unlimited-multiplier"], createdAt: "2025-05-10", updatedAt: "2026-01-20" },
  { id: "g17", name: "Tome of Madness", slug: "tome-of-madness", provider: "Play'n GO", category: "slots", description: "Lovecraftian theme with portals", imageUrl: "https://cdn.mint.io/production/games/images/tome-of-madness.jpg", launchUrl: "/launch/tome-of-madness", rtp: 96.59, volatility: "high", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["cluster-pays", "cascading"], createdAt: "2025-07-01", updatedAt: "2026-02-05" },
  { id: "g18", name: "Fire Joker", slug: "fire-joker", provider: "Play'n GO", category: "slots", description: "Classic 3-reel slot", imageUrl: "https://cdn.mint.io/production/games/images/fire-joker.jpg", launchUrl: "/launch/fire-joker", rtp: 96.15, volatility: "medium", minBet: 1, maxBet: 200, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming"], tags: ["classic", "respin"], createdAt: "2025-04-01", updatedAt: "2025-12-15" },
  { id: "g19", name: "Rise of Merlin", slug: "rise-of-merlin", provider: "Play'n GO", category: "slots", description: "Magical adventure with expanding symbols", imageUrl: "https://cdn.mint.io/production/games/images/rise-of-merlin.jpg", launchUrl: "/launch/rise-of-merlin", rtp: 96.58, volatility: "high", minBet: 1, maxBet: 500, active: false, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["free-spins", "expanding-symbols"], createdAt: "2025-05-01", updatedAt: "2026-03-01" },
  { id: "g20", name: "Chaos Crew", slug: "chaos-crew", provider: "Hacksaw Gaming", category: "slots", description: "Colorful slot with bonus buy", imageUrl: "https://cdn.mint.io/production/games/images/chaos-crew.jpg", launchUrl: "/launch/chaos-crew", rtp: 96.30, volatility: "extreme", minBet: 2, maxBet: 1000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["bonus-buy", "free-spins"], createdAt: "2025-08-15", updatedAt: "2026-02-25" },
  { id: "g21", name: "Gems Bonanza", slug: "gems-bonanza", provider: "Pragmatic Play", category: "slots", description: "Cluster slot with big wins", imageUrl: "https://cdn.mint.io/production/games/images/gems-bonanza.jpg", launchUrl: "/launch/gems-bonanza", rtp: 96.51, volatility: "high", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["cluster-pays", "tumble", "multiplier"], createdAt: "2025-07-20", updatedAt: "2026-03-05" },
  { id: "g22", name: "Wild West Gold Megaways", slug: "wild-west-gold-megaways", provider: "Pragmatic Play", category: "megaways", description: "Wild West with Megaways mechanic", imageUrl: "https://cdn.mint.io/production/games/images/wild-west-gold-megaways.jpg", launchUrl: "/launch/wild-west-gold-megaways", rtp: 96.48, volatility: "high", minBet: 2, maxBet: 500, active: true, isNew: true, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["megaways", "free-spins", "sticky-wilds"], createdAt: "2026-02-15", updatedAt: "2026-04-01" },
  { id: "g23", name: "Aviator", slug: "aviator", provider: "Spribe", category: "instant", description: "Crash game with social aspect", imageUrl: "https://cdn.mint.io/production/games/images/aviator.jpg", launchUrl: "/launch/aviator", rtp: 97.00, volatility: "medium", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"], tags: ["instant", "crash", "social"], createdAt: "2025-06-10", updatedAt: "2026-03-18" },
  { id: "g24", name: "Plinko", slug: "plinko", provider: "Spribe", category: "instant", description: "Classic plinko game with multipliers", imageUrl: "https://cdn.mint.io/production/games/images/plinko.jpg", launchUrl: "/launch/plinko", rtp: 97.00, volatility: "medium", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["instant", "plinko"], createdAt: "2025-09-01", updatedAt: "2026-02-10" },
  { id: "g25", name: "Dragon Tiger", slug: "dragon-tiger", provider: "Evolution", category: "live", description: "Fast live card game", imageUrl: "https://cdn.mint.io/production/games/images/dragon-tiger.jpg", launchUrl: "/launch/dragon-tiger", rtp: 96.27, volatility: "low", minBet: 5, maxBet: 5000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["live", "card-game"], createdAt: "2025-07-15", updatedAt: "2026-01-25" },
  { id: "g26", name: "Money Train 3", slug: "money-train-3", provider: "Hacksaw Gaming", category: "slots", description: "Third installment in the Money Train series", imageUrl: "https://cdn.mint.io/production/games/images/money-train-3.jpg", launchUrl: "/launch/money-train-3", rtp: 96.40, volatility: "extreme", minBet: 2, maxBet: 800, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: ["bonus-buy", "respin", "collector"], createdAt: "2025-08-20", updatedAt: "2026-03-28" },
  { id: "g27", name: "Monopoly Live", slug: "monopoly-live", provider: "Evolution", category: "game-shows", description: "Live Monopoly with bonus rounds", imageUrl: "https://cdn.mint.io/production/games/images/monopoly-live.jpg", launchUrl: "/launch/monopoly-live", rtp: 96.23, volatility: "medium-high", minBet: 5, maxBet: 5000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["live", "game-show", "board-game"], createdAt: "2025-06-20", updatedAt: "2026-02-18" },
  { id: "g28", name: "San Quentin xWays", slug: "san-quentin-xways", provider: "Nolimit City", category: "slots", description: "Prison theme with extreme wins", imageUrl: "https://cdn.mint.io/production/games/images/san-quentin-xways.jpg", launchUrl: "/launch/san-quentin-xways", rtp: 96.03, volatility: "extreme", minBet: 2, maxBet: 600, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["bonus-buy", "xways", "splitting-symbols"], createdAt: "2025-09-10", updatedAt: "2026-03-08" },
  { id: "g29", name: "Big Bass Bonanza", slug: "big-bass-bonanza", provider: "Pragmatic Play", category: "slots", description: "Fishing theme with free spins", imageUrl: "https://cdn.mint.io/production/games/images/big-bass-bonanza.jpg", launchUrl: "/launch/big-bass-bonanza", rtp: 96.71, volatility: "high", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming"], tags: ["free-spins", "money-collect"], createdAt: "2025-05-25", updatedAt: "2026-03-12" },
  { id: "g30", name: "ELK Gold", slug: "elk-gold", provider: "ELK Studios", category: "slots", description: "Gold mining theme with X-iter", imageUrl: "https://cdn.mint.io/production/games/images/elk-gold.jpg", launchUrl: "/launch/elk-gold", rtp: 95.00, volatility: "high", minBet: 2, maxBet: 400, active: false, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino"], tags: ["x-iter", "bonus-buy"], createdAt: "2025-10-01", updatedAt: "2026-01-15" },
  { id: "g31", name: "Fruit Party 2", slug: "fruit-party-2", provider: "Pragmatic Play", category: "slots", description: "Fruit theme with clusters and multipliers", imageUrl: "https://cdn.mint.io/production/games/images/fruit-party-2.jpg", launchUrl: "/launch/fruit-party-2", rtp: 96.53, volatility: "high", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["cluster-pays", "tumble", "multiplier"], createdAt: "2025-08-05", updatedAt: "2026-02-22" },
  { id: "g32", name: "Jammin' Jars 2", slug: "jammin-jars-2", provider: "Push Gaming", category: "slots", description: "Jam theme with clusters and giga jar", imageUrl: "https://cdn.mint.io/production/games/images/jammin-jars-2.jpg", launchUrl: "/launch/jammin-jars-2", rtp: 96.40, volatility: "high", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: ["cluster-pays", "multiplier", "giga-jar"], createdAt: "2025-07-05", updatedAt: "2026-01-28" },
  { id: "g33", name: "Fortune Tiger", slug: "fortune-tiger", provider: "PG Soft", category: "slots", description: "Asian theme with respin feature", imageUrl: "https://cdn.mint.io/production/games/images/fortune-tiger.jpg", launchUrl: "/launch/fortune-tiger", rtp: 96.81, volatility: "medium", minBet: 1, maxBet: 500, active: true, isNew: true, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Thor Gaming", "Freya Slots"], tags: ["respin", "multiplier"], createdAt: "2026-03-10", updatedAt: "2026-04-02" },
  { id: "g34", name: "Red Tiger Jackpot", slug: "red-tiger-jackpot", provider: "Red Tiger", category: "jackpot", description: "Daily jackpot with three tiers", imageUrl: "https://cdn.mint.io/production/games/images/red-tiger-jackpot.jpg", launchUrl: "/launch/red-tiger-jackpot", rtp: 95.70, volatility: "medium-high", minBet: 1, maxBet: 400, active: true, isNew: false, isPopular: false, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: ["jackpot", "daily-jackpot"], createdAt: "2025-09-15", updatedAt: "2026-02-08" },
  { id: "g35", name: "Playson Viking Slot", slug: "playson-viking-slot", provider: "Playson", category: "slots", description: "Exclusive viking slot for Odin Casino", imageUrl: "https://cdn.mint.io/production/games/images/playson-viking-slot.jpg", launchUrl: "/launch/playson-viking-slot", rtp: 95.60, volatility: "medium", minBet: 1, maxBet: 300, active: true, isNew: true, isPopular: false, isExclusive: true, brands: ["Odin Casino"], tags: ["free-spins", "expanding-wilds"], createdAt: "2026-03-20", updatedAt: "2026-04-05" },
];

const providers = [...new Set(mockGames.map((g) => g.provider))].sort();
const categories = [...new Set(mockGames.map((g) => g.category))].sort();

const categoryLabels: Record<string, string> = {
  slots: "Slots",
  table: "Table",
  live: "Live Casino",
  jackpot: "Jackpot",
  megaways: "Megaways",
  instant: "Instant",
  "bonus-buy": "Bonus Buy",
  "game-shows": "Game Shows",
};

const PAGE_SIZE = 15;

export default function GamesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [games, setGames] = useState<Game[]>(mockGames);

  // Filtering
  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (providerFilter !== "all" && g.provider !== providerFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (statusFilter === "active" && !g.active) return false;
      if (statusFilter === "inactive" && g.active) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.provider.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [games, search, providerFilter, categoryFilter, statusFilter]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  // Stats
  const totalGames = games.length;
  const activeGames = games.filter((g) => g.active).length;
  const inactiveGames = games.filter((g) => !g.active).length;
  const providerCount = new Set(games.map((g) => g.provider)).size;

  // Bulk actions
  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((g) => g.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const bulkSetActive = (active: boolean) => {
    setGames((prev) =>
      prev.map((g) => (selected.has(g.id) ? { ...g, active } : g))
    );
    setSelected(new Set());
  };

  const toggleGameStatus = (id: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g))
    );
  };

  const deleteGame = (id: string) => {
    if (confirm("Are you sure you want to delete this game?")) {
      setGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => (
    sortKey === colKey ? (
      <span className="text-accent ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
    ) : null
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Game Management</h2>
        <Link href="/games/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Game
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-slate-500">Total Games</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalGames}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Active Games</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeGames}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Inactive Games</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{inactiveGames}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Providers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{providerCount}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="input w-64"
        />
        <select
          value={providerFilter}
          onChange={(e) => { setProviderFilter(e.target.value); setPage(0); }}
          className="input w-auto"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          className="input w-auto"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{categoryLabels[c] || c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "inactive"); setPage(0); }}
          className="input w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-500">{selected.size} selected</span>
            <button onClick={() => bulkSetActive(true)} className="btn-success text-xs px-3 py-1.5">
              Activate
            </button>
            <button onClick={() => bulkSetActive(false)} className="btn-secondary text-xs px-3 py-1.5">
              Deactivate
            </button>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Image</th>
                <th
                  className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center">Name<SortIcon colKey="name" /></span>
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => handleSort("provider")}
                >
                  <span className="flex items-center">Provider<SortIcon colKey="provider" /></span>
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => handleSort("category")}
                >
                  <span className="flex items-center">Category<SortIcon colKey="category" /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">RTP</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Min Bet</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Max Bet</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((game) => (
                <tr
                  key={game.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(game.id)}
                      onChange={() => toggleSelect(game.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-slate-900">{game.name}</span>
                      <div className="flex gap-1 mt-0.5">
                        {game.isNew && <span className="badge-blue text-[10px] px-1.5 py-0">New</span>}
                        {game.isPopular && <span className="badge-yellow text-[10px] px-1.5 py-0">Popular</span>}
                        {game.isExclusive && <span className="badge bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">Exclusive</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{game.provider}</td>
                  <td className="px-4 py-3 text-slate-700">{categoryLabels[game.category] || game.category}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{game.rtp.toFixed(2)}%</td>
                  <td className="px-4 py-3">
                    <span className={game.active ? "badge-green" : "badge-red"}>
                      {game.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{game.minBet} kr</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{game.maxBet.toLocaleString()} kr</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/games/${game.id}`)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleGameStatus(game.id)}
                        className={clsx(
                          "p-1.5 rounded-md transition-colors",
                          game.active
                            ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        )}
                        title={game.active ? "Deactivate" : "Activate"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {game.active ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteGame(game.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No games found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Page {page + 1} of {totalPages} ({sorted.length} games)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                First
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                className="px-2 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-sm rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
