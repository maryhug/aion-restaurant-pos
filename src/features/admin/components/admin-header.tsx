"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminTenant } from "@/features/admin/tenant-context";

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

export function AdminHeader({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { tenant } = useAdminTenant();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [popover, setPopover] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aion_avatar_url") || "";
    }
    return "";
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d: UserInfo) => setUser(d))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!popover) return;
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopover(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popover]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/aion/login");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setAvatarUrl(url);
      localStorage.setItem("aion_avatar_url", url);
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

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--admin-border,#ece7ea)] bg-white px-3 py-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded-lg border border-[var(--admin-border,#ece7ea)] bg-white px-2 py-1 text-sm lg:hidden"
          onClick={onMenuClick}
        >
          Menu
        </button>

        <div className="mr-auto">
          <p className="text-xs font-semibold text-stone-500">
            {tenant.restaurantName}
          </p>
          <h1 className="text-lg font-black text-[var(--admin-primary,#581c22)]">
            {title}
          </h1>
        </div>

        {/* User avatar + popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setPopover((v) => !v)}
            className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-[var(--admin-primary,#581c22)] text-xs font-bold text-white ring-2 ring-[var(--admin-border,#ece7ea)] hover:opacity-90"
            title={displayName}
          >
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
          </button>

          {popover && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-[var(--admin-border,#ece7ea)] bg-white p-4 shadow-xl">
              {/* Avatar section */}
              <div className="flex items-center gap-3">
                <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--admin-primary,#581c22)] text-sm font-bold text-white">
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
                <div className="min-w-0">
                  {editingName ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        className="w-full rounded-lg border border-stone-200 px-2 py-1 text-sm"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveName()}
                      />
                      <button
                        onClick={saveName}
                        className="rounded-lg bg-[var(--admin-primary,#581c22)] px-2 py-1 text-xs text-white"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNameInput(displayName);
                        setEditingName(true);
                      }}
                      className="flex items-center gap-1 truncate text-sm font-semibold hover:underline"
                      title="Editar nombre"
                    >
                      {displayName}
                      <span className="text-[10px] text-stone-400">✎</span>
                    </button>
                  )}
                  <p className="truncate text-xs text-stone-500">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="my-3 border-t border-stone-100" />

              {/* Change image */}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-stone-50">
                <span className="text-stone-400">🖼</span>
                Cambiar imagen
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
                    localStorage.removeItem("aion_avatar_url");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-stone-400 hover:bg-stone-50"
                >
                  <span>✕</span> Quitar imagen
                </button>
              )}

              <div className="my-3 border-t border-stone-100" />

              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <span>→</span>
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
