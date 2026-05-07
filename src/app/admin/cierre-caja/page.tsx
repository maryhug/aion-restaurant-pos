"use client";

import { useMemo, useState } from "react";
import {
  CashClosingForm,
  CashClosingSummary,
} from "@/features/admin/components/domain";
import { DataTable } from "@/features/admin/components/data-table";
import { cashClosingsMock } from "@/features/admin/mocks";
import { formatCOP } from "@/features/admin/helpers";

export default function AdminCashClosingPage() {
  const [closing, setClosing] = useState(cashClosingsMock[0]);
  const totalExpected = useMemo(
    () =>
      closing.baseFund +
      closing.cashSales +
      closing.otherIncome -
      closing.withdrawals -
      closing.cashExpenses,
    [closing],
  );
  return (
    <div className="space-y-3">
      <section className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-black/5 bg-white p-4">
          <h3 className="font-bold">Datos del turno</h3>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <p>Fecha: {closing.date}</p>
            <p>Turno: {closing.shift}</p>
            <p>Cajero: {closing.cashier}</p>
            <p>Sede: {closing.branch}</p>
            <p>Apertura: {closing.openTime}</p>
            <p>Cierre: {closing.closeTime}</p>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p>Fondo inicial: {formatCOP(closing.baseFund)}</p>
            <p>Ventas efectivo: {formatCOP(closing.cashSales)}</p>
            <p>Ventas tarjeta: {formatCOP(closing.cardSales)}</p>
            <p>Transferencias: {formatCOP(closing.transferSales)}</p>
            <p>Otros ingresos: {formatCOP(closing.otherIncome)}</p>
            <p>Retiros: {formatCOP(closing.withdrawals)}</p>
            <p>Gastos caja: {formatCOP(closing.cashExpenses)}</p>
          </div>
        </article>
        <div className="space-y-3">
          <CashClosingSummary
            totalExpected={totalExpected}
            counted={closing.countedCash}
          />
          <CashClosingForm value={closing} onChange={setClosing} />
          <div className="flex gap-2">
            <button className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white">
              Cerrar caja
            </button>
            <button className="rounded-xl border px-3 py-2 text-sm font-semibold">
              Descargar reporte
            </button>
          </div>
        </div>
      </section>
      <DataTable
        rows={cashClosingsMock}
        rowKey={(r) => String(r.id)}
        columns={[
          { key: "date", label: "Fecha" },
          { key: "shift", label: "Turno" },
          { key: "cashier", label: "Responsable" },
          { key: "branch", label: "Sede" },
          {
            key: "countedCash",
            label: "Conteo real",
            render: (r) => formatCOP(Number(r.countedCash)),
          },
          {
            key: "acciones",
            label: "Acciones",
            render: () => (
              <button className="rounded border px-2 py-1">Ver detalle</button>
            ),
          },
        ]}
      />
    </div>
  );
}
