import type { ReactNode } from "react";
import { aion } from "@/lib/aion/tokens";

export default function AionLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh"
      style={{
        backgroundColor: aion.colors.pageBg,
        color: aion.colors.text,
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
