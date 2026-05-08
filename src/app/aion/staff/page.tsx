"use client";

import { useState, useEffect, useCallback } from "react";
import { aion } from "@/lib/aion/tokens";
import type { OrderStatus } from "@/types/database";
import { useLanguage } from "@/lib/aion/language-context";

type StaffOrder = {
  id: string;
  status: OrderStatus;
  code: string;
  customerName: string;
  table: string;
  createdAt: string;
  isNew: boolean;
  urgent: boolean;
  items: { id: string; name: string; quantity: number }[];
};

function minutesAgo(createdAt: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
}

export default function AionStaffDashboardPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<OrderStatus | null>(null);
  const [nowLabel, setNowLabel] = useState("");

  useEffect(() => {
    setNowLabel(
      new Date().toLocaleString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/orders");
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed loading orders");
      }
      const data = (await res.json()) as {
        orders: {
          id: string;
          state: "pendiente" | "preparando" | "listo";
          tableLabel: string;
          waitLabel: string;
          urgent?: boolean;
          items: { dishId: string; name: string; quantity: number }[];
        }[];
      };

      const mapped: StaffOrder[] = data.orders.map((o, idx) => {
        const statusMap: Record<typeof o.state, OrderStatus> = {
          pendiente: "pending",
          preparando: "preparing",
          listo: "ready",
        };
        const elapsedMin = Number(o.waitLabel.replace(/\D/g, "")) || 0;
        return {
          id: o.id,
          code: `ORD-${String(idx + 1).padStart(3, "0")}`,
          customerName: o.customerName || "Cliente",
          status: statusMap[o.state],
          table: o.tableLabel,
          createdAt: new Date(Date.now() - elapsedMin * 60000).toISOString(),
          isNew: statusMap[o.state] === "pending" && elapsedMin < 2,
          urgent: Boolean(o.urgent),
          items: o.items.map((item) => ({
            id: item.dishId,
            name: item.name,
            quantity: item.quantity,
          })),
        };
      });

      setOrders(mapped);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function moveOrder(id: string, target: OrderStatus) {
    const current = orders.find((o) => o.id === id);
    if (!current || current.status === target) return;

    const previous = orders;
    setOrders((list) =>
      list.map((o) =>
        o.id === id ? { ...o, status: target, isNew: false } : o,
      ),
    );

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!res.ok) {
        setOrders(previous);
      } else if (target === "delivered") {
        setOrders((list) => list.filter((o) => o.id !== id));
      }
    } catch {
      setOrders(previous);
    }
  }

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const urgentCount = orders.filter((o) => o.urgent).length;

  return (
    <div className="mx-auto max-w-[1320px] p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
        <p
          className="flex items-center gap-2 text-base font-extrabold"
          style={{ color: aion.colors.primary }}
        >
          <span
            className="grid size-8 place-items-center rounded-xl text-white"
            style={{ background: aion.colors.primary }}
          >
            ⌂
          </span>
          AION <span className="font-medium text-stone-500">staff</span>
        </p>
        <nav className="flex items-center gap-5 text-xs font-semibold text-stone-600">
          <span>◻ Dashboard</span>
          <span>◫ Pedidos</span>
          <span>⌂ Inicio</span>
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
            Dashboard de Pedidos
          </h1>
          <p
            className="text-sm capitalize"
            style={{ color: aion.colors.muted }}
          >
            {nowLabel || " "}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white"
          style={{ background: aion.colors.primary }}
        >
          Ver todos los pedidos
        </button>
      </div>

      <ul className="mb-4 grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard emoji="🕐" value={pending.length} label={t("pending")} />
        <KpiCard emoji="📦" value={preparing.length} label={t("preparing")} />
        <KpiCard emoji="✅" value={ready.length} label={t("ready")} />
        <KpiCard emoji="⚠️" value={urgentCount} label={t("urgents")} danger />
      </ul>

      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error} —{" "}
          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="font-bold underline"
          >
            {t("retry")}
          </button>
        </p>
      )}

      {loading ? (
        <p
          className="mt-10 text-center text-sm"
          style={{ color: aion.colors.muted }}
        >
          Loading...
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <Column
            title={`${t("pending")} (${pending.length})`}
            status="pending"
            list={pending}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDragStart={setDraggingId}
            onDropToStatus={moveOrder}
            setDropTarget={setDropTarget}
            actionLabel={t("toPreparing")}
          />
          <Column
            title={`${t("preparing")} (${preparing.length})`}
            status="preparing"
            list={preparing}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDragStart={setDraggingId}
            onDropToStatus={moveOrder}
            setDropTarget={setDropTarget}
            actionLabel={t("toReady")}
          />
          <Column
            title={`${t("ready")} (${ready.length})`}
            status="ready"
            list={ready}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onDragStart={setDraggingId}
            onDropToStatus={moveOrder}
            setDropTarget={setDropTarget}
            actionLabel={t("toDelivered")}
          />
        </div>
      )}
    </div>
  );
}

