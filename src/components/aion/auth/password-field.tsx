"use client";

import { useState, type InputHTMLAttributes } from "react";
import { aion } from "@/lib/aion/tokens";

type Props = {
  id: string;
  label: string;
  rightLink?: { href: string; text: string };
} & InputHTMLAttributes<HTMLInputElement>;

export function AionPasswordField({ id, label, rightLink, className, ...rest }: Props) {
  const [vis, setVis] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label
          className="text-xs font-medium"
          style={{ color: aion.colors.muted }}
          htmlFor={id}
        >
          {label}
        </label>
        {rightLink ? (
          <a
            href={rightLink.href}
            className="text-xs font-medium"
            style={{ color: aion.colors.primary }}
          >
            {rightLink.text}
          </a>
        ) : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
        <input
          id={id}
          className={`w-full rounded-xl border-0 py-2.5 pl-9 pr-9 text-sm ring-1 ring-black/10 ${className ?? ""}`}
          type={vis ? "text" : "password"}
          aria-describedby={rest["aria-describedby"]}
          {...rest}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-500"
          onClick={() => setVis((v) => !v)}
          aria-label={vis ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {vis ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 12s4-6 11-6 11 6 11 6-4 6-11 6-11-6-11-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.7 2.7" />
              <path d="M9.5 4.2A10 10 0 0 1 12 4c7 0 11 8 11 8a19 19 0 0 1-3.4 4.1" />
              <path d="M6.3 6.3A19 19 0 0 0 1 12s4 8 11 8a9 9 0 0 0 3.1-.4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
