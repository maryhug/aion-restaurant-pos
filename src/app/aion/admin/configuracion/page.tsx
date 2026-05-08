"use client";

import { useCallback, useEffect, useState } from "react";
import { inputCls } from "@/features/admin/components/modal";
import { applyTenantTheme } from "@/features/admin/helpers";

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

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<
    { id: string; name: string; city: string }[]
  >([]);

  // User management
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

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
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando configuración…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Perfil del restaurante */}
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="mb-3 font-bold">Perfil del restaurante</h3>
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingRestaurant}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingRestaurant ? "Guardando…" : "Guardar perfil"}
            </button>
          </div>
        </form>
      </article>

      {/* Branding */}
      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="mb-3 font-bold">Branding / Apariencia</h3>
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
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingBranding}
                className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingBranding ? "Guardando…" : "Guardar apariencia"}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="mb-3 font-bold">Vista previa</h3>
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
                  className="mb-1 block h-10 rounded-lg border border-stone-200"
                  style={{ background: branding[key] }}
                />
                <span className="text-xs text-stone-500">{label}</span>
              </div>
            ))}
          </div>
          <div
            className="mt-4 flex items-center gap-3 rounded-xl p-4"
            style={{ background: branding.backgroundColor }}
          >
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: branding.primaryColor }}
            >
              Botón primario
            </button>
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: branding.accentColor }}
            >
              Acento
            </button>
          </div>
        </article>
      </div>

      {/* Preferencias operativas */}
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="mb-3 font-bold">Preferencias operativas</h3>
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
                  setSettings({ ...settings, taxRate: Number(e.target.value) })
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingSettings ? "Guardando…" : "Guardar preferencias"}
            </button>
          </div>
        </form>
      </article>

      {/* Sedes */}
      {branches.length > 0 && (
        <article className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="font-bold">Sedes</h3>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {branches.map((b) => (
              <li key={b.id}>
                {b.name}
                {b.city ? ` · ${b.city}` : ""}
              </li>
            ))}
          </ul>
        </article>
      )}

      {/* Usuarios y permisos */}
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Usuarios y permisos</h3>
          <button
            onClick={() => {
              setShowUserForm((v) => !v);
              setUserForm(EMPTY_USER_FORM);
            }}
            className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-1.5 text-xs font-semibold text-white"
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
            className="mt-3 grid gap-3 rounded-xl bg-stone-50 p-3 sm:grid-cols-2"
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
              <button
                type="submit"
                disabled={savingUser}
                className="rounded-xl bg-[var(--admin-primary,#581c22)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingUser ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>
        )}

        <ul className="mt-3 divide-y divide-stone-100">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-stone-500">
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
                className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
              >
                Quitar
              </button>
            </li>
          ))}
          {users.length === 0 && (
            <li className="py-4 text-center text-sm text-stone-400">
              Sin usuarios vinculados.
            </li>
          )}
        </ul>
      </article>
    </div>
  );
}
