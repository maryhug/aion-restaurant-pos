import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth/session";

// POST /api/reservas — crea una reserva. Si hay sesión usa su userId, si no busca/crea usuario por email.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      restaurantId?: string;
      tableId?: string;
      date?: string;
      time?: string;
      partySize?: number;
      name?: string;
      email?: string;
      phone?: string;
    };

    const { restaurantId, tableId, date, time, partySize, name, email } = body;

    if (
      !restaurantId ||
      !tableId ||
      !date ||
      !time ||
      !partySize ||
      !name ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            "restaurantId, tableId, date, time, partySize, name y email son obligatorios",
        },
        { status: 400 },
      );
    }

    // Resolver userId: sesión activa o buscar por email (crear si no existe)
    const session = await getServerSession();
    let userId: string;

    if (session?.id) {
      userId = session.id;
    } else {
      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
      } else {
        const guest = await prisma.users.create({
          data: { email, name, role: "customer" },
        });
        userId = guest.id;
      }
    }

    const reservation = await prisma.reservations.create({
      data: {
        user_id: userId,
        table_id: tableId,
        date: new Date(date),
        time: new Date(`1970-01-01T${time}:00`),
        party_size: partySize,
        status: "confirmed",
      },
      select: { id: true, date: true, time: true, party_size: true },
    });

    const table = await prisma.tables.findUnique({
      where: { id: tableId },
      select: { number: true },
    });

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        tableNumber: table?.number ?? 0,
        date:
          reservation.date instanceof Date
            ? reservation.date.toISOString().slice(0, 10)
            : String(reservation.date),
        time:
          reservation.time instanceof Date
            ? reservation.time.toTimeString().slice(0, 5)
            : String(reservation.time).slice(0, 5),
        partySize: reservation.party_size,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear reserva";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/reservas — lista reservas del restaurante activo (requiere sesión admin/staff)
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.restaurantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const reservations = await prisma.reservations.findMany({
      where: { tables: { restaurant_id: session.restaurantId } },
      include: {
        tables: { select: { number: true } },
        users: { select: { name: true, email: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ reservations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
