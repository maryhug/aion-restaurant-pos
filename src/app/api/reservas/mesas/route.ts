import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/reservas/mesas?restaurantId=&date=YYYY-MM-DD&time=HH:MM&partySize=N
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const partySize = Number(searchParams.get("partySize") ?? "1");

  if (!restaurantId || !date || !time) {
    return NextResponse.json(
      { error: "restaurantId, date y time son obligatorios" },
      { status: 400 },
    );
  }

  // Mesas ocupadas en esa fecha/hora
  const busy = await prisma.reservations.findMany({
    where: {
      date: new Date(date),
      time: new Date(`1970-01-01T${time}:00`),
      status: { in: ["pending", "confirmed"] },
    },
    select: { table_id: true },
  });

  const busyIds = busy.map((r) => r.table_id);

  const tables = await prisma.tables.findMany({
    where: {
      restaurant_id: restaurantId,
      status: "available",
      capacity: { gte: partySize },
      ...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}),
    },
    select: { id: true, number: true, capacity: true },
    orderBy: { number: "asc" },
  });

  return NextResponse.json({ tables });
}
