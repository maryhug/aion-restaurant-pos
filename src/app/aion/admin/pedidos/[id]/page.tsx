"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCOP } from "@/features/admin/helpers";
import {
  ChevronLeftIcon,
  ShoppingBagIcon,
  UsersIcon,
  BanknotesIcon,
  ReceiptIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@/features/admin/components/icons";

type OrderDetail = {
  id: string;
  fullId: string;
  date: string;
  paidAt: string | null;
  deliveredAt: string | null;
  table: string | null;
  status: string;
  orderType: string | null;
  notes: string | null;
  total: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  partySize: number | null;
  items: {
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  payment: {
    method: string;
    status: string;
    total: number;
    cashReceived: number | null;
    changeGiven: number | null;
    paidAt: string;
  } | null;
};

/* ─── Status helpers ─────────────────────────────────────────── */

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  delivered: "Entregado",
  ready: "Listo para servir",
  cancelled: "Cancelado",
  preparing: "En preparación",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  ready: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  preparing: "bg-purple-100 text-purple-700",
};
const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
  partial: "Pago parcial",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Section card ───────────────────────────────────────────── */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl [&>svg]:h-4 [&>svg]:w-4"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
            color: "var(--admin-primary,#581c22)",
          }}
        >
          {icon}
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/* ─── Info row ───────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-50 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-stone-400">{label}</span>
      <span className="text-right text-sm font-medium text-stone-800">
        {value}
      </span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<OrderDetail>;
      })
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-stone-100"
          />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertCircleIcon className="h-10 w-10 text-red-400" />
        <p className="font-medium text-stone-600">Pedido no encontrado</p>
        <button
          onClick={() => router.push("/aion/admin/pedidos")}
          className="text-sm text-[var(--admin-primary,#581c22)] hover:underline"
        >
          ← Volver a pedidos
        </button>
      </div>
    );
  }

  const statusCls = STATUS_BADGE[order.status] ?? "bg-stone-100 text-stone-600";

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          onClick={() => router.push("/aion/admin/pedidos")}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-white hover:text-stone-800"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Todos los pedidos
        </button>

        <span
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${statusCls}`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Hero card */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-white p-6 shadow-sm">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--admin-primary,#581c22) 12%, transparent)",
            color: "var(--admin-primary,#581c22)",
          }}
        >
          <ShoppingBagIcon className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
            Pedido
          </p>
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            #{order.id}
          </h1>
          <p className="mt-0.5 text-sm text-stone-500">{fmt(order.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            Total
          </p>
          <p className="text-3xl font-bold tabular-nums text-stone-900">
            {formatCOP(order.total)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Order info */}
        <Section icon={<ReceiptIcon />} title="Información del pedido">
          {order.table && <InfoRow label="Mesa" value={order.table} />}
          {order.orderType && (
            <InfoRow
              label="Tipo"
              value={
                <span className="capitalize">
                  {order.orderType.replace("_", " ")}
                </span>
              }
            />
          )}
          <InfoRow
            label="Estado"
            value={
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}
              >
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            }
          />
          <InfoRow label="Creado" value={fmt(order.date)} />
          {order.deliveredAt && (
            <InfoRow label="Entregado" value={fmt(order.deliveredAt)} />
          )}
          {order.notes && (
            <InfoRow
              label="Notas"
              value={
                <span className="max-w-xs text-right text-stone-600">
                  {order.notes}
                </span>
              }
            />
          )}
        </Section>

        {/* Customer info */}
        <Section icon={<UsersIcon />} title="Cliente">
          {order.customerName ? (
            <>
              <InfoRow label="Nombre" value={order.customerName} />
              {order.customerEmail && (
                <InfoRow label="Email" value={order.customerEmail} />
              )}
              {order.customerPhone && (
                <InfoRow label="Teléfono" value={order.customerPhone} />
              )}
              {order.partySize && (
                <InfoRow
                  label="Comensales"
                  value={`${order.partySize} persona${order.partySize > 1 ? "s" : ""}`}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <UsersIcon className="h-8 w-8 text-stone-200" />
              <p className="text-sm text-stone-400">
                Pedido sin cliente registrado
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* Order items */}
      <Section icon={<ShoppingBagIcon />} title="Ítems del pedido">
        {order.items.length === 0 ? (
          <p className="py-4 text-center text-sm text-stone-400">
            Sin ítems registrados
          </p>
        ) : (
          <div className="space-y-0">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 border-b border-stone-50 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-800">{item.name}</p>
                  {item.category && (
                    <p className="text-xs text-stone-400">{item.category}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <span className="text-stone-400">
                    {formatCOP(item.unitPrice)} × {item.quantity}
                  </span>
                  <span className="w-24 text-right font-semibold text-stone-800">
                    {formatCOP(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <span className="text-sm font-bold text-stone-600 uppercase tracking-wide">
                Total
              </span>
              <span className="text-xl font-bold tabular-nums text-stone-900">
                {formatCOP(order.total)}
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Payment */}
      <Section icon={<BanknotesIcon />} title="Pago">
        {order.payment ? (
          <>
            <InfoRow label="Método" value={order.payment.method} />
            <InfoRow
              label="Estado"
              value={
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    order.payment.status === "paid"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {order.payment.status === "paid" ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircleIcon className="h-3.5 w-3.5" />
                  )}
                  {PAYMENT_STATUS_LABEL[order.payment.status] ??
                    order.payment.status}
                </span>
              }
            />
            <InfoRow label="Monto" value={formatCOP(order.payment.total)} />
            {order.payment.cashReceived != null && (
              <InfoRow
                label="Recibido"
                value={formatCOP(order.payment.cashReceived)}
              />
            )}
            {order.payment.changeGiven != null && (
              <InfoRow
                label="Cambio"
                value={formatCOP(order.payment.changeGiven)}
              />
            )}
            <InfoRow label="Registrado" value={fmt(order.payment.paidAt)} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircleIcon className="h-8 w-8 text-amber-300" />
            <p className="text-sm text-stone-400">Pago aún no registrado</p>
          </div>
        )}
      </Section>
    </div>
  );
}
