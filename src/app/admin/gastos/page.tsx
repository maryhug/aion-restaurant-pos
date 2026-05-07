"use client";

import { DataTable } from "@/features/admin/components/data-table";
import { ExpenseChart } from "@/features/admin/components/domain";
import { FilterBar } from "@/features/admin/components/filter-bar";
import { StatsCard } from "@/features/admin/components/stats-card";
import { expensesMock } from "@/features/admin/mocks";
import { formatCOP } from "@/features/admin/helpers";

export default function AdminExpensesPage() {
  const total = expensesMock.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Gasto total del periodo" value={formatCOP(total)} />
        <StatsCard title="Categoría con más gasto" value="Mantenimiento" />
        <StatsCard
          title="Gasto promedio"
          value={formatCOP(total / expensesMock.length)}
        />
        <StatsCard
          title="Último gasto registrado"
          value={expensesMock[0]?.description ?? "-"}
        />
      </section>
      <FilterBar>
        <input
          type="date"
          className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm"
        />
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Categoría</option>
        </select>
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Responsable</option>
        </select>
        <select className="rounded-xl border border-[var(--admin-border,#f1cfd4)] px-3 py-2 text-sm">
          <option>Estado</option>
        </select>
      </FilterBar>
      <section className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            rows={expensesMock}
            rowKey={(r) => String(r.id)}
            columns={[
              { key: "description", label: "Descripción" },
              { key: "category", label: "Categoría" },
              {
                key: "amount",
                label: "Monto",
                render: (r) => formatCOP(Number(r.amount)),
              },
              { key: "date", label: "Fecha" },
              { key: "paymentMethod", label: "Método" },
              { key: "responsible", label: "Responsable" },
              { key: "status", label: "Estado" },
              { key: "note", label: "Observación" },
            ]}
          />
        </div>
        <ExpenseChart
          points={[
            { label: "Insumos", value: 420000 },
            { label: "Mantenimiento", value: 780000 },
            { label: "Marketing", value: 300000 },
          ]}
        />
      </section>
    </div>
  );
}
