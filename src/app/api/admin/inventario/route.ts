import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const items = await prisma.menu_items.findMany({
    where: { restaurant_id: restaurantId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    products: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      stock: i.stock,
      minStock: i.min_stock,
      unitCost: i.cost_price !== null ? Number(i.cost_price) : null,
      price: Number(i.price),
      available: i.available,
      state: i.available ? "Disponible" : "No disponible",
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const item = await prisma.menu_items.create({
    data: {
      restaurant_id: restaurantId,
      name: String(body.name),
      category: String(body.category),
      price: Number(body.price),
      cost_price: body.unitCost != null ? Number(body.unitCost) : null,
      stock: body.stock != null ? Number(body.stock) : 0,
      min_stock: body.minStock != null ? Number(body.minStock) : 5,
      available: true,
    },
  });
  return NextResponse.json({ id: item.id });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.menu_items.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.menu_items.update({
    where: { id: body.id },
    data: {
      name: String(body.name),
      category: String(body.category),
      price: Number(body.price),
      cost_price: body.unitCost != null ? Number(body.unitCost) : null,
      stock: body.stock != null ? Number(body.stock) : 0,
      min_stock: body.minStock != null ? Number(body.minStock) : 5,
      available: body.available !== false,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.menu_items.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (body.soft) {
    await prisma.menu_items.update({
      where: { id: body.id },
      data: { available: false },
    });
  } else {
    await prisma.menu_items.delete({ where: { id: body.id } });
  }
  return NextResponse.json({ ok: true });
}
