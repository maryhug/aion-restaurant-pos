import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const [tables, reservations] = await Promise.all([
    prisma.tables.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { number: "asc" },
    }),
    prisma.reservations.findMany({
      where: { tables: { restaurant_id: restaurantId } },
      include: {
        users: { select: { name: true } },
        tables: { select: { number: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const tableStatus: Record<string, string> = {
    available: "libre",
    occupied: "ocupada",
    reserved: "reservada",
    cleaning: "limpieza",
  };
  const reservationStatus: Record<string, string> = {
    confirmed: "confirmada",
    pending: "pendiente",
    cancelled: "cancelada",
  };

  return NextResponse.json({
    tables: tables.map((t) => ({
      id: t.id,
      number: t.number,
      capacity: t.capacity,
      status: tableStatus[t.status] ?? t.status,
      zone: t.zone ?? "",
    })),
    reservations: reservations.map((r) => ({
      id: r.id,
      customer: r.users?.name ?? "-",
      date:
        r.date instanceof Date
          ? r.date.toISOString().split("T")[0]
          : String(r.date),
      time:
        r.time instanceof Date
          ? r.time.toTimeString().slice(0, 5)
          : String(r.time).slice(0, 5),
      people: r.party_size,
      table: `Mesa ${r.tables?.number ?? "?"}`,
      tableId: r.table_id,
      status: reservationStatus[r.status] ?? r.status,
      notes: r.notes ?? "",
    })),
  });
}

const tableStatusToDb: Record<string, string> = {
  libre: "available",
  ocupada: "occupied",
  reservada: "reserved",
  limpieza: "cleaning",
};
const reservationStatusToDb: Record<string, string> = {
  confirmada: "confirmed",
  pendiente: "pending",
  cancelada: "cancelled",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId, id: userId } = auth.payload;
  const body = await req.json();

  async function getBranchId(id: unknown) {
    if (!id || typeof id !== "string") return null;
    const b = await prisma.branches.findFirst({
      where: { id, restaurant_id: restaurantId },
      select: { id: true },
    });
    return b?.id ?? null;
  }

  if (body.entity === "table") {
    const branchId = await getBranchId(body.branchId);
    const table = await prisma.tables.create({
      data: {
        restaurant_id: restaurantId,
        branch_id: branchId,
        number: Number(body.number),
        capacity: Number(body.capacity),
        zone: body.zone || null,
        status: tableStatusToDb[body.status] ?? "available",
      },
    });
    return NextResponse.json({ id: table.id });
  }

  if (body.entity === "reservation") {
    const branchId = await getBranchId(body.branchId);
    const reservation = await prisma.reservations.create({
      data: {
        user_id: userId,
        table_id: body.tableId,
        restaurant_id: restaurantId,
        branch_id: branchId,
        date: new Date(body.date),
        time: new Date(`1970-01-01T${body.time}:00`),
        party_size: Number(body.partySize),
        status: reservationStatusToDb[body.status] ?? "pending",
        customer_name: body.customerName || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ id: reservation.id });
  }

  return NextResponse.json({ error: "entity inválido" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  if (body.entity === "table") {
    const exists = await prisma.tables.findFirst({
      where: { id: body.id, restaurant_id: restaurantId },
    });
    if (!exists)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.tables.update({
      where: { id: body.id },
      data: {
        number: Number(body.number),
        capacity: Number(body.capacity),
        zone: body.zone || null,
        status: tableStatusToDb[body.status] ?? "available",
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "reservation") {
    await prisma.reservations.update({
      where: { id: body.id },
      data: {
        table_id: body.tableId,
        date: new Date(body.date),
        time: new Date(`1970-01-01T${body.time}:00`),
        party_size: Number(body.partySize),
        status: reservationStatusToDb[body.status] ?? "pending",
        customer_name: body.customerName || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "entity inválido" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  if (body.entity === "table") {
    const exists = await prisma.tables.findFirst({
      where: { id: body.id, restaurant_id: restaurantId },
    });
    if (!exists)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.tables.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "reservation") {
    await prisma.reservations.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "entity inválido" }, { status: 400 });
}
