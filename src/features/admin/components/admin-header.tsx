"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminTenant } from "@/features/admin/tenant-context";
import {
  MenuIcon,
  CameraIcon,
  LogOutIcon,
  PencilIcon,
  XMarkIcon,
  SearchIcon,
  BellIcon,
  ShoppingBagIcon,
} from "@/features/admin/components/icons";
import {
  useOrderNotifications,
  type OrderNotification,
} from "@/features/admin/hooks/use-order-notifications";
import { formatCOP } from "@/features/admin/helpers";

type UserInfo = { id: string; email: string; name: string };

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

/* ─── Notification dropdown ─────────────────────────────────── */

function NotificationDropdown({
  notifications,
  onDismiss,
  onDismissAll,
  onClose,
}: {
  notifications: OrderNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
}) {
  const router = useRouter();

  function goToOrder(n: OrderNotification) {
    router.push(`/aion/admin/pedidos?q=${n.id}`);
    onDismiss(n.fullId);
    onClose();
  }

  return (
    <div className="absolute right-0 top-14 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-stone-900">
            Notificaciones
          </span>
          {notifications.length > 0 && (
            <span className="rounded-full bg-[var(--admin-primary,#581c22)] px-2 py-0.5 text-[10px] font-bold text-white">
              {notifications.length}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onDismissAll}
            className="text-xs font-medium text-stone-400 hover:text-stone-700"
          >
            Leer todo
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BellIcon className="h-8 w-8 text-stone-200" />
            <p className="text-sm text-stone-400">Sin notificaciones nuevas</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.fullId}
              onClick={() => goToOrder(n)}
              className="flex w-full items-start gap-3 border-b border-stone-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-stone-50"
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
                  color: "var(--admin-primary,#581c22)",
                }}
              >
                <ShoppingBagIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">
                  Nuevo pedido #{n.id}
                </p>
                <p className="text-xs text-stone-500">
                  {n.tableOrType} · {formatCOP(n.total)}
                </p>
                <p className="mt-0.5 text-[11px] text-stone-400">
                  {timeAgo(n.date)}
                </p>
              </div>
              <span
                className="mt-0.5 shrink-0 text-stone-300 hover:text-stone-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(n.fullId);
                }}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </span>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-stone-100 p-2">
        <Link
          href="/aion/admin/pedidos"
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-medium text-[var(--admin-primary,#581c22)] transition-colors hover:bg-stone-50"
        >
          Ver todos los pedidos →
        </Link>
      </div>
    </div>
  );
}

/* ─── Main header ────────────────────────────────────────────── */

export function AdminHeader({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { tenant } = useAdminTenant();
  const router = useRouter();
  const { notifications, dismiss, dismissAll } = useOrderNotifications();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarReady, setAvatarReady] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const avatarKey = user?.id ? `aion_avatar_${user.id}` : null;

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d: UserInfo) => {
        setUser(d);
        if (d?.id) {
          const stored = localStorage.getItem(`aion_avatar_${d.id}`);
          setAvatarUrl(stored ?? "");
          setAvatarReady(true);
        }
      })
      .catch(() => null);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/aion/login");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !avatarKey) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setAvatarUrl(url);
      localStorage.setItem(avatarKey, url);
    };
    reader.readAsDataURL(file);
  }

  async function saveName() {
    if (!nameInput.trim()) return;
    await fetch("/api/admin/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput }),
    });
    setUser((u) => (u ? { ...u, name: nameInput } : u));
    setEditingName(false);
  }

  const displayName = user?.name ?? "Admin";
  const displayInitials = initials(displayName);
  const hasNotifications = notifications.length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--admin-border,#f1cfd4)] bg-white">
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Mobile menu */}
        <button
          className="flex shrink-0 items-center justify-center rounded-xl p-2 text-stone-500 hover:bg-stone-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {/* Page title */}
        <div className="mr-auto min-w-0">
          <p className="hidden truncate text-xs uppercase tracking-widest text-stone-400 sm:block">
            {tenant.restaurantName}
          </p>
          <h1 className="truncate text-2xl font-bold text-stone-900 sm:text-3xl">
            {title}
          </h1>
        </div>

        {/* Search */}
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100">
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>

        {/* Bell with notifications */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100"
            aria-label="Notificaciones"
          >
            <BellIcon className="h-[18px] w-[18px]" />
            {hasNotifications ? (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-[9px] font-bold text-white">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            ) : (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-stone-300" />
            )}
          </button>

          {notifOpen && (
            <NotificationDropdown
              notifications={notifications}
              onDismiss={dismiss}
              onDismissAll={dismissAll}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-stone-200 sm:block" />

        {/* Avatar + profile popover */}
        <div className="relative shrink-0" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-stone-50"
            title={displayName}
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-stone-800">
                {displayName}
              </p>
              <p className="truncate text-xs leading-tight text-stone-400">
                {user?.email ?? tenant.restaurantName}
              </p>
            </div>
            <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-[var(--admin-border,#f1cfd4)] ring-offset-1">
              {!avatarReady ? (
                <div className="h-full w-full animate-pulse bg-stone-200" />
              ) : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--admin-primary,#581c22)] text-xs font-bold text-white">
                  {displayInitials}
                </div>
              )}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-xl">
              <div className="flex items-center gap-3 rounded-t-2xl bg-stone-50 px-4 py-4">
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--admin-primary,#581c22)] text-sm font-bold text-white">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayInitials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-[var(--admin-primary,#581c22)]"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveName();
                          if (e.key === "Escape") setEditingName(false);
                        }}
                      />
                      <button
                        onClick={saveName}
                        className="shrink-0 rounded-lg bg-[var(--admin-primary,#581c22)] px-2 py-1 text-xs text-white"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNameInput(displayName);
                        setEditingName(true);
                      }}
                      className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      title="Editar nombre"
                    >
                      <span className="truncate">{displayName}</span>
                      <PencilIcon className="h-3 w-3 shrink-0 text-stone-400" />
                    </button>
                  )}
                  <p className="truncate text-xs text-stone-500">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-100 p-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">
                  <CameraIcon className="h-4 w-4 shrink-0 text-stone-400" />
                  Cambiar foto de perfil
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {avatarUrl && (
                  <button
                    onClick={() => {
                      setAvatarUrl("");
                      if (avatarKey) localStorage.removeItem(avatarKey);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
                  >
                    <XMarkIcon className="h-4 w-4 shrink-0 text-stone-400" />
                    Quitar foto
                  </button>
                )}
                <div className="my-1 border-t border-stone-100" />
                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <LogOutIcon className="h-4 w-4 shrink-0" />
                  {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
