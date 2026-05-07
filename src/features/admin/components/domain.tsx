"use client";

import type { ReactNode } from "react";
import { formatCOP } from "@/features/admin/helpers";
import type {
  CashClosing,
  Employee,
  PiePoint,
  Reservation,
  TableItem,
  Tenant,
} from "@/features/admin/types";

export function CashClosingSummary({
  totalExpected,
  counted,
}: {
  totalExpected: number;
  counted: number;
}) {
  const diff = counted - totalExpected;
  const state = diff === 0 ? "Cuadrado" : diff > 0 ? "Sobrante" : "Faltante";
  const color =
    diff === 0
      ? "text-emerald-700"
      : diff > 0
        ? "text-blue-700"
        : "text-red-700";
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-sm text-stone-500">Total esperado</p>
      <p className="text-2xl font-black">{formatCOP(totalExpected)}</p>
      <p className="mt-2 text-sm text-stone-500">
        Conteo real: {formatCOP(counted)}
      </p>
      <p className={`text-sm font-bold ${color}`}>
        Resultado: {state} ({formatCOP(diff)})
      </p>
    </article>
  );
}

export function CashClosingForm({
  value,
  onChange,
}: {
  value: CashClosing;
  onChange: (next: CashClosing) => void;
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Conteo real</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          type="number"
          value={value.countedCash}
          onChange={(e) =>
            onChange({ ...value, countedCash: Number(e.target.value) })
          }
          className="rounded-xl border px-3 py-2"
          placeholder="Efectivo contado"
        />
        <input
          value={value.note ?? ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          className="rounded-xl border px-3 py-2"
          placeholder="Observaciones"
        />
      </div>
    </article>
  );
}

export function ExpenseChart({ points }: { points: PiePoint[] }) {
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Distribución de gastos</h3>
      <div className="mt-3 space-y-2">
        {points.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{p.label}</span>
              <span>{Math.round((p.value / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-100">
              <div
                className="h-2 rounded-full bg-[var(--admin-primary,#581c22)]"
                style={{ width: `${(p.value / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function TenantThemePreview({ tenant }: { tenant: Tenant }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Vista previa del tema</h3>
      <div className="mt-3 flex gap-2">
        <span
          className="h-8 flex-1 rounded"
          style={{ background: tenant.branding.primary }}
        />
        <span
          className="h-8 flex-1 rounded"
          style={{ background: tenant.branding.secondary }}
        />
        <span
          className="h-8 flex-1 rounded"
          style={{ background: tenant.branding.accent }}
        />
      </div>
    </article>
  );
}

export function TenantBrandingForm() {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Branding / Apariencia</h3>
      <p className="mt-1 text-sm text-stone-600">
        Placeholder conectado para persistir en `tenant_settings.branding`.
      </p>
    </article>
  );
}

export function RestaurantProfileForm() {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Perfil del restaurante</h3>
      <p className="mt-1 text-sm text-stone-600">
        Formulario preparado para nombre, logo, NIT, contacto y sedes.
      </p>
    </article>
  );
}

export function ReservationBoard({
  tables,
  reservations,
}: {
  tables: TableItem[];
  reservations: Reservation[];
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="font-bold">Mesas</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border p-2 text-center text-xs"
            >
              Mesa {t.number}
              <p className="font-semibold">{t.status}</p>
            </div>
          ))}
        </div>
      </article>
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="font-bold">Reservas próximas</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {reservations.map((r) => (
            <li key={r.id} className="rounded-lg border p-2">
              {r.customer} · {r.date} {r.time} · {r.table}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export function EmployeePaymentTable({ employees }: { employees: Employee[] }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-4">
      <h3 className="font-bold">Historial básico de pagos</h3>
      <ul className="mt-2 space-y-2">
        {employees.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between rounded-lg border p-2 text-sm"
          >
            <span>{e.name}</span>
            <span>{e.lastPaymentAt ?? "Sin pago registrado"}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SettingsTabs({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}
