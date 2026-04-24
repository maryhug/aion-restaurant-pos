"use client";

import { useState, useCallback } from "react";
import { aion } from "@/lib/aion/tokens";

type RowProps = { id: string; initialOn: boolean };

/**
 * Toggles de disponibilidad solo en cliente (MVP), sin tocar el backend aún.
 */
export function AionMenuTableClient({ id: _id, initialOn }: RowProps) {
  const [on, setOn] = useState(initialOn);
  const toggle = useCallback(() => {
    setOn((o) => !o);
  }, []);
  return (
    <button
      type="button"
      onClick={toggle}
      className="relative h-5 w-9 rounded-full"
      style={{
        background: on ? aion.colors.primary : "#D4D0C8",
      }}
      title={on ? "Disponible" : "No disponible"}
      aria-pressed={on}
      aria-label="Disponible"
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
        style={{ right: on ? 2 : undefined, left: on ? undefined : 2 }}
        aria-hidden
      />
    </button>
  );
}
