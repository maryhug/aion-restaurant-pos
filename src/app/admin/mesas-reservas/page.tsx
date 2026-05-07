"use client";

import { DataTable } from "@/features/admin/components/data-table";
import { ReservationBoard } from "@/features/admin/components/domain";
import { reservationsMock, tablesMock } from "@/features/admin/mocks";

export default function AdminTablesReservationsPage() {
  return (
    <div className="space-y-3">
      <ReservationBoard tables={tablesMock} reservations={reservationsMock} />
      <section className="grid gap-3 lg:grid-cols-2">
        <DataTable
          rows={tablesMock}
          rowKey={(r) => String(r.id)}
          columns={[
            { key: "number", label: "Mesa" },
            { key: "capacity", label: "Capacidad" },
            { key: "status", label: "Estado" },
            { key: "zone", label: "Zona" },
            {
              key: "acciones",
              label: "Acciones",
              render: () => (
                <button className="rounded border px-2 py-1">Editar</button>
              ),
            },
          ]}
        />
        <DataTable
          rows={reservationsMock}
          rowKey={(r) => String(r.id)}
          columns={[
            { key: "customer", label: "Cliente" },
            { key: "date", label: "Fecha" },
            { key: "time", label: "Hora" },
            { key: "people", label: "Personas" },
            { key: "table", label: "Mesa" },
            { key: "status", label: "Estado" },
            { key: "notes", label: "Observaciones" },
            {
              key: "acciones",
              label: "Acciones",
              render: () => (
                <button className="rounded border px-2 py-1 text-red-600">
                  Cancelar
                </button>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
