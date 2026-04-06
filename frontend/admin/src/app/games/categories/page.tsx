"use client";

import { useState } from "react";
import clsx from "clsx";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  gameCount: number;
  createdAt: string;
  updatedAt: string;
}

const ICONS = [
  { value: "star", label: "⭐ Star" },
  { value: "fire", label: "🔥 Fire" },
  { value: "diamond", label: "💎 Diamond" },
  { value: "crown", label: "👑 Crown" },
  { value: "rocket", label: "🚀 Rocket" },
  { value: "dice", label: "🎲 Dice" },
  { value: "cards", label: "🃏 Cards" },
  { value: "slot", label: "🎰 Slot" },
  { value: "tv", label: "📺 TV" },
  { value: "lightning", label: "⚡ Lightning" },
  { value: "trophy", label: "🏆 Trophy" },
  { value: "gift", label: "🎁 Gift" },
  { value: "heart", label: "❤️ Heart" },
  { value: "sparkle", label: "✨ Sparkle" },
  { value: "money", label: "💰 Money" },
];

const iconMap: Record<string, string> = {
  star: "⭐", fire: "🔥", diamond: "💎", crown: "👑", rocket: "🚀",
  dice: "🎲", cards: "🃏", slot: "🎰", tv: "📺", lightning: "⚡",
  trophy: "🏆", gift: "🎁", heart: "❤️", sparkle: "✨", money: "💰",
};

