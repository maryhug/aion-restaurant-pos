"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CashClosingSummary } from "@/features/admin/components/domain";
import { Modal, inputCls } from "@/features/admin/components/modal";
import { formatCOP } from "@/features/admin/helpers";
import { useAdminTenant } from "@/features/admin/tenant-context";
import type { CashClosing } from "@/features/admin/types";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ReceiptIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/features/admin/components/icons";

type CierreData = {
  current: CashClosing | null;
  closings: CashClosing[];
};

type ClosingForm = {
  fecha: string;
  turno: string;
  responsable: string;
  sede: string;
  countedCash: string;
  note: string;
};

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-sm font-medium text-stone-800">{value}</p>
    </div>
  );
}

/* ─── Sales summary row ─────────────────────────────────────── */

function SaleRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "red" | "blue";
}) {
  const textCls =
    accent === "green"
      ? "text-emerald-700 font-bold"
      : accent === "red"
        ? "text-red-600 font-bold"
        : accent === "blue"
          ? "font-bold text-stone-900"
          : "text-stone-700";
  return (
    <div className="flex items-center justify-between border-b border-stone-50 py-2 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className={`text-sm tabular-nums ${textCls}`}>
        {formatCOP(value)}
      </span>
    </div>
  );
}

/* ─── Closing history card ───────────────────────────────────── */

