import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCOP } from "@/lib/aion/currency";
import { aionCategoryLabels } from "@/data/aion-dishes";
import { AionDietaryBadge } from "@/components/aion/ui/badge";
import { AionDishAddButton } from "@/components/aion/client/dish-add-button";
import { IconClock } from "@/components/aion/icons";
import { fetchAionDishById } from "@/lib/aion/menu-items";
import { getCazuelaBrandingTokens } from "@/lib/cazuela/branding";
import { categoryEmoji } from "@/lib/aion/category-emoji";
import Image from "next/image";

type Props = { params: Promise<{ id: string }> };

export default async function CazuelaPlatoDetailPage({ params }: Props) {
  const [{ id }, t] = await Promise.all([params, getCazuelaBrandingTokens()]);
  const dish = await fetchAionDishById(id);
  if (!dish) notFound();

  return (
    <div
      className="mx-auto max-w-lg pb-8"
      style={{ minHeight: "100dvh", background: t.colors.pageBg }}
    >
      <header
        className="flex items-center justify-between border-b border-black/5 px-4 py-3"
        style={{ background: t.colors.pageBg }}
      >
        <Link
          href="/cazuela/cliente/menu"
          className="text-sm font-medium"
          style={{ color: t.colors.primary }}
        >
          ← Menú
        </Link>
        <p className="text-xs" style={{ color: t.colors.muted }}>
          {aionCategoryLabels[dish.category] ?? dish.category}
        </p>
      </header>

      <div className="p-4">
        <div className="mb-4 overflow-hidden rounded-2xl">
          {dish.imageHint ? (
            <div className="relative h-52 w-full">
              <Image
                src={dish.imageHint}
                alt={dish.name}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="flex h-52 w-full flex-col items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${t.colors.tagBg}, ${t.colors.pageBgAlt})`,
              }}
            >
              <span className="text-6xl leading-none" role="img" aria-hidden>
                {categoryEmoji(dish.category)}
              </span>
              <span
                className="px-6 text-center text-base font-extrabold"
                style={{ color: t.colors.primary }}
              >
                {dish.name}
              </span>
            </div>
          )}
        </div>

        <h1
          className="text-2xl font-bold leading-tight"
          style={{ color: t.colors.text }}
        >
          {dish.name}
        </h1>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: t.colors.muted }}
        >
          {dish.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: t.colors.muted }}
          >
            <IconClock className="text-stone-500" size={16} />
            {dish.prepMinutes} min
          </span>
          {dish.tags.map((tag) => (
            <AionDietaryBadge key={tag}>{tag}</AionDietaryBadge>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p
            className="text-2xl font-extrabold"
            style={{ color: t.colors.primary }}
          >
            {formatCOP(dish.price)}
          </p>
          <AionDishAddButton
            dishId={dish.id}
            dishName={dish.name}
            dishPrice={dish.price}
            dishCategory={dish.category}
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
          style={{ color: t.colors.muted }}
        >
          IVA incluido. Disponibilidad en tiempo real al confirmar.
        </p>
      </div>
    </div>
  );
}
