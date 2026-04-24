"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
  label?: string;
};

export function AionLogoutButton({
  className,
  style,
  label = "Cerrar sesión",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/aion/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={className}
      style={style}
    >
      {loading ? "Cerrando..." : label}
    </button>
  );
}
