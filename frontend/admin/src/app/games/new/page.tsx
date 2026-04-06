"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface GameForm {
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
}

const allProviders = [
  "Evolution", "Pragmatic Play", "NetEnt", "Play'n GO", "Hacksaw Gaming",
  "Nolimit City", "Microgaming", "Yggdrasil", "Red Tiger", "Big Time Gaming",
  "PG Soft", "Push Gaming", "ELK Studios", "Spribe", "Playson",
];

const allCategories = [
  { value: "slots", label: "Slots" },
  { value: "table", label: "Bord" },
  { value: "live", label: "Live Casino" },
  { value: "jackpot", label: "Jackpot" },
  { value: "megaways", label: "Megaways" },
  { value: "instant", label: "Instant" },
  { value: "bonus-buy", label: "Bonusköp" },
  { value: "game-shows", label: "Spelshower" },
];

const volatilityOptions = [
  { value: "low", label: "Låg" },
  { value: "medium", label: "Medium" },
  { value: "medium-high", label: "Medium-Hög" },
  { value: "high", label: "Hög" },
  { value: "extreme", label: "Extrem" },
];

const allBrands = ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"];

const availableCategories = [
  { id: "popular", name: "Populära", icon: "🔥" },
  { id: "new", name: "Nya spel", icon: "✨" },
  { id: "slots", name: "Slots", icon: "🎰" },
  { id: "table", name: "Bordsspel", icon: "🃏" },
  { id: "live", name: "Live Casino", icon: "📺" },
  { id: "jackpot", name: "Jackpottar", icon: "🏆" },
  { id: "megaways", name: "Megaways", icon: "⚡" },
  { id: "bonus-buy", name: "Bonusköp", icon: "💰" },
  { id: "game-shows", name: "Spelshower", icon: "⭐" },
  { id: "instant", name: "Snabbspel", icon: "🚀" },
  { id: "exclusive", name: "Exklusiva", icon: "💎" },
  { id: "classic", name: "Klassiker", icon: "👑" },
  { id: "weekly-top", name: "Veckans topplista", icon: "🔥" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm: GameForm = {
  name: "",
  slug: "",
  provider: "Pragmatic Play",
  category: "slots",
  categories: ["slots"],
  description: "",
  imageUrl: "",
  launchUrl: "",
  rtp: 96.00,
  volatility: "medium",
  minBet: 1,
  maxBet: 500,
  active: true,
  isNew: true,
  isPopular: false,
  isExclusive: false,
  brands: ["Odin Casino"],
  tags: "",
};

export default function NewGamePage() {
  const router = useRouter();
  const [form, setForm] = useState<GameForm>({ ...emptyForm });
  const [creating, setCreating] = useState(false);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: slugify(name) }));
  };

  const handleChange = (field: keyof GameForm, value: unknown) => {
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

  const handleCreate = () => {
    if (!form.name.trim()) {
      alert("Spelnamn krävs");
      return;
    }
    setCreating(true);
    // Simulate API call
    setTimeout(() => {
      router.push("/games");
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/games")} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tillbaka
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">Nytt spel</h2>
          <p className="text-sm text-slate-500">Fyll i uppgifterna nedan för att lägga till ett nytt spel</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/games")} className="btn-secondary">Avbryt</button>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Skapar...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Skapa spel
              </>
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
            <h3 className="font-semibold text-slate-900">Grundläggande information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Spelnamn *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input"
                  placeholder="T.ex. Sweet Bonanza"
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
                  placeholder="auto-genereras-fran-namn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leverantör</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Primär kategori</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="input"
                rows={3}
                placeholder="Beskriv spelet, dess funktioner och tema..."
              />
            </div>
          </div>

          {/* Categories (many-to-many) */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Kategorier</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ett spel kan tillhöra flera kategorier. Välj alla som passar.
                </p>
              </div>
              <span className="text-xs text-slate-400">{form.categories.length} valda</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Spelbild-URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className="input font-mono text-xs"
                placeholder="https://cdn.mint.io/production/games/images/game-name.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Spelstart-URL (iframe)</label>
              <input
                type="url"
                value={form.launchUrl}
                onChange={(e) => handleChange("launchUrl", e.target.value)}
                className="input font-mono text-xs"
                placeholder="https://provider.com/launch/game-id"
              />
            </div>
          </div>

          {/* Game settings */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900">Spelinställningar</h3>

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
                <label className="block text-sm font-medium text-slate-700 mb-1">Volatilitet</label>
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
                  {form.active ? "Aktiv" : "Inaktiv"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min insats (SEK)</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Max insats (SEK)</label>
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
            <h3 className="font-semibold text-slate-900">Flaggor och taggar</h3>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(e) => handleChange("isNew", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Nytt spel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => handleChange("isPopular", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Populärt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isExclusive}
                  onChange={(e) => handleChange("isExclusive", e.target.checked)}
                  className="rounded border-slate-300 text-accent focus:ring-accent"
                />
                <span className="text-sm text-slate-700">Exklusivt</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Varumärken</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Taggar (kommaseparerade)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                className="input"
                placeholder="megaways, bonus-buy, free-spins, jackpot"
              />
            </div>
          </div>
        </div>

        {/* Right: Image preview (1/3) */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Förhandsvisning</h3>
            <div className="aspect-square rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt={form.name || "Spelbild"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="text-center text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Ange en bild-URL för att se förhandsgranskning</p>
                </div>
              )}
            </div>
            {form.imageUrl && (
              <p className="mt-2 text-xs text-slate-400 break-all">{form.imageUrl}</p>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Sammanfattning</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Namn</span>
                <span className="font-medium text-slate-700">{form.name || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Leverantör</span>
                <span className="font-medium text-slate-700">{form.provider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Primär kat.</span>
                <span className="font-medium text-slate-700">
                  {allCategories.find((c) => c.value === form.category)?.label || form.category}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Kategorier</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.categories.length > 0 ? form.categories.map((catId) => {
                    const cat = availableCategories.find((c) => c.id === catId);
                    return (
                      <span key={catId} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {cat?.icon} {cat?.name || catId}
                      </span>
                    );
                  }) : (
                    <span className="text-xs text-slate-400">Inga kategorier</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">RTP</span>
                <span className="font-mono font-medium text-slate-700">{form.rtp.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={form.active ? "badge-green" : "badge-red"}>
                  {form.active ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Insats</span>
                <span className="font-mono text-slate-700">{form.minBet} - {form.maxBet.toLocaleString()} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Varumärken</span>
                <span className="font-medium text-slate-700">{form.brands.length} st</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Flaggor</h3>
            <div className="flex flex-wrap gap-2">
              {form.isNew && <span className="badge-blue">Nytt</span>}
              {form.isPopular && <span className="badge-yellow">Populärt</span>}
              {form.isExclusive && <span className="badge bg-purple-100 text-purple-700">Exklusivt</span>}
              {!form.isNew && !form.isPopular && !form.isExclusive && (
                <span className="text-sm text-slate-400">Inga flaggor satta</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
