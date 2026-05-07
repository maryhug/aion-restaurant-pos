"use client";

import { type ReactNode } from "react";
import { LanguageProvider } from "@/lib/aion/language-context";
import { aion } from "@/lib/aion/tokens";

function StaffShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh transition-all duration-300 ease-in-out"
      style={{ background: aion.colors.staffBg, color: aion.colors.text }}
    >
      {children}
    </div>
  );
}

export default function AionStaffLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <StaffShell>{children}</StaffShell>
    </LanguageProvider>
  );
}
