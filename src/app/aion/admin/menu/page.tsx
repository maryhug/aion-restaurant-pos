import Link from "next/link";
import { formatCOP } from "@/lib/aion/currency";
import { aion } from "@/lib/aion/tokens";
import { aionCategoryLabels } from "@/data/aion-dishes";
import { AionAdminSidebar } from "@/components/aion/admin/sidebar-nav";
import { AionDishThumbnail } from "@/components/aion/ui/aion-dish-thumbnail";
import { AionCategoryPillLabel } from "@/components/aion/ui/badge";
import { IconFilter, IconSearch } from "@/components/aion/icons";
import { AionMenuTableClient } from "@/components/aion/admin/menu-table-toggle";
import { fetchAionMenuDishes } from "@/lib/aion/menu-items";

export default async function AionAdminMenuPage() {
  const aionDishes = await fetchAionMenuDishes({ includeUnavailable: true });
  const total = aionDishes.length;
  const avail = aionDishes.filter((d) => d.available).length;
  return (
    <>
      <AionAdminSidebar current="menu" />
      <main
        className="min-w-0 flex-1 p-3 sm:p-4"
        style={{ background: aion.colors.pageBg, color: aion.colors.text }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: aion.colors.text }}>
              Gestión de menú
            </h1>
            <p className="text-sm" style={{ color: aion.colors.muted }}>
              Administra los platos de tu restaurante.
            </p>
          </div>
          <span
            className="mt-0 inline-flex rounded-2xl px-3 py-1.5 text-sm font-bold text-white"
            style={{ background: aion.colors.primary }}
            aria-disabled
          >+ Nuevo plato (demo)</span>
        </div>
        <div
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1 min-w-0">
            <IconSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              size={18}
            />
            <input
              className="w-full rounded-2xl border-0 py-2.5 pl-10 pr-2 text-sm ring-1 ring-black/10"
              placeholder="Buscar platos..."
              readOnly
              type="search"
            />
          </div>
          <div className="flex w-full min-w-0 sm:w-44 items-center justify-between gap-1 rounded-2xl bg-white px-2.5 py-1.5 ring-1 ring-black/10 sm:justify-end">
            <span className="pl-0.5 text-sm" style={{ color: aion.colors.muted }}>Todas</span>
            <IconFilter className="shrink-0" />
          </div>
        </div>
        <ul className="mt-3 list-none space-y-2 sm:grid sm:grid-cols-3 sm:space-y-0 sm:gap-2">
          <li className="flex flex-col rounded-2xl bg-white p-2 ring-1 ring-black/5 sm:p-2.5">
            <p className="text-xs" style={{ color: aion.colors.muted }}>Total de platos</p>
            <p
              className="text-2xl font-extrabold"
              style={{ color: aion.colors.text }}
            >{total}</p>
          </li>
          <li className="flex flex-col rounded-2xl bg-white p-2 ring-1 ring-black/5 sm:p-2.5">
            <p className="text-xs" style={{ color: aion.colors.muted }}>Disponibles</p>
            <p
              className="text-2xl font-extrabold"
              style={{ color: aion.colors.success }}
            >{avail}</p>
          </li>
          <li className="flex flex-col rounded-2xl bg-white p-2 ring-1 ring-black/5 sm:p-2.5">
            <p className="text-xs" style={{ color: aion.colors.muted }}>No disponibles</p>
            <p
              className="text-2xl font-extrabold"
              style={{ color: aion.colors.danger }}
            >{total - avail}</p>
          </li>
        </ul>
        <div
          className="mt-3 overflow-x-auto rounded-2xl bg-white p-0 ring-1 ring-black/5"
        >
          <table
            className="w-full min-w-[40rem] border-separate border-spacing-0 text-left text-sm"
            aria-label="Listado de platos"
          >
            <thead>
              <tr style={{ color: aion.colors.muted, fontSize: "0.7rem" }}>
                <th className="p-2 pl-3 sm:p-2.5">Plato</th>
                <th className="p-2">Categoría</th>
                <th className="p-2">Precio</th>
                <th className="p-2">Tiempo</th>
                <th className="p-2">Disponible</th>
                <th className="p-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {aionDishes.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-stone-100/90 last:border-0"
                >
                  <td className="p-2 pl-3 sm:p-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <AionDishThumbnail label={d.name} className="size-10 text-[9px] rounded-full" />
                      <div className="min-w-0">
                        <p className="min-w-0 break-words font-bold leading-tight">
                          {d.name}
                        </p>
                        <p
                          className="line-clamp-1 min-w-0 break-words text-xs"
                          style={{ color: aion.colors.muted }}
                        >{d.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <AionCategoryPillLabel>{aionCategoryLabels[d.category]}</AionCategoryPillLabel>
                  </td>
                  <td
                    className="whitespace-nowrap font-bold"
                    style={{ color: aion.colors.text }}
                  >{formatCOP(d.price)}</td>
                  <td className="whitespace-nowrap" style={{ color: aion.colors.muted }}>{d.prepMinutes} min</td>
                  <td>
                    <AionMenuTableClient id={d.id} initialOn={d.available} />
                  </td>
                  <td>
                    <div className="flex gap-1" aria-label="Acciones de fila">
                      <span className="inline-grid h-7 w-7 place-items-center rounded-lg text-stone-500 ring-1 ring-stone-200/80" title="Editar" aria-label="Editar (demo)">
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                        >
                          <rect x="4" y="4" width="16" height="12" />
                          <path d="M9 4v2h6" />
                        </svg>
                      </span>
                      <span className="inline-grid h-7 w-7 place-items-center rounded-lg text-red-500 ring-1 ring-stone-200/80" title="Eliminar" aria-label="Eliminar (demo)">
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                        >
                          <path d="M4 7h16" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M8 7V4h8v3" />
                          <rect x="6" y="8" width="12" height="10" />
                        </svg>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          className="mt-2 text-center text-xs"
          style={{ color: aion.colors.muted }}
        >Los toggles son solo UI local (demo), sin impacto en la base aún.{" "}
        <Link className="font-bold" style={{ color: aion.colors.primary }} href="/aion">Inicio AION</Link>
        </p>
      </main>
    </>
  );
}
