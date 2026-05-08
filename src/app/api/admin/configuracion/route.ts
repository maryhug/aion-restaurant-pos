import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const [restaurant, settings, branding, branches] = await Promise.all([
    prisma.restaurants.findUnique({ where: { id: restaurantId } }),
    prisma.restaurant_settings.findUnique({
      where: { restaurant_id: restaurantId },
    }),
    prisma.restaurant_branding.findUnique({
      where: { restaurant_id: restaurantId },
    }),
    prisma.branches.findMany({
      where: { restaurant_id: restaurantId, is_active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    restaurantId,
    restaurant: {
      name: restaurant?.name ?? "",
      address: restaurant?.address ?? "",
      phone: restaurant?.phone ?? "",
    },
    branding: {
      primaryColor: branding?.primary_color ?? "#581c22",
      secondaryColor: branding?.secondary_color ?? "#7b4b52",
      accentColor: branding?.accent_color ?? "#d97706",
      backgroundColor: branding?.background_color ?? "#ffe5e5",
      logoUrl: branding?.logo_url ?? null,
    },
    settings: {
      currency: settings?.currency ?? "COP",
      timezone: settings?.timezone ?? "America/Bogota",
      taxRate: Number(settings?.tax_rate ?? 19),
      tipSuggestion: Number(settings?.tip_suggested_pct ?? 10),
    },
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city ?? "",
    })),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  await Promise.all([
    body.restaurant &&
      prisma.restaurants.update({
        where: { id: restaurantId },
        data: {
          name: String(body.restaurant.name),
          address: body.restaurant.address || null,
          phone: body.restaurant.phone || null,
        },
      }),
    body.settings &&
      prisma.restaurant_settings.upsert({
        where: { restaurant_id: restaurantId },
        create: {
          restaurant_id: restaurantId,
          currency: String(body.settings.currency),
          timezone: String(body.settings.timezone),
          tax_rate: Number(body.settings.taxRate),
          tip_suggested_pct: Number(body.settings.tipSuggestion),
        },
        update: {
          currency: String(body.settings.currency),
          timezone: String(body.settings.timezone),
          tax_rate: Number(body.settings.taxRate),
          tip_suggested_pct: Number(body.settings.tipSuggestion),
        },
      }),
    body.branding &&
      prisma.restaurant_branding.upsert({
        where: { restaurant_id: restaurantId },
        create: {
          restaurant_id: restaurantId,
          primary_color: String(body.branding.primaryColor),
          secondary_color: String(body.branding.secondaryColor),
          accent_color: String(body.branding.accentColor),
          background_color: String(body.branding.backgroundColor),
        },
        update: {
          primary_color: String(body.branding.primaryColor),
          secondary_color: String(body.branding.secondaryColor),
          accent_color: String(body.branding.accentColor),
          background_color: String(body.branding.backgroundColor),
        },
      }),
  ]);

  return NextResponse.json({ ok: true });
}
