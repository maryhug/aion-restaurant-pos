"use client";

import { DataTable } from "@/features/admin/components/data-table";
import { EmployeePaymentTable } from "@/features/admin/components/domain";
import { StatsCard } from "@/features/admin/components/stats-card";
import { employeesMock } from "@/features/admin/mocks";
import { formatCOP } from "@/features/admin/helpers";

export default function AdminEmployeesPage() {
  const payroll = employeesMock.reduce((s, e) => s + e.salary, 0);
  const active = employeesMock.filter((e) => e.status === "activo").length;
  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total empleados"
          value={String(employeesMock.length)}
        />
        <StatsCard title="Nómina estimada del mes" value={formatCOP(payroll)} />
        <StatsCard title="Empleados activos" value={String(active)} />
        <StatsCard title="Próximos pagos" value="2 esta semana" />
      </section>
      <DataTable
        rows={employeesMock}
        rowKey={(r) => String(r.id)}
        columns={[
          { key: "name", label: "Nombre" },
          { key: "document", label: "Documento" },
          { key: "role", label: "Cargo" },
          { key: "contractType", label: "Tipo contrato" },
          {
            key: "salary",
            label: "Salario",
            render: (r) => formatCOP(Number(r.salary)),
          },
          { key: "status", label: "Estado" },
          { key: "joinedAt", label: "Fecha ingreso" },
          { key: "lastPaymentAt", label: "Último pago" },
          {
            key: "acciones",
            label: "Acciones",
            render: () => (
              <button className="rounded border px-2 py-1">Marcar pago</button>
            ),
          },
        ]}
      />
      <EmployeePaymentTable employees={employeesMock} />
    </div>
  );
}
