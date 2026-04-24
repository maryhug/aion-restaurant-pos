import type { ReactNode } from "react";
import { aion } from "@/lib/aion/tokens";

export default function AionAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-dvh"
      style={{ background: aion.colors.pageBg, color: aion.colors.text }}
    >
      {children}
    </div>
  );
}
