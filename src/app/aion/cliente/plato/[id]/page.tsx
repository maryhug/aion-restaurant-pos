import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCOP } from "@/lib/aion/currency";
import { aion } from "@/lib/aion/tokens";
import { aionCategoryLabels } from "@/data/aion-dishes";
import { AionDishThumbnail } from "@/components/aion/ui/aion-dish-thumbnail";
import { AionDietaryBadge } from "@/components/aion/ui/badge";
import { AionDishAddButton } from "@/components/aion/client/dish-add-button";
import { IconClock } from "@/components/aion/icons";
import { fetchAionDishById } from "@/lib/aion/menu-items";

type Props = { params: Promise<{ id: string }> };

export default async function AionPlatoDetailPage({ params }: Props) {
  const { id } = await params;
  const dish = await fetchAionDishById(id);
  if (!dish) notFound();

  return (
    <div
      className="mx-auto max-w-lg pb-8"
      style={{ minHeight: "100dvh", background: aion.colors.pageBg }}
    >
      <header
        className="flex items-center justify-between border-b border-black/5 px-4 py-3"
        style={{ background: aion.colors.pageBg }}
      >
        <Link
          href="/aion/cliente/menu"
          className="text-sm font-medium"
          style={{ color: aion.colors.primary }}
        >
          ← Menú
        </Link>
        <p className="text-xs" style={{ color: aion.colors.muted }}>
          {aionCategoryLabels[dish.category]}
        </p>
      </header>
      <div className="p-4">
        <div className="mb-3 flex justify-center">
          <AionDishThumbnail
            className="h-32 w-32 text-xs rounded-2xl"
            label={dish.name}
          />
        </div>
        <h1
          className="text-2xl font-bold leading-tight"
          style={{ color: aion.colors.text }}
        >
          {dish.name}
        </h1>
        {dish.ingredientes ? (
          <div className="mt-3 space-y-2.5">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: aion.colors.primaryAlt }}
              >
                Ingredientes
              </p>
              <p
                className="mt-0.5 text-sm"
                style={{ color: aion.colors.muted }}
              >
                {dish.ingredientes}
              </p>
            </div>
            {dish.sabor && (
              <div className="flex flex-wrap gap-1.5">
                {dish.sabor.split(",").map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            )}
            {dish.perfil && (
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: aion.colors.primaryAlt }}
                >
                  Perfil
                </p>
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: aion.colors.muted }}
                >
                  {dish.perfil}
                </p>
              </div>
            )}
            {dish.recomendado_con && (
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: aion.colors.primaryAlt }}
                >
                  Ideal con
                </p>
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: aion.colors.muted }}
                >
                  {dish.recomendado_con}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: aion.colors.muted }}
          >
            {dish.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: aion.colors.muted }}
          >
            <IconClock className="text-stone-500" size={16} />
            {dish.prepMinutes} min
          </span>
          {dish.tags.map((t) => (
            <AionDietaryBadge key={t}>{t}</AionDietaryBadge>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p
            className="text-2xl font-extrabold"
            style={{ color: aion.colors.primary }}
          >
            {formatCOP(dish.price)}
          </p>
          <AionDishAddButton
            dishId={dish.id}
            dishName={dish.name}
            dishPrice={dish.price}
            available={dish.available}
            label={dish.name}
          />
        </div>
        {!dish.available ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-2 text-center text-sm text-amber-900">
            No disponible por ahora
          </p>
        ) : null}
        <p
          className="mt-4 text-center text-xs"
          style={{ color: aion.colors.muted }}
        >
          IVA incluido. Disponibilidad en tiempo real al confirmar.
        </p>
      </div>
    </div>
  );
}
