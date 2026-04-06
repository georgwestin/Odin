"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";

interface GameData {
  id: string;
  name: string;
  slug: string;
  provider: string;
  category: string;
  categories: string[];
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
  tags: string;
  createdAt: string;
  updatedAt: string;
}

const allProviders = [
  "Evolution", "Pragmatic Play", "NetEnt", "Play'n GO", "Hacksaw Gaming",
  "Nolimit City", "Microgaming", "Yggdrasil", "Red Tiger", "Big Time Gaming",
  "PG Soft", "Push Gaming", "ELK Studios", "Spribe", "Playson",
];

const allCategories = [
  { value: "slots", label: "Slots" },
  { value: "table", label: "Table" },
  { value: "live", label: "Live Casino" },
  { value: "jackpot", label: "Jackpot" },
  { value: "megaways", label: "Megaways" },
  { value: "instant", label: "Instant" },
  { value: "bonus-buy", label: "Bonus Buy" },
  { value: "game-shows", label: "Game Shows" },
];

const volatilityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "medium-high", label: "Medium-High" },
  { value: "high", label: "High" },
  { value: "extreme", label: "Extreme" },
];

const allBrands = ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"];

const availableCategories = [
  { id: "popular", name: "Popular", icon: "🔥" },
  { id: "new", name: "New Games", icon: "✨" },
  { id: "slots", name: "Slots", icon: "🎰" },
  { id: "table", name: "Table Games", icon: "🃏" },
  { id: "live", name: "Live Casino", icon: "📺" },
  { id: "jackpot", name: "Jackpots", icon: "🏆" },
  { id: "megaways", name: "Megaways", icon: "⚡" },
  { id: "bonus-buy", name: "Bonus Buy", icon: "💰" },
  { id: "game-shows", name: "Game Shows", icon: "⭐" },
  { id: "instant", name: "Instant Games", icon: "🚀" },
  { id: "exclusive", name: "Exclusive", icon: "💎" },
  { id: "classic", name: "Classics", icon: "👑" },
  { id: "weekly-top", name: "Weekly Top List", icon: "🔥" },
];

