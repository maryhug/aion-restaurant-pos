import prisma from "@/lib/prisma";
import type { Table } from "@/types/database";

export type AvailableTable = Pick<Table, "id" | "number" | "capacity">;

export interface ReservationFormData {
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  tableId: string;
}

export interface ReservationConfirmation {
  id: string;
  tableNumber: number;
  date: string;
  time: string;
  partySize: number;
}

export interface FormErrors {
  name?: string;
  email?: string;
  date?: string;
  time?: string;
  partySize?: string;
  tableId?: string;
}

/**
 * Devuelve mesas disponibles para una fecha, hora y número de personas
 */
export async function getAvailableTables(
  restaurantId: string,
  date: string,
  time: string,
  partySize: number,
): Promise<AvailableTable[]> {
  // 1. IDs de mesas ya reservadas en esa fecha/hora
  const busyReservations = await prisma.reservations.findMany({
    where: {
      date: new Date(date),
      time: new Date(`1970-01-01T${time}:00`),
      status: { in: ["pending", "confirmed"] },
    },
    select: { table_id: true },
  });

  const busyIds = busyReservations.map((r) => r.table_id);

  // 2. Mesas con capacidad suficiente y no ocupadas
  const tables = await prisma.tables.findMany({
    where: {
      restaurant_id: restaurantId,
      status: "available",
      capacity: { gte: partySize },
      ...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}),
    },
    select: { id: true, number: true, capacity: true },
  });

  return tables;
}

/**
 * Crea la reserva y devuelve los datos de confirmación
 */
export async function createReservation(
  formData: ReservationFormData,
  userId: string,
): Promise<ReservationConfirmation> {
  const [reservation, table] = await Promise.all([
    prisma.reservations.create({
      data: {
        user_id: userId,
        table_id: formData.tableId,
        date: new Date(formData.date),
        time: new Date(`1970-01-01T${formData.time}:00`),
        party_size: formData.partySize,
        status: "pending",
      },
      select: { id: true, date: true, time: true, party_size: true },
    }),
    prisma.tables.findUniqueOrThrow({
      where: { id: formData.tableId },
      select: { number: true },
    }),
  ]);

  return {
    id: reservation.id,
    tableNumber: table.number,
    date: reservation.date.toISOString().slice(0, 10),
    time:
      reservation.time instanceof Date
        ? reservation.time.toTimeString().slice(0, 5)
        : String(reservation.time).slice(0, 5),
    partySize: reservation.party_size,
  };
}
