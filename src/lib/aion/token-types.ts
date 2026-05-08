import type { aion } from "@/lib/aion/tokens";

export type TokenShape = {
  colors: Record<keyof typeof aion.colors, string>;
  radius: Record<keyof typeof aion.radius, string>;
};
