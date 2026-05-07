"use client";

import { useState } from "react";
import { DataTable } from "@/features/admin/components/data-table";
import { ExportButton } from "@/features/admin/components/export-button";
import {
  inventoryMovesMock,
  inventoryProductsMock,
  serviceExpensesMock,
} from "@/features/admin/mocks";
import { exportRowsAsCSV, formatCOP } from "@/features/admin/helpers";

type Tab = "productos" | "servicios" | "movimientos";

export default function AdminInventoryPage() {
  const [tab, setTab] = useState<Tab>("productos");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["productos", "servicios", "movimientos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-3 py-2 text-sm ${tab === t ? "bg-black text-white" : "border bg-white"}`}
          >
            {t}
          </button>
        ))}
        <ExportButton
          onClick={() =>
            exportRowsAsCSV(
              "inventario.csv",
              inventoryProductsMock as unknown as Record<string, unknown>[],
            )
          }
        />
      </div>
      {tab === "productos" ? (
        <DataTable
          rows={inventoryProductsMock}
          rowKey={(r) => String(r.id)}
          columns={[
            { key: "name", label: "Nombre" },
            { key: "category", label: "Categoría" },
            { key: "stock", label: "Stock actual" },
            { key: "minStock", label: "Stock mínimo" },
            { key: "unit", label: "Unidad" },
            {
              key: "unitCost",
              label: "Costo unitario",
              render: (r) => formatCOP(Number(r.unitCost)),
            },
            { key: "supplier", label: "Proveedor" },
            { key: "purchaseDate", label: "Fecha compra" },
            { key: "state", label: "Estado" },
            {
              key: "acciones",
              label: "Acciones",
              render: () => (
                <button className="rounded border px-2 py-1">Editar</button>
              ),
            },
          ]}
        />
      ) : null}
      {tab === "servicios" ? (
        <DataTable
          rows={serviceExpensesMock}
          rowKey={(r) => String(r.id)}
          columns={[
            { key: "service", label: "Servicio" },
            { key: "category", label: "Categoría" },
            { key: "period", label: "Periodo" },
            {
              key: "value",
              label: "Valor",
              render: (r) => formatCOP(Number(r.value)),
            },
            { key: "paidAt", label: "Fecha pago" },
            { key: "status", label: "Estado" },
            { key: "note", label: "Observación" },
          ]}
        />
      ) : null}
      {tab === "movimientos" ? (
        <DataTable
          rows={inventoryMovesMock}
          rowKey={(r) => String(r.id)}
          columns={[
            { key: "date", label: "Fecha" },
            { key: "product", label: "Producto" },
            { key: "type", label: "Movimiento" },
            { key: "quantity", label: "Cantidad" },
            { key: "reason", label: "Motivo" },
            { key: "responsible", label: "Responsable" },
          ]}
        />
      ) : null}
    </div>
  );
}