const initialCategories: Category[] = [
  { id: "cat-1", name: "Popular", slug: "popular", description: "The most played games right now", icon: "fire", sortOrder: 1, active: true, gameCount: 24, createdAt: "2025-06-01", updatedAt: "2026-04-01" },
  { id: "cat-2", name: "New Games", slug: "new", description: "Recently added games", icon: "sparkle", sortOrder: 2, active: true, gameCount: 12, createdAt: "2025-06-01", updatedAt: "2026-04-01" },
  { id: "cat-3", name: "Slots", slug: "slots", description: "All video and classic slots", icon: "slot", sortOrder: 3, active: true, gameCount: 156, createdAt: "2025-06-01", updatedAt: "2026-03-20" },
  { id: "cat-4", name: "Table Games", slug: "table", description: "Roulette, blackjack, baccarat and more", icon: "cards", sortOrder: 4, active: true, gameCount: 28, createdAt: "2025-06-01", updatedAt: "2026-03-15" },
  { id: "cat-5", name: "Live Casino", slug: "live", description: "Play with real dealers in real time", icon: "tv", sortOrder: 5, active: true, gameCount: 42, createdAt: "2025-06-01", updatedAt: "2026-03-18" },
  { id: "cat-6", name: "Jackpots", slug: "jackpot", description: "Progressive and fixed jackpot games", icon: "trophy", sortOrder: 6, active: true, gameCount: 8, createdAt: "2025-06-01", updatedAt: "2026-02-10" },
  { id: "cat-7", name: "Megaways", slug: "megaways", description: "Games with the Megaways mechanic", icon: "lightning", sortOrder: 7, active: true, gameCount: 18, createdAt: "2025-07-01", updatedAt: "2026-03-22" },
  { id: "cat-8", name: "Bonus Buy", slug: "bonus-buy", description: "Games where you can buy the bonus round directly", icon: "money", sortOrder: 8, active: true, gameCount: 34, createdAt: "2025-07-15", updatedAt: "2026-03-28" },
  { id: "cat-9", name: "Game Shows", slug: "game-shows", description: "Live game shows like Crazy Time, Monopoly", icon: "star", sortOrder: 9, active: true, gameCount: 6, createdAt: "2025-08-01", updatedAt: "2026-03-10" },
  { id: "cat-10", name: "Instant Games", slug: "instant", description: "Crash, Plinko, Mines and other instant games", icon: "rocket", sortOrder: 10, active: true, gameCount: 10, createdAt: "2025-09-01", updatedAt: "2026-03-05" },
  { id: "cat-11", name: "Exclusive", slug: "exclusive", description: "Games only available on SwedBet", icon: "diamond", sortOrder: 11, active: true, gameCount: 5, createdAt: "2025-10-01", updatedAt: "2026-04-01" },
  { id: "cat-12", name: "Classics", slug: "classic", description: "Timeless favorite games", icon: "crown", sortOrder: 12, active: true, gameCount: 20, createdAt: "2025-06-01", updatedAt: "2026-01-15" },
  { id: "cat-13", name: "Weekly Top List", slug: "weekly-top", description: "This week's most played and winning games", icon: "fire", sortOrder: 13, active: true, gameCount: 10, createdAt: "2026-01-01", updatedAt: "2026-04-06" },
  { id: "cat-14", name: "High Roller", slug: "high-roller", description: "Games for players with higher stakes", icon: "money", sortOrder: 14, active: false, gameCount: 0, createdAt: "2026-02-01", updatedAt: "2026-02-01" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state for create/edit
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("star");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("star");
    setFormSortOrder(categories.length + 1);
    setFormActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormSortOrder(categories.length + 1);
    setEditingId(null);
    setShowCreateModal(true);
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description);
    setFormIcon(cat.icon);
    setFormSortOrder(cat.sortOrder);
    setFormActive(cat.active);
    setEditingId(cat.id);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString().split("T")[0];
    if (editingId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: formName, slug: formSlug || slugify(formName), description: formDescription, icon: formIcon, sortOrder: formSortOrder, active: formActive, updatedAt: now }
            : c
        )
      );
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: formName,
        slug: formSlug || slugify(formName),
        description: formDescription,
        icon: formIcon,
        sortOrder: formSortOrder,
        active: formActive,
        gameCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setCategories((prev) => [...prev, newCat]);
    }
    setShowCreateModal(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  };

  const toggleActive = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const moveCategory = (id: string, direction: "up" | "down") => {
    setCategories((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((c) => c.id === id);
      if (direction === "up" && idx > 0) {
        const temp = sorted[idx].sortOrder;
        sorted[idx].sortOrder = sorted[idx - 1].sortOrder;
        sorted[idx - 1].sortOrder = temp;
      } else if (direction === "down" && idx < sorted.length - 1) {
        const temp = sorted[idx].sortOrder;
        sorted[idx].sortOrder = sorted[idx + 1].sortOrder;
        sorted[idx + 1].sortOrder = temp;
      }
      return sorted;
    });
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = categories.filter((c) => c.active).length;
  const totalGames = categories.reduce((sum, c) => sum + c.gameCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Casino Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage categories that games can be assigned to. A game can belong to multiple categories.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Categories</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-red-500">{categories.length - activeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Inactive</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{totalGames}</p>
          <p className="text-xs text-slate-500 mt-1">Game Assignments</p>
        </div>
      </div>

      {/* Category Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600 w-12">Order</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 w-10">Icon</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Games</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((cat, idx) => (
              <tr
                key={cat.id}
                className={clsx(
                  "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                  !cat.active && "opacity-60"
                )}
              >
                {/* Sort order with arrows */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-xs w-4">{cat.sortOrder}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveCategory(cat.id, "up")}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        onClick={() => moveCategory(cat.id, "down")}
                        disabled={idx === sortedCategories.length - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>
                </td>

                {/* Icon */}
                <td className="px-4 py-3">
                  <span className="text-lg">{iconMap[cat.icon] || "📁"}</span>
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>

                {/* Slug */}
                <td className="px-4 py-3">
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{cat.slug}</code>
                </td>

                {/* Description */}
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{cat.description}</td>

                {/* Game count */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {cat.gameCount}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(cat.id)}>
                    <span className={cat.active ? "badge-green" : "badge-red"}>
                      {cat.active ? "Active" : "Inactive"}
                    </span>
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="p-1.5 rounded-md hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
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
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingId ? "Edit Category" : "Create New Category"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingId) setFormSlug(slugify(e.target.value));
                    }}
                    className="input"
                    placeholder="E.g. Popular"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="input font-mono text-slate-500"
                    placeholder="popular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Short description of the category..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="input"
                  >
                    {ICONS.map((i) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                    className="input"
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Active (visible on site)</span>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{iconMap[formIcon] || "📁"}</span>
                  <span className="font-medium text-slate-900">{formName || "Category name"}</span>
                  <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 ml-auto">
                    {formSlug || "slug"}
                  </code>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingId(null); }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Category</h3>
            <p className="text-sm text-slate-600 mb-1">
              Are you sure you want to delete <strong>{categories.find((c) => c.id === deleteConfirm)?.name}</strong>?
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Games in this category will not be deleted, but will lose their category assignment.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