type ColProps = {
  title: string;
  status: OrderStatus;
  list: StaffOrder[];
  draggingId: string | null;
  dropTarget: OrderStatus | null;
  onDragStart: (id: string | null) => void;
  onDropToStatus: (id: string, status: OrderStatus) => void;
  setDropTarget: (status: OrderStatus | null) => void;
  actionLabel: string;
};

function Column({
  title,
  status,
  list,
  draggingId,
  dropTarget,
  onDragStart,
  onDropToStatus,
  setDropTarget,
  actionLabel,
}: ColProps) {
  const { t } = useLanguage();
  return (
    <section
      className="w-full rounded-3xl bg-[#ece9e3] p-2 shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out"
      onDragOver={(e) => {
        e.preventDefault();
        setDropTarget(status);
      }}
      onDragLeave={() => setDropTarget(null)}
      onDrop={(e) => {
        e.preventDefault();
        if (draggingId) onDropToStatus(draggingId, status);
        onDragStart(null);
        setDropTarget(null);
      }}
      style={
        dropTarget === status && draggingId
          ? { boxShadow: `0 0 0 2px ${aion.colors.primary}55` }
          : undefined
      }
    >
      <h2
        className="mb-2 px-1 text-lg font-extrabold"
        style={{ color: aion.colors.text }}
      >
        <span
          className="mr-1.5 inline-block size-2.5 rounded-full"
          style={{
            background:
              status === "pending"
                ? "#eab308"
                : status === "preparing"
                  ? "#3b82f6"
                  : "#22c55e",
          }}
        />
        {title}
      </h2>
      <ul className="flex list-none flex-col gap-2">
        {list.map((order) => (
          <li
            key={order.id}
            draggable
            onDragStart={() => onDragStart(order.id)}
            onDragEnd={() => {
              onDragStart(null);
              setDropTarget(null);
            }}
            className="rounded-2xl border border-stone-200/70 bg-white p-3 shadow-sm transition-all duration-300 ease-in-out"
            style={
              status === "preparing"
                ? { borderColor: `${aion.colors.danger}66` }
                : undefined
            }
          >
            <div className="flex items-start justify-between text-xs">
              <span className="font-mono text-[11px] font-bold">
                {order.code}
              </span>
              <span
                className="font-semibold"
                style={{ color: aion.colors.muted }}
              >
                {order.table}
              </span>
            </div>
            <p className="mt-1 text-base font-bold text-stone-800">
              {order.customerName}
            </p>
            {order.isNew || order.urgent ? (
              <span className="mt-1 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                URGENTE
              </span>
            ) : null}
            <p
              className="mt-1 text-right text-[11px] font-semibold"
              style={{ color: aion.colors.muted }}
            >
              Llega en {minutesAgo(order.createdAt)}m
            </p>
            <ul
              className="mt-1 list-inside list-disc text-xs"
              style={{ color: aion.colors.muted }}
            >
              {order.items.map((item) => (
                <li key={`${item.id}-${order.id}`}>
                  {item.quantity}x {item.name}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 w-full rounded-xl py-2 text-sm font-bold transition-all duration-300 ease-in-out"
              onClick={() =>
                onDropToStatus(
                  order.id,
                  status === "pending"
                    ? "preparing"
                    : status === "preparing"
                      ? "ready"
                      : "delivered",
                )
              }
              style={
                status === "preparing"
                  ? { background: aion.colors.primary, color: "#fff" }
                  : { background: "#ecebe8", color: aion.colors.text }
              }
            >
              {actionLabel}
            </button>
          </li>
        ))}
        {list.length === 0 ? (
          <li
            className="p-2 text-center text-sm"
            style={{ color: aion.colors.muted }}
          >
            {t("noOrders")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function KpiCard({
  emoji,
  value,
  label,
  danger = false,
}: {
  emoji: string;
  value: number;
  label: string;
  danger?: boolean;
}) {
  return (
    <li
      className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-black/5"
      style={
        danger
          ? {
              border: `1px solid ${aion.colors.danger}66`,
              background: "#fef3f3",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <span
          className="grid size-8 place-items-center rounded-xl text-base"
          style={{ background: danger ? "#FDE2E2" : "#F0EEEA" }}
        >
          {emoji}
        </span>
        <div>
          <p
            className="text-3xl font-black leading-none"
            style={{ color: aion.colors.text }}
          >
            {value}
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: aion.colors.muted }}
          >
            {label}
          </p>
        </div>
      </div>
    </li>
  );
}
