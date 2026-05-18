"use client";

import { useCallback, useEffect, useState } from "react";
import { inputCls } from "@/features/admin/components/modal";
import { applyTenantTheme } from "@/features/admin/helpers";
import {
  BuildingStorefrontIcon,
  CogIcon,
  UsersIcon,
  UserCircleIcon,
} from "@/features/admin/components/icons";

type ConfigData = {
  restaurantId: string;
  restaurant: { name: string; address: string; phone: string };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    logoUrl: string | null;
  };
  settings: {
    currency: string;
    timezone: string;
    taxRate: number;
    tipSuggestion: number;
  };
  branches: { id: string; name: string; city: string }[];
};

const ITEMS_PER_PAGE = 5;
const CURRENCIES = ["COP", "USD", "EUR"];
const TIMEZONES = [
  "America/Bogota",
  "America/New_York",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "Europe/Madrid",
];

async function putConfig(section: string, data: unknown) {
  const r = await fetch("/api/admin/configuracion", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [section]: data }),
  });
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).error ?? "Error");
}

type OrgUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  globalRole: string;
};
const EMPTY_USER_FORM = { name: "", email: "", password: "", role: "staff" };

type ConfigTab = "perfil" | "branding" | "preferencias" | "usuarios";
const CONFIG_TABS: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "perfil",
    label: "Perfil",
    icon: <BuildingStorefrontIcon className="h-4 w-4" />,
  },
  { id: "branding", label: "Branding", icon: <CogIcon className="h-4 w-4" /> },
  {
    id: "preferencias",
    label: "Preferencias",
    icon: <CogIcon className="h-4 w-4" />,
  },
  {
    id: "usuarios",
    label: "Usuarios",
    icon: <UsersIcon className="h-4 w-4" />,
  },
];

/* ─── Section header ────────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
          color: "var(--admin-primary,#581c22)",
        }}
      >
        {icon}
      </span>
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
        {title}
      </h2>
    </div>
  );
}

/* ─── Save button ───────────────────────────────────────────── */

