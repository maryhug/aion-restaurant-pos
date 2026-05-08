import prisma from "@/lib/prisma";
import type { TokenShape } from "@/lib/aion/token-types";
import { cazuela as fallback } from "./tokens";
import { getCazuelaRestaurantId } from "./restaurant";

let cachedTokens: TokenShape | null = null;

export async function getCazuelaBrandingTokens(): Promise<TokenShape> {
  if (cachedTokens) return cachedTokens;

  const restaurantId = await getCazuelaRestaurantId();
  if (!restaurantId) return fallback;

  const branding = await prisma.restaurant_branding.findUnique({
    where: { restaurant_id: restaurantId },
  });

  if (!branding?.primary_color) return fallback;

  const primary = branding.primary_color;
  const primaryAlt = branding.secondary_color ?? fallback.colors.primaryAlt;
  const bg = branding.background_color ?? fallback.colors.pageBg;

  cachedTokens = {
    colors: {
      primary,
      primaryAlt,
      hero: primary,
      pageBg: bg,
      pageBgAlt: bg,
      pageBgBeige: bg,
      text: primary,
      muted: primaryAlt,
      border: fallback.colors.border,
      white: "#ffffff",
      pillInactive: fallback.colors.pillInactive,
      tagBg: fallback.colors.tagBg,
      success: fallback.colors.success,
      warning: branding.accent_color ?? fallback.colors.warning,
      danger: fallback.colors.danger,
      info: fallback.colors.info,
      staffBg: bg,
    },
    radius: fallback.radius,
  };

  return cachedTokens;
}
