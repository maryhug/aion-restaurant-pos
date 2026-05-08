"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { aion } from "@/lib/aion/tokens";

type HistoryPeriod = "today" | "week" | "month";

type HistoryOrder = {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  tableLabel: string;
  customerName: string;
  itemsCount: number;
};

const periodOptions: { key: HistoryPeriod; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function StaffHistorialPage() {
  const [period, setPeriod] = useState<HistoryPeriod>("today");
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (nextPeriod: HistoryPeriod) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/orders/history?period=${nextPeriod}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "No se pudo cargar el historial");
      }

      const data = (await res.json()) as {
        summary: { totalOrders: number; totalSales: number };
        orders: HistoryOrder[];
      };
      setOrders(data.orders);
      setTotalOrders(data.summary.totalOrders);
      setTotalSales(data.summary.totalSales);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory(period);
  }, [fetchHistory, period]);

  const salesLabel = useMemo(
    () =>
      totalSales.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [totalSales],
  );

  return (
    <div className="mx-auto max-w-[1320px] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
        <p
          className="flex items-center gap-2 text-base font-extrabold"
          style={{ color: aion.colors.primary }}
        >
          AION <span className="font-medium text-stone-500">staff</span>
        </p>
        <nav className="flex items-center gap-5 text-xs font-semibold text-stone-600">
          <Link href="/aion/staff">Pedidos activos</Link>
          <span>Historial</span>
        </nav>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 rounded-2xl px-1 py-2">
        <div>
          <h1
            className="text-4xl font-black"
            style={{
              color: aion.colors.text,
              fontSize: "clamp(1.8rem,3vw,2.2rem)",
            }}
          >
            Historial de pedidos
          </h1>
          <p className="text-sm" style={{ color: aion.colors.muted }}>
            Consulta pedidos por periodo para revisar operacion y ventas.
          </p>
        </div>

        <Link
          href="/aion/staff"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-bold"
          style={{
            color: aion.colors.text,
            borderColor: `${aion.colors.primary}33`,
          }}
        >
          Volver a pedidos activos
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setPeriod(option.key)}
            className="rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-200"
            style={
              period === option.key
                ? {
                    color: "#fff",
                    background: aion.colors.primary,
                    borderColor: aion.colors.primary,
                  }
                : {
                    color: aion.colors.text,
                    background: "#fff",
                    borderColor: `${aion.colors.primary}33`,
                  }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <ul className="mb-4 grid list-none grid-cols-1 gap-3 sm:grid-cols-2">
        <li className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-black/5">
          <p
            className="text-sm font-semibold"
            style={{ color: aion.colors.muted }}
          >
            Pedidos en el periodo
          </p>
          <p
            className="text-3xl font-black leading-none"
            style={{ color: aion.colors.text }}
          >
            {totalOrders}
          </p>
        </li>
        <li className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-black/5">
          <p
            className="text-sm font-semibold"
            style={{ color: aion.colors.muted }}
          >
            Ventas del periodo
          </p>
          <p
            className="text-3xl font-black leading-none"
            style={{ color: aion.colors.text }}
          >
            {salesLabel}
          </p>
        </li>
      </ul>

      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Mesa</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-sm text-stone-500" colSpan={7}>
                  Cargando historial...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-stone-500" colSpan={7}>
                  No hay pedidos en este periodo.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-stone-100 text-sm"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-stone-700">
                    {order.code}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {new Date(order.createdAt).toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {order.tableLabel}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {order.itemsCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700">
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-800">
                    {order.total.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