function SaveBtn({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {saving ? "Guardando…" : label}
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [configTab, setConfigTab] = useState<ConfigTab>("perfil");
  const [branches, setBranches] = useState<
    { id: string; name: string; city: string }[]
  >([]);

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [branchPage, setBranchPage] = useState(0);

  const [restaurant, setRestaurant] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [branding, setBranding] = useState({
    primaryColor: "#581c22",
    secondaryColor: "#7b4b52",
    accentColor: "#d97706",
    backgroundColor: "#ffe5e5",
  });
  const [settings, setSettings] = useState({
    currency: "COP",
    timezone: "America/Bogota",
    taxRate: 19,
    tipSuggestion: 10,
  });

  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const reloadUsers = useCallback(() => {
    fetch("/api/admin/usuarios")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: { users: OrgUser[] }) => setUsers(d.users))
      .catch(console.error);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/configuracion")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: ConfigData) => {
        setRestaurant(d.restaurant);
        setBranding({
          primaryColor: d.branding.primaryColor,
          secondaryColor: d.branding.secondaryColor,
          accentColor: d.branding.accentColor,
          backgroundColor: d.branding.backgroundColor,
        });
        setSettings({
          currency: d.settings.currency,
          timezone: d.settings.timezone,
          taxRate: d.settings.taxRate,
          tipSuggestion: d.settings.tipSuggestion,
        });
        setBranches(d.branches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    reloadUsers();
  }, [reload, reloadUsers]);

  async function saveRestaurant(e: React.FormEvent) {
    e.preventDefault();
    setSavingRestaurant(true);
    try {
      await putConfig("restaurant", restaurant);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingRestaurant(false);
    }
  }

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    try {
      await putConfig("branding", branding);
      applyTenantTheme({
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        accent: branding.accentColor,
        background: branding.backgroundColor,
        defaultMode: "light",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingBranding(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await putConfig("settings", settings);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm">
        {CONFIG_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setConfigTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              configTab === t.id
                ? "bg-[var(--admin-primary,#581c22)] text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Perfil */}
      {configTab === "perfil" && (
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <SectionHeader
            icon={<BuildingStorefrontIcon />}
            title="Perfil del restaurante"
          />
          <form onSubmit={saveRestaurant} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Nombre *
                </label>
                <input
                  className={inputCls}
                  required
                  value={restaurant.name}
                  onChange={(e) =>
                    setRestaurant({ ...restaurant, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Teléfono
                </label>
                <input
                  className={inputCls}
                  value={restaurant.phone}
                  onChange={(e) =>
                    setRestaurant({ ...restaurant, phone: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Dirección
                </label>
                <input
                  className={inputCls}
                  value={restaurant.address}
                  onChange={(e) =>
                    setRestaurant({ ...restaurant, address: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <SaveBtn saving={savingRestaurant} label="Guardar perfil" />
            </div>
          </form>
        </section>
      )}

      {/* Tab: Branding */}
      {configTab === "branding" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <SectionHeader icon={<CogIcon />} title="Branding / Apariencia" />
            <form onSubmit={saveBranding} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "primaryColor", label: "Color primario" },
                    { key: "secondaryColor", label: "Color secundario" },
                    { key: "accentColor", label: "Color de acento" },
                    { key: "backgroundColor", label: "Color de fondo" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      {label}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={branding[key]}
                        onChange={(e) =>
                          setBranding({ ...branding, [key]: e.target.value })
                        }
                        className="h-[38px] w-10 cursor-pointer rounded-lg border border-stone-200"
                      />
                      <input
                        className={inputCls}
                        value={branding[key]}
                        onChange={(e) =>
                          setBranding({ ...branding, [key]: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <SaveBtn saving={savingBranding} label="Guardar apariencia" />
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <SectionHeader icon={<CogIcon />} title="Vista previa" />
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { key: "primaryColor", label: "Primario" },
                  { key: "secondaryColor", label: "Secundario" },
                  { key: "accentColor", label: "Acento" },
                  { key: "backgroundColor", label: "Fondo" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="text-center">
                  <span
                    className="mb-1 block h-10 rounded-xl border border-stone-200"
                    style={{ background: branding[key] }}
                  />
                  <span className="text-xs text-stone-500">{label}</span>
                </div>
              ))}
            </div>
            <div
              className="mt-4 flex items-center gap-3 rounded-2xl p-4"
              style={{ background: branding.backgroundColor }}
            >
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: branding.primaryColor }}
              >
                Botón primario
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: branding.accentColor }}
              >
                Acento
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Tab: Preferencias + Sedes */}
      {configTab === "preferencias" && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <SectionHeader icon={<CogIcon />} title="Preferencias operativas" />
            <form onSubmit={saveSettings} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Moneda
                  </label>
                  <select
                    className={inputCls}
                    value={settings.currency}
                    onChange={(e) =>
                      setSettings({ ...settings, currency: e.target.value })
                    }
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Zona horaria
                  </label>
                  <select
                    className={inputCls}
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    IVA (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    className={inputCls}
                    value={settings.taxRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Propina sugerida (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className={inputCls}
                    value={settings.tipSuggestion}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        tipSuggestion: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <SaveBtn saving={savingSettings} label="Guardar preferencias" />
              </div>
            </form>
          </section>

          {branches.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
              <SectionHeader icon={<BuildingStorefrontIcon />} title="Sedes" />
              <div className="space-y-2">
                {branches
                  .slice(
                    branchPage * ITEMS_PER_PAGE,
                    (branchPage + 1) * ITEMS_PER_PAGE,
                  )
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
                          color: "var(--admin-primary,#581c22)",
                        }}
                      >
                        <BuildingStorefrontIcon />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">
                          {b.name}
                        </p>
                        {b.city && (
                          <p className="text-xs text-stone-400">{b.city}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              {branches.length > ITEMS_PER_PAGE && (
                <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                  <button
                    onClick={() => setBranchPage((p) => Math.max(0, p - 1))}
                    disabled={branchPage === 0}
                    className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
                  >
                    ← Anterior
                  </button>
                  <span>
                    {branchPage + 1} /{" "}
                    {Math.ceil(branches.length / ITEMS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() =>
                      setBranchPage((p) =>
                        Math.min(
                          Math.ceil(branches.length / ITEMS_PER_PAGE) - 1,
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      branchPage >=
                      Math.ceil(branches.length / ITEMS_PER_PAGE) - 1
                    }
                    className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Tab: Usuarios */}
      {configTab === "usuarios" && (
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between">
            <SectionHeader icon={<UsersIcon />} title="Usuarios y permisos" />
            <button
              onClick={() => {
                setShowUserForm((v) => !v);
                setUserForm(EMPTY_USER_FORM);
              }}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {showUserForm ? "Cancelar" : "+ Agregar usuario"}
            </button>
          </div>

          {showUserForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingUser(true);
                try {
                  const r = await fetch("/api/admin/usuarios", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userForm),
                  });
                  if (!r.ok) throw new Error((await r.json()).error ?? "Error");
                  setShowUserForm(false);
                  setUserForm(EMPTY_USER_FORM);
                  reloadUsers();
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Error");
                } finally {
                  setSavingUser(false);
                }
              }}
              className="mb-4 grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Nombre *
                </label>
                <input
                  className={inputCls}
                  required
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Email *
                </label>
                <input
                  type="email"
                  className={inputCls}
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Contraseña *
                </label>
                <input
                  type="password"
                  className={inputCls}
                  required
                  minLength={8}
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  Rol *
                </label>
                <select
                  className={inputCls}
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end sm:col-span-2">
                <SaveBtn saving={savingUser} label="Crear usuario" />
              </div>
            </form>
          )}

          <div className="space-y-2">
            {users
              .slice(userPage * ITEMS_PER_PAGE, (userPage + 1) * ITEMS_PER_PAGE)
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
                      color: "var(--admin-primary,#581c22)",
                    }}
                  >
                    {u.name
                      .split(" ")
                      .map((w) => w[0] ?? "")
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800">
                      {u.name}
                    </p>
                    <p className="truncate text-xs text-stone-400">
                      {u.email} · <span className="capitalize">{u.role}</span>
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Quitar a "${u.name}" del restaurante?`))
                        return;
                      await fetch("/api/admin/usuarios", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: u.id }),
                      });
                      reloadUsers();
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            {users.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <UserCircleIcon className="h-10 w-10 text-stone-200" />
                <p className="text-sm text-stone-400">
                  Sin usuarios vinculados
                </p>
              </div>
            )}
          </div>

          {users.length > ITEMS_PER_PAGE && (
            <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
              <button
                onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                disabled={userPage === 0}
                className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span>
                {userPage + 1} / {Math.ceil(users.length / ITEMS_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setUserPage((p) =>
                    Math.min(
                      Math.ceil(users.length / ITEMS_PER_PAGE) - 1,
                      p + 1,
                    ),
                  )
                }
                disabled={
                  userPage >= Math.ceil(users.length / ITEMS_PER_PAGE) - 1
                }
                className="rounded-lg px-3 py-1 hover:bg-stone-100 disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
