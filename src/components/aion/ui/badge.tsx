import type { ReactNode } from "react";
import { aion } from "@/lib/aion/tokens";

type Props = { children: ReactNode; className?: string };

export function AionDietaryBadge({ children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{
        backgroundColor: aion.colors.tagBg,
        color: aion.colors.primary,
      }}
    >
      {children}
    </span>
  );
}

type CatProps = { children: ReactNode };

export function AionCategoryPillLabel({ children }: CatProps) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: aion.colors.tagBg,
        color: aion.colors.primary,
      }}
    >
      {children}
    </span>
  );
}
