"use client";

import Link from "next/link";
import { formatCOP } from "@/lib/aion/currency";
import { useCazuelaBranding } from "@/lib/cazuela/branding-context";
import { useAionCart } from "@/components/aion/providers/cart-state";
import { AionDishThumbnail } from "@/components/aion/ui/aion-dish-thumbnail";

export default function CazuelaCarritoPage() {
  const t = useCazuelaBranding();
  const { items, setQty, subtotal, lineCount } = useAionCart();
  const empty = lineCount === 0;

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-lg flex-col"
      style={{ background: t.colors.pageBg }}
    >
      <header className="border-b border-black/5 px-4 py-3 text-center">
        <Link
          className="float-left text-sm font-medium"
          style={{ color: t.colors.primary }}
          href="/cazuela/cliente/menu"
        >
          ←
        </Link>
        <h1 className="text-base font-bold" style={{ color: t.colors.text }}>
          Preorden
        </h1>
      </header>

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-sm" style={{ color: t.colors.muted }}>
            Tu carrito está vacío.
          </p>
          <Link
            href="/cazuela/cliente/menu"
            className="rounded-2xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: t.colors.primary }}
          >
            Ver menú
          </Link>
        </div>
      ) : (
        <ul className="flex-1 list-none space-y-3 p-4">
          {items.map((line) => {
            const unit = line.unitPrice;
            return (
              <li
                key={line.dishId}
                className="flex gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-black/[0.04]"
              >
                <AionDishThumbnail
                  label={line.name}
                  category={line.category}
                  bgColor={t.colors.tagBg}
                  textColor={t.colors.primary}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {line.name}
                  </p>
                  <p className="text-xs" style={{ color: t.colors.muted }}>
                    {formatCOP(unit)} c/u
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg border border-stone-200 text-sm"
                      onClick={() => setQty(line.dishId, line.quantity - 1)}
                      aria-label="Menos"
                    >
                      –
                    </button>
                    <span className="min-w-6 text-center text-sm font-bold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg text-sm text-white"
                      style={{ background: t.colors.primary }}
                      onClick={() => setQty(line.dishId, line.quantity + 1)}
                      aria-label="Más"
                    >
                      +
                    </button>
                    <span
                      className="ml-auto text-sm font-bold"
                      style={{ color: t.colors.primary }}
                    >
                      {formatCOP(unit * line.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!empty ? (
        <div
          className="border-t border-stone-200/80 p-4"
          style={{ background: t.colors.pageBg }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: t.colors.muted }}>Subtotal (demo)</span>
            <span
              className="text-lg font-extrabold"
              style={{ color: t.colors.primary }}
            >
              {formatCOP(subtotal)}
            </span>
          </div>
          <Link
            className="mt-3 block w-full rounded-2xl py-3 text-center text-sm font-bold text-white"
            style={{ background: t.colors.primary }}
            href="/cazuela/cliente/reserva-hora"
          >
            Elegir fecha y hora
          </Link>
          <p
            className="mt-2 text-center text-[11px]"
            style={{ color: t.colors.muted }}
          >
            Luego confirmarás la reserva con tu contacto. Sin cargo hasta que
            llegues.
          </p>
        </div>
      ) : null}
    </div>
  );
}
