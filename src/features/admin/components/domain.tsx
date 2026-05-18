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
  if (employees.length === 0) return null;
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
            color: "var(--admin-primary,#581c22)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
            />
          </svg>
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          Último pago registrado
        </h3>
      </div>
      <div className="space-y-2">
        {employees.map((e) => {
          const hasPay = !!e.lastPaymentAt;
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
                  color: "var(--admin-primary,#581c22)",
                }}
              >
                {e.name
                  .split(" ")
                  .map((w: string) => w[0] ?? "")
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-800">{e.name}</p>
                <p className="text-xs text-stone-400">{e.role ?? ""}</p>
              </div>
              <div className="shrink-0 text-right">
                {hasPay ? (
                  <>
                    <p className="text-xs font-medium text-stone-500">
                      Último pago
                    </p>
                    <p className="text-sm font-bold text-stone-800">
                      {e.lastPaymentAt}
                    </p>
                  </>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Sin pagos
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SettingsTabs({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}
