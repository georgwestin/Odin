"use client";

import { useState } from "react";
import clsx from "clsx";

type SettingsTab = "brands" | "admins" | "system";

interface Brand {
  id: string;
  name: string;
  domain: string;
  theme: string;
  status: string;
  playersCount: number;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: string;
}

const brands: Brand[] = [
  { id: "b1", name: "Odin Casino", domain: "odincasino.com", theme: "Dark Blue", status: "active", playersCount: 12400 },
  { id: "b2", name: "Valhalla Bet", domain: "valhalabet.com", theme: "Green", status: "active", playersCount: 8200 },
  { id: "b3", name: "Thor Gaming", domain: "thorgaming.com", theme: "Red", status: "active", playersCount: 5100 },
  { id: "b4", name: "Freya Slots", domain: "freyaslots.com", theme: "Purple", status: "active", playersCount: 9800 },
];

const adminUsers: AdminUserRow[] = [
  { id: "a1", name: "Sarah Johnson", email: "sarah@odin.gg", role: "superadmin", lastLogin: "2026-04-06 15:00", status: "active" },
  { id: "a2", name: "Marcus Chen", email: "marcus@odin.gg", role: "admin", lastLogin: "2026-04-06 14:30", status: "active" },
  { id: "a3", name: "Lisa Eriksson", email: "lisa@odin.gg", role: "support", lastLogin: "2026-04-06 12:00", status: "active" },
  { id: "a4", name: "James Wright", email: "james@odin.gg", role: "viewer", lastLogin: "2026-04-05 10:00", status: "active" },
  { id: "a5", name: "Anna Kowalski", email: "anna@odin.gg", role: "admin", lastLogin: "2026-04-03 09:00", status: "inactive" },
];

const systemConfig = [
  { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle" as const, value: false },
  { key: "registration_enabled", label: "Player Registration Enabled", type: "toggle" as const, value: true },
  { key: "max_deposit_limit", label: "Global Max Deposit Limit", type: "number" as const, value: "50000" },
  { key: "default_currency", label: "Default Currency", type: "select" as const, value: "EUR", options: ["EUR", "USD", "GBP", "SEK", "NOK"] },
  { key: "kyc_auto_approve", label: "KYC Auto-Approve (Onfido)", type: "toggle" as const, value: true },
  { key: "session_timeout", label: "Admin Session Timeout (min)", type: "number" as const, value: "60" },
  { key: "aml_threshold", label: "AML Alert Threshold", type: "number" as const, value: "10000" },
  { key: "responsible_gambling_cooling_off_default", label: "Default Cooling-Off (days)", type: "number" as const, value: "7" },
];

const roleBadge: Record<string, string> = {
  superadmin: "badge-red",
  admin: "badge-blue",
  support: "badge-yellow",
  viewer: "badge-gray",
};

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("brands");
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [config, setConfig] = useState(systemConfig);

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: "brands", label: "Brand Management" },
    { key: "admins", label: "Admin Users" },
    { key: "system", label: "System Configuration" },
  ];

  const toggleConfig = (key: string) => {
    setConfig((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value: !c.value } : c))
    );
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c))
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>

      <div className="border-b border-slate-200">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === t.key
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "brands" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBrandModal(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Brand
            </button>
          </div>
          <div className="grid gap-4">
            {brands.map((brand) => (
              <div key={brand.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center text-accent font-bold text-lg">
                    {brand.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{brand.name}</h3>
                    <p className="text-sm text-slate-500">{brand.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Players</p>
                    <p className="font-semibold">{brand.playersCount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Theme</p>
                    <p className="font-medium text-sm">{brand.theme}</p>
                  </div>
                  <span className="badge-green">{brand.status}</span>
                  <button className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "admins" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAdminModal(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Admin User
            </button>
          </div>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Login</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3"><span className={roleBadge[user.role]}>{user.role}</span></td>
                    <td className="px-4 py-3 text-slate-500">{user.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className={user.status === "active" ? "badge-green" : "badge-gray"}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-accent hover:text-accent-hover text-sm font-medium">Edit</button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "system" && (
        <div className="card space-y-0 divide-y divide-slate-100">
          {config.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.key}</p>
              </div>
              {item.type === "toggle" ? (
                <button
                  onClick={() => toggleConfig(item.key)}
                  className={clsx(
                    "relative w-11 h-6 rounded-full transition-colors",
                    item.value ? "bg-accent" : "bg-slate-300"
                  )}
                >
                  <div
                    className={clsx(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      item.value ? "translate-x-5.5 left-[1px]" : "left-0.5"
                    )}
                    style={{ transform: item.value ? "translateX(22px)" : "translateX(0)" }}
                  />
                </button>
              ) : item.type === "select" ? (
                <select
                  className="input w-auto"
                  value={item.value as string}
                  onChange={(e) => updateConfig(item.key, e.target.value)}
                >
                  {item.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  className="input w-32 text-right"
                  value={item.value as string}
                  onChange={(e) => updateConfig(item.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="pt-4">
            <button className="btn-primary">Save Configuration</button>
          </div>
        </div>
      )}

      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Brand</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
                <input type="text" className="input" placeholder="e.g. Ragnarok Casino" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
                <input type="text" className="input" placeholder="e.g. ragnarokcasino.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Theme</label>
                <select className="input">
                  <option>Dark Blue</option>
                  <option>Green</option>
                  <option>Red</option>
                  <option>Purple</option>
                  <option>Gold</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBrandModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowBrandModal(false)} className="btn-primary">Create Brand</button>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Admin User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input" placeholder="john@odin.gg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select className="input">
                  <option value="viewer">Viewer</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input type="password" className="input" placeholder="Min 12 characters" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdminModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowAdminModal(false)} className="btn-primary">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
