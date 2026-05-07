import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Devuelve el primer restaurante activo (Il Cafeto).
// Endpoint público — sin auth.
export async function GET() {
  const restaurant = await prisma.restaurants.findFirst({
    select: { id: true, name: true, address: true, phone: true },
    orderBy: { created_at: "asc" },
  });

  if (!restaurant) {
    return NextResponse.json(
      { error: "No hay restaurante registrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ restaurant });
}
