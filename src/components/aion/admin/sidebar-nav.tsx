import Link from "next/link";
import { aion } from "@/lib/aion/tokens";
import { AionLogoutButton } from "@/components/aion/auth/logout-button";

type Item = { href: string; label: string; icon: "grid" | "menu" | "line" };
type Props = { current: "dashboard" | "menu" };

const items: Item[] = [
  { href: "/aion/admin", label: "Dashboard", icon: "grid" },
  { href: "/aion/admin/menu", label: "Gestión menú", icon: "menu" },
];

function Ico({ t }: { t: Item["icon"] }) {
  if (t === "grid")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  if (t === "line")
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <path d="M3 20h18" />
        <path d="M4 12l4-3 3 2 3-2 3 1 4-4" />
      </svg>
    );
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M5 2v2h14V2" />
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <path d="M9 22V16h6v6" />
    </svg>
  );
}

export function AionAdminSidebar({ current }: Props) {
  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r border-stone-200/80 bg-white px-2 py-4"
      style={{ minHeight: "100dvh" }}
    >
      <div className="px-2 pb-4">
        <p
          className="text-sm font-extrabold tracking-wide"
          style={{ color: aion.colors.primary }}
        >
          AION
        </p>
        <p className="text-xs" style={{ color: aion.colors.muted }}>
          Administración
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Panel admin">
        {items.map((it) => {
          const act =
            (it.href === "/aion/admin" && current === "dashboard") ||
            (it.href === "/aion/admin/menu" && current === "menu");
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
              style={
                act
                  ? { background: aion.colors.primary, color: aion.colors.white }
                  : { color: aion.colors.text }
              }
            >
              <span className="opacity-90" aria-hidden>
                <Ico t={it.icon} />
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <Link
        className="mt-4 flex items-center gap-2 rounded-xl border border-stone-200/80 px-3 py-2 text-sm font-medium"
        style={{ color: aion.colors.muted }}
        href="/aion"
      >
        <span className="grid size-4 place-items-center" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" />
          </svg>
        </span>
        Volver al inicio
      </Link>
      <AionLogoutButton
        className="mt-2 w-full rounded-xl border border-stone-200/80 px-3 py-2 text-left text-sm font-medium disabled:opacity-70"
        style={{ color: aion.colors.danger }}
      />
    </aside>
  );
}