// Mock game data for edit mode
const mockGames: Record<string, GameData> = {
  g1: { id: "g1", name: "Sweet Bonanza", slug: "sweet-bonanza", provider: "Pragmatic Play", category: "slots", categories: ["slots", "popular", "bonus-buy", "weekly-top"], description: "Popular candy slot with tumble feature and multipliers. Up to 21,175x win.", imageUrl: "https://cdn.mint.io/production/games/images/sweet-bonanza.jpg", launchUrl: "https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20fruitsw", rtp: 96.48, volatility: "medium-high", minBet: 1, maxBet: 1250, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots"], tags: "tumble, free-spins, multiplier", createdAt: "2025-06-01 10:00", updatedAt: "2026-03-15 14:30" },
  g2: { id: "g2", name: "Gates of Olympus", slug: "gates-of-olympus", provider: "Pragmatic Play", category: "slots", categories: ["slots", "popular", "bonus-buy", "classic"], description: "Zeus theme with multipliers that accumulate during free spins. Max win 5,000x.", imageUrl: "https://cdn.mint.io/production/games/images/gates-of-olympus.jpg", launchUrl: "https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=vs20olympgate", rtp: 96.50, volatility: "high", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming"], tags: "tumble, multiplier, bonus-buy", createdAt: "2025-06-01 10:00", updatedAt: "2026-03-20 09:15" },
  g3: { id: "g3", name: "Book of Dead", slug: "book-of-dead", provider: "Play'n GO", category: "slots", categories: ["slots", "popular", "classic"], description: "Classic Egyptian adventure slot with expanding symbols during free spins.", imageUrl: "https://cdn.mint.io/production/games/images/book-of-dead.jpg", launchUrl: "https://asccw.playngonetwork.com/casino/ContainerLauncher?pid=2&gid=bookofdeaddesktop", rtp: 96.21, volatility: "high", minBet: 1, maxBet: 500, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: "free-spins, expanding-symbols", createdAt: "2025-05-15 08:00", updatedAt: "2026-02-10 11:45" },
  g13: { id: "g13", name: "Crazy Time", slug: "crazy-time", provider: "Evolution", category: "game-shows", categories: ["game-shows", "live", "popular"], description: "Live game show with four bonus rounds: Coin Flip, Cash Hunt, Pachinko and Crazy Time.", imageUrl: "https://cdn.mint.io/production/games/images/crazy-time.jpg", launchUrl: "https://games.evolution.com/entry?game=crazytime", rtp: 95.50, volatility: "high", minBet: 5, maxBet: 5000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet"], tags: "live, game-show, multiplier", createdAt: "2025-06-01 10:00", updatedAt: "2026-03-10 16:20" },
  g14: { id: "g14", name: "Lightning Roulette", slug: "lightning-roulette", provider: "Evolution", category: "live", categories: ["live", "popular", "table"], description: "Live roulette with random multipliers up to 500x on straight-up bets.", imageUrl: "https://cdn.mint.io/production/games/images/lightning-roulette.jpg", launchUrl: "https://games.evolution.com/entry?game=lightningroulette", rtp: 97.30, volatility: "medium", minBet: 5, maxBet: 10000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Valhalla Bet", "Thor Gaming"], tags: "live, roulette, multiplier", createdAt: "2025-05-01 10:00", updatedAt: "2026-02-28 13:10" },
  g23: { id: "g23", name: "Aviator", slug: "aviator", provider: "Spribe", category: "instant", categories: ["instant", "popular", "new"], description: "Crash game with social aspect. Cash out before the plane flies away.", imageUrl: "https://cdn.mint.io/production/games/images/aviator.jpg", launchUrl: "https://spribe.co/games/aviator", rtp: 97.00, volatility: "medium", minBet: 1, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"], tags: "instant, crash, social", createdAt: "2025-06-10 10:00", updatedAt: "2026-03-18 15:00" },
};

// Generate default for unknown IDs
const defaultGame: GameData = {
  id: "g5", name: "Wanted Dead or a Wild", slug: "wanted-dead-or-a-wild", provider: "Hacksaw Gaming", category: "slots", categories: ["slots", "popular", "bonus-buy"], description: "Wild West theme with duel feature and extreme multipliers. Max win 12,500x.", imageUrl: "https://cdn.mint.io/production/games/images/wanted-dead-or-a-wild.jpg", launchUrl: "https://static-live.hacksawgaming.com/load/?game=wanted-dead-or-a-wild", rtp: 96.38, volatility: "extreme", minBet: 2, maxBet: 1000, active: true, isNew: false, isPopular: true, isExclusive: false, brands: ["Odin Casino", "Thor Gaming"], tags: "bonus-buy, multiplier, duel", createdAt: "2025-07-10 10:00", updatedAt: "2026-03-25 12:00",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function GameEditPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const source = mockGames[gameId] || defaultGame;

  const [form, setForm] = useState<GameData>({ ...source, id: gameId });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleChange = (field: keyof GameData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (catId: string) => {
    setForm((prev) => {
      const categories = prev.categories.includes(catId)
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories };
    });
  };

  const handleBrandToggle = (brand: string) => {
    setForm((prev) => {
      const brands = prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand];
      return { ...prev, brands };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    router.push("/games");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/games")} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">Edit Game</h2>
          <p className="text-sm text-slate-500">{form.name} &middot; {form.provider}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/games")} className="btn-secondary">Cancel</button>
          <button onClick={() => setShowDeleteModal(true)} className="btn-danger">Delete</button>
          <button onClick={handleSave} className="btn-primary">
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Form (2/3) */}
        <div className="col-span-2 space-y-6">
          {/* Basic info */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Game Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug / ID</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="input font-mono text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => handleChange("provider", e.target.value)}
                  className="input"
                >
                  {allProviders.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="input"
                >
                  {allCategories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="input"
                rows={3}
                placeholder="Describe the game, its features and theme..."
              />
            </div>
          </div>

          {/* Categories (many-to-many) */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Categories</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A game can belong to multiple categories. Select all that apply.
                </p>
              </div>
              <span className="text-xs text-slate-400">{form.categories.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    form.categories.includes(cat.id)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  {form.categories.includes(cat.id) && (
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* URLs */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900">URLs</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Game Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className="input font-mono text-xs"
                placeholder="https://cdn.mint.io/production/games/images/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Game Launch URL (iframe)</label>
              <input
                type="url"
                value={form.launchUrl}
                onChange={(e) => handleChange("launchUrl", e.target.value)}
                className="input font-mono text-xs"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Game settings */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900">Game Settings</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RTP %</label>
                <input
                  type="number"
                  value={form.rtp}
                  onChange={(e) => handleChange("rtp", parseFloat(e.target.value) || 0)}
                  className="input"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="96.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Volatility</label>
                <select
                  value={form.volatility}
                  onChange={(e) => handleChange("volatility", e.target.value)}
                  className="input"
                >
                  {volatilityOptions.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <button
                  onClick={() => handleChange("active", !form.active)}
                  className={clsx(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    form.active
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-red-50 border-red-300 text-red-700"
                  )}
                >
                  {form.active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Bet (SEK)</label>
                <input
                  type="number"
                  value={form.minBet}
                  onChange={(e) => handleChange("minBet", parseFloat(e.target.value) || 0)}
                  className="input"
                  min="0"
                  step="0.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Bet (SEK)</label>
                <input
                  type="number"
                  value={form.maxBet}
                  onChange={(e) => handleChange("maxBet", parseFloat(e.target.value) || 0)}
                  className="input"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Flags and tags */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900">Flags & Tags</h3>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => handleChange("isNew", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">New Game</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => handleChange("isPopular", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isExclusive}
                  onChange={(e) => handleChange("isExclusive", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Exclusive</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brands</label>
              <div className="flex flex-wrap gap-2">
                {allBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => handleBrandToggle(brand)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      form.brands.includes(brand)
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                className="input"
                placeholder="megaways, bonus-buy, free-spins, jackpot"
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-700">{form.createdAt}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-medium text-slate-700">{form.updatedAt}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Game ID</span>
                <span className="font-mono text-slate-700">{form.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Slug</span>
                <span className="font-mono text-slate-700">{form.slug}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Image preview (1/3) */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Preview</h3>
            <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
              <img
                src={form.imageUrl}
                alt={form.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 break-all">{form.imageUrl}</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={form.active ? "badge-green" : "badge-red"}>
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Provider</span>
                <span className="font-medium text-slate-700">{form.provider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Primary Cat.</span>
                <span className="font-medium text-slate-700">
                  {allCategories.find((c) => c.value === form.category)?.label || form.category}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Categories</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.categories.length > 0 ? form.categories.map((catId) => {
                    const cat = availableCategories.find((c) => c.id === catId);
                    return (
                      <span key={catId} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {cat?.icon} {cat?.name || catId}
                      </span>
                    );
                  }) : (
                    <span className="text-xs text-slate-400">No categories</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">RTP</span>
                <span className="font-mono font-medium text-slate-700">{form.rtp.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Volatility</span>
                <span className="font-medium text-slate-700">
                  {volatilityOptions.find((v) => v.value === form.volatility)?.label || form.volatility}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Bet</span>
                <span className="font-mono text-slate-700">{form.minBet} - {form.maxBet.toLocaleString()} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Brands</span>
                <span className="font-medium text-slate-700">{form.brands.length}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Flags</h3>
            <div className="flex flex-wrap gap-2">
              {form.isNew && <span className="badge-blue">New</span>}
              {form.isPopular && <span className="badge-yellow">Popular</span>}
              {form.isExclusive && <span className="badge bg-purple-100 text-purple-700">Exclusive</span>}
              {!form.isNew && !form.isPopular && !form.isExclusive && (
                <span className="text-sm text-slate-400">No flags set</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Game</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <strong>{form.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete Game</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
