import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const memberships = await prisma.user_restaurants.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({
    users: memberships.map((m) => ({
      id: m.users.id,
      name: m.users.name,
      email: m.users.email,
      role: m.role,
      globalRole: m.users.role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  const { name, email, password, role } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 },
    );
  }
  if (!["admin", "staff"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    // User already exists — just link them to this restaurant if not already linked
    const alreadyLinked = await prisma.user_restaurants.findUnique({
      where: {
        user_id_restaurant_id: {
          user_id: existing.id,
          restaurant_id: restaurantId,
        },
      },
    });
    if (alreadyLinked) {
      return NextResponse.json(
        { error: "El usuario ya pertenece a este restaurante" },
        { status: 409 },
      );
    }
    await prisma.user_restaurants.create({
      data: { user_id: existing.id, restaurant_id: restaurantId, role },
    });
    return NextResponse.json({ id: existing.id, linked: true });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.users.create({
    data: {
      name: String(name),
      email: String(email),
      password: hashed,
      role: String(role),
    },
  });
  await prisma.user_restaurants.create({
    data: { user_id: user.id, restaurant_id: restaurantId, role: String(role) },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId, id: requesterId } = auth.payload;
  const body = await req.json();

  if (body.userId === requesterId) {
    return NextResponse.json(
      { error: "No puedes eliminarte a ti mismo" },
      { status: 400 },
    );
  }

  await prisma.user_restaurants.deleteMany({
    where: { user_id: body.userId, restaurant_id: restaurantId },
  });
  return NextResponse.json({ ok: true });
}
