"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CashClosingSummary } from "@/features/admin/components/domain";
import { DataTable } from "@/features/admin/components/data-table";
import { Modal, inputCls } from "@/features/admin/components/modal";
import { formatCOP } from "@/features/admin/helpers";
import { useAdminTenant } from "@/features/admin/tenant-context";
import type { CashClosing } from "@/features/admin/types";

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
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        Cargando cierre de caja…
      </div>
    );
  }

  const current = data?.current ?? null;
  const closings = data?.closings ?? [];

  return (
    <div className="space-y-3">
      <section className="grid gap-3 lg:grid-cols-2">
        {current && (
          <article className="rounded-2xl border border-black/5 bg-white p-4">
            <h3 className="font-bold">Turno activo</h3>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <p>Fecha: {current.date}</p>
              <p>Turno: {current.shift}</p>
              <p>Cajero: {current.cashier}</p>
              <p>Sede: {current.branch}</p>
              <p>Apertura: {current.openTime}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p>Fondo inicial: {formatCOP(current.baseFund)}</p>
              <p>Ventas efectivo: {formatCOP(current.cashSales)}</p>
              <p>Ventas tarjeta: {formatCOP(current.cardSales)}</p>
              <p>Transferencias: {formatCOP(current.transferSales)}</p>
              <p>Otros ingresos: {formatCOP(current.otherIncome)}</p>
              <p>Retiros: {formatCOP(current.withdrawals)}</p>
              <p>Gastos caja: {formatCOP(current.cashExpenses)}</p>
            </div>
          </article>
        )}

        <div className="space-y-3">
          {current && (
            <CashClosingSummary
              totalExpected={totalExpected}
              counted={Number(form.countedCash) || 0}
            />
          )}

          <article className="rounded-2xl border border-black/5 bg-white p-4">
            <h3 className="mb-3 font-bold">
              {current ? "Registrar cierre" : "Registrar cierre manual"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Turno
                  </label>
                  <select
                    className={inputCls}
                    value={form.turno}
                    onChange={(e) =>
                      setForm({ ...form, turno: e.target.value })
                    }
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                    <option value="Completo">Completo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
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
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Sede
                  </label>
                  <input
                    className={inputCls}
                    value={form.sede}
                    onChange={(e) => setForm({ ...form, sede: e.target.value })}
                    placeholder="Sede"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Conteo real *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    required
                    value={form.countedCash}
                    onChange={(e) =>
                      setForm({ ...form, countedCash: e.target.value })
                    }
                    placeholder="Efectivo contado"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Observaciones
                  </label>
                  <input
                    className={inputCls}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Notas del cierre"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[var(--admin-primary,#581c22)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Cerrar caja"}
                </button>
                <button
                  type="button"
                  className="rounded-xl border px-3 py-2 text-sm font-semibold"
                >
                  Descargar reporte
                </button>
              </div>
            </form>
          </article>
        </div>
      </section>

      {closings.length > 0 && (
        <DataTable
          rows={closings}
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
              render: (r) => (
                <button
                  onClick={() => setDetail(r as unknown as CashClosing)}
                  className="rounded border px-2 py-1 text-xs hover:bg-stone-50"
                >
                  Ver detalle
                </button>
              ),
            },
          ]}
        />
      )}

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