function ClosingCard({
  closing,
  onDetail,
}: {
  closing: CashClosing;
  onDetail: (c: CashClosing) => void;
}) {
  const expected =
    closing.baseFund +
    closing.cashSales +
    closing.otherIncome -
    closing.withdrawals -
    closing.cashExpenses;
  const diff = closing.countedCash - expected;
  const isOver = diff >= 0;

  return (
    <article className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
          color: "var(--admin-primary,#581c22)",
        }}
      >
        <ReceiptIcon />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-stone-900">
            {closing.date}
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold capitalize text-stone-600">
            {closing.shift}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="h-3 w-3 text-stone-300" />
            {closing.openTime} – {closing.closeTime}
          </span>
          {closing.cashier && <span>{closing.cashier}</span>}
          {closing.branch && <span>{closing.branch}</span>}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-stone-400">Conteo real</p>
        <p className="text-sm font-bold tabular-nums text-stone-900">
          {formatCOP(closing.countedCash)}
        </p>
        <p
          className={`text-xs font-semibold ${isOver ? "text-emerald-600" : "text-red-600"}`}
        >
          {isOver ? "+" : ""}
          {formatCOP(diff)}
        </p>
      </div>

      <button
        onClick={() => onDetail(closing)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary,#581c22)] text-white transition-opacity hover:opacity-80"
      >
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminCashClosingPage() {
  const { branchId, tenant } = useAdminTenant();
  const [data, setData] = useState<CierreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CashClosing | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const activeBranch = tenant.branches.find((b) => b.id === branchId);

  const [form, setForm] = useState<ClosingForm>({
    fecha: today,
    turno: new Date().getHours() < 15 ? "Mañana" : "Noche",
    responsable: "",
    sede: activeBranch?.name ?? "-",
    countedCash: "0",
    note: "",
  });

  const reload = useCallback(() => {
    fetch("/api/admin/cierre-caja")
      .then((r) => {
        if (!r.ok) throw new Error("Error");
        return r.json();
      })
      .then((d: CierreData) => {
        setData(d);
        if (d.current) {
          setForm({
            fecha: d.current.date,
            turno: d.current.shift,
            responsable: d.current.cashier,
            sede: d.current.branch,
            countedCash: String(d.current.countedCash),
            note: d.current.note ?? "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const totalExpected = useMemo(() => {
    if (!data?.current) return 0;
    const c = data.current;
    return (
      c.baseFund + c.cashSales + c.otherIncome - c.withdrawals - c.cashExpenses
    );
  }, [data]);

  const totalSales = useMemo(() => {
    if (!data?.current) return 0;
    const c = data.current;
    return c.cashSales + c.cardSales + c.transferSales;
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/cierre-caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          countedCash: Number(form.countedCash),
          branchId,
        }),
      });
      if (!r.ok)
        throw new Error((await r.json().catch(() => ({}))).error ?? "Error");
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  const current = data?.current ?? null;
  const closings = data?.closings ?? [];
  const diff = Number(form.countedCash || 0) - totalExpected;

  return (
    <div className="space-y-4">
      {/* Active shift totals — shown only when shift is open */}
      {current && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total ventas",
              value: totalSales,
              icon: <TrendingUpIcon />,
              accent: true,
            },
            {
              label: "Efectivo",
              value: current.cashSales,
              icon: <BanknotesIcon />,
            },
            {
              label: "Tarjeta / Transf.",
              value: current.cardSales + current.transferSales,
              icon: <TrendingUpIcon />,
            },
            {
              label: "Gastos caja",
              value: current.cashExpenses,
              icon: <AlertTriangleIcon />,
            },
          ].map((s) => (
            <article
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4"
                style={{
                  backgroundColor: s.accent
                    ? "color-mix(in srgb, #16a34a 12%, transparent)"
                    : "color-mix(in srgb, var(--admin-primary,#581c22) 10%, transparent)",
                  color: s.accent ? "#16a34a" : "var(--admin-primary,#581c22)",
                }}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-stone-400">
                  {s.label}
                </p>
                <p className="truncate text-sm font-bold text-stone-900">
                  {formatCOP(s.value)}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Close form — takes 3/5 columns, big and clear */}
        <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
          <div className="mb-5 flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
                color: "var(--admin-primary,#581c22)",
              }}
            >
              <ReceiptIcon />
            </span>
            <h2 className="text-base font-bold text-stone-800">
              {current
                ? "Registrar cierre de turno"
                : "Registrar cierre manual"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Fecha
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Turno
                </label>
                <select
                  className={inputCls}
                  value={form.turno}
                  onChange={(e) => setForm({ ...form, turno: e.target.value })}
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                  <option value="Completo">Completo</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Responsable
                </label>
                <input
                  className={inputCls}
                  value={form.responsable}
                  onChange={(e) =>
                    setForm({ ...form, responsable: e.target.value })
                  }
                  placeholder="Nombre del cajero"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Sede
                </label>
                <input
                  className={inputCls}
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                />
              </div>
            </div>

            {/* Conteo real — hero field */}
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--admin-primary,#581c22) 6%, transparent)",
              }}
            >
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Conteo real de efectivo *
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-xl font-bold tabular-nums text-stone-900 outline-none focus:border-[var(--admin-primary,#581c22)] focus:ring-1 focus:ring-[var(--admin-primary,#581c22)]"
                value={form.countedCash}
                onChange={(e) =>
                  setForm({ ...form, countedCash: e.target.value })
                }
                placeholder="0"
              />
              {current && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-stone-500">
                    Esperado:{" "}
                    <span className="font-semibold text-stone-800">
                      {formatCOP(totalExpected)}
                    </span>
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
                      diff >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {diff >= 0 ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <AlertTriangleIcon className="h-4 w-4" />
                    )}
                    {diff >= 0 ? "+" : ""}
                    {formatCOP(diff)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Observaciones
              </label>
              <input
                className={inputCls}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Notas del cierre (opcional)"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-[var(--admin-primary,#581c22)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Cerrar caja"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
              >
                Descargar reporte
              </button>
            </div>
          </form>
        </section>

        {/* Right column: shift summary + summary widget */}
        <div className="space-y-4 lg:col-span-2">
          {current && (
            <>
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
                      color: "var(--admin-primary,#581c22)",
                    }}
                  >
                    <BanknotesIcon />
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                    Resumen del turno
                  </h3>
                </div>
                <SaleRow label="Fondo inicial" value={current.baseFund} />
                <SaleRow
                  label="Ventas efectivo"
                  value={current.cashSales}
                  accent="green"
                />
                <SaleRow label="Ventas tarjeta" value={current.cardSales} />
                <SaleRow label="Transferencias" value={current.transferSales} />
                <SaleRow label="Otros ingresos" value={current.otherIncome} />
                <SaleRow
                  label="Retiros"
                  value={current.withdrawals}
                  accent="red"
                />
                <SaleRow
                  label="Gastos caja"
                  value={current.cashExpenses}
                  accent="red"
                />
                <SaleRow
                  label="Total esperado en caja"
                  value={totalExpected}
                  accent="blue"
                />
              </section>
              <CashClosingSummary
                totalExpected={totalExpected}
                counted={Number(form.countedCash) || 0}
              />
            </>
          )}
        </div>
      </div>

      {/* History */}
      {closings.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-stone-400">
            Historial de cierres
          </h3>
          {closings.map((c) => (
            <ClosingCard key={c.id} closing={c} onDetail={setDetail} />
          ))}
        </section>
      )}

      {/* Detail modal */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Detalle del cierre"
        wide
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoField label="Fecha" value={detail.date} />
              <InfoField label="Turno" value={detail.shift} />
              <InfoField label="Responsable" value={detail.cashier} />
              <InfoField label="Sede" value={detail.branch} />
              <InfoField label="Apertura" value={detail.openTime} />
              <InfoField label="Cierre" value={detail.closeTime} />
            </div>
            <hr className="border-stone-100" />
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                label="Fondo inicial"
                value={formatCOP(detail.baseFund)}
              />
              <InfoField
                label="Ventas efectivo"
                value={formatCOP(detail.cashSales)}
              />
              <InfoField
                label="Ventas tarjeta"
                value={formatCOP(detail.cardSales)}
              />
              <InfoField
                label="Transferencias"
                value={formatCOP(detail.transferSales)}
              />
              <InfoField
                label="Otros ingresos"
                value={formatCOP(detail.otherIncome)}
              />
              <InfoField
                label="Retiros"
                value={formatCOP(detail.withdrawals)}
              />
              <InfoField
                label="Gastos caja"
                value={formatCOP(detail.cashExpenses)}
              />
            </div>
            <hr className="border-stone-100" />
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                label="Conteo real"
                value={formatCOP(detail.countedCash)}
              />
              <InfoField
                label="Diferencia"
                value={formatCOP(
                  detail.countedCash -
                    (detail.baseFund +
                      detail.cashSales +
                      detail.otherIncome -
                      detail.withdrawals -
                      detail.cashExpenses),
                )}
              />
            </div>
            {detail.note && (
              <div>
                <p className="text-xs text-stone-500">Observaciones</p>
                <p className="mt-1 text-stone-700">{detail.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
