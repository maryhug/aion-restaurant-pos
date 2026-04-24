import { aion } from "@/lib/aion/tokens";
import { formatCOP } from "@/lib/aion/currency";
import { AionAdminSidebar } from "@/components/aion/admin/sidebar-nav";

const week = [
  { d: "Lun", h: 1800 },
  { d: "Mar", h: 1400 },
  { d: "Mie", h: 1900 },
  { d: "Jue", h: 1500 },
  { d: "Vie", h: 1400 },
  { d: "Sab", h: 2200 },
  { d: "Dom", h: 1300 },
];
const maxH = 3200;

const top: { name: string; n: string; rev: string }[] = [
  { name: "Risotto de Hongos", n: "59", rev: formatCOP(1416000) },
  { name: "Limonada Natural", n: "48", rev: formatCOP(144000) },
  { name: "Bruschetta Mediterránea", n: "42", rev: formatCOP(504000) },
  { name: "Ensalada César", n: "38", rev: formatCOP(532000) },
  { name: "Vino Tinto de la Casa", n: "33", rev: formatCOP(165000) },
];

export default function AionAdminDashboardPage() {
  return (
    <>
      <AionAdminSidebar current="dashboard" />
      <main className="min-w-0 flex-1 p-3 sm:p-4">
        <h1
          className="text-2xl font-extrabold"
          style={{ color: aion.colors.text }}
        >
          Panel de ventas
        </h1>
        <p className="text-sm" style={{ color: aion.colors.muted }}>
          Vista demo — conecta KPIs reales desde el módulo Admin
        </p>
        <div className="mt-3 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Ventas totales",
              v: formatCOP(15660000),
              d: "+12.5%",
              u: true,
            },
            { t: "Pedidos", v: "35", d: "+8.2%", u: true },
            { t: "Ticket promedio", v: formatCOP(447430), d: "+3.1%", u: true },
            { t: "Clientes", v: "28", d: "−2.4%", u: false },
          ].map((k) => (
            <li
              key={k.t}
              className="flex flex-1 items-center justify-between gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5"
            >
              <div>
                <p className="text-xs" style={{ color: aion.colors.muted }}>{k.t}</p>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: aion.colors.text }}
                >{k.v}</p>
                <p
                  className="text-sm font-bold"
                  style={{ color: k.u ? aion.colors.success : aion.colors.danger }}
                >{k.d}</p>
              </div>
              <div
                className="grid size-9 shrink-0 place-items-center rounded-xl text-sm"
                style={{ background: aion.colors.pillInactive }}
                aria-hidden
              >
                •
              </div>
            </li>
          ))}
        </div>
        <div className="mt-3 grid list-none grid-cols-1 gap-2 lg:grid-cols-2">
          <li className="min-h-[240px] flex-1 rounded-2xl bg-white p-3 ring-1 ring-black/5">
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >Ventas por día</h2>
            <p
              className="text-xs"
              style={{ color: aion.colors.muted }}
            >Ingresos de la semana (demo)</p>
            <div
              className="mt-3 flex h-44 items-end justify-between gap-0.5 border-b border-l border-stone-200 pl-0.5 sm:pl-1"
            >
              {week.map((w) => {
                const pct = Math.max(0.1, (w.h / maxH) * 100);
                return (
                  <div key={w.d} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-4/5 max-w-[2rem] min-h-[0.5rem] rounded-t-md sm:max-w-[2.5rem]"
                      style={{
                        height: `${pct}%`,
                        background: "#600020",
                        minHeight: "8px",
                      }}
                      title={`${w.d}`}
                    />
                    <p className="text-[9px] sm:text-[10px] mt-1" style={{ color: aion.colors.muted }}>{w.d}</p>
                  </div>
                );
              })}
            </div>
          </li>
          <li
            className="flex min-h-[240px] flex-1 flex-col rounded-2xl bg-white p-3 ring-1 ring-black/5"
          >
            <h2
              className="text-sm font-extrabold"
              style={{ color: aion.colors.text }}
            >Por categoría</h2>
            <p
              className="text-xs"
              style={{ color: aion.colors.muted }}
            >Distribución de ventas (demo)</p>
            <div className="mt-2 flex flex-1 items-center justify-center gap-4">
              <div
                className="size-28 sm:size-32 rounded-full"
                style={{
                  background: `conic-gradient(#600020 0 28%, #333 28% 52%, #E8A0C4 52% 74%, #8B4513 74% 100%)`,
                }}
                title="Anillo de categoría"
                aria-label="Gráfico por categoría"
              />
              <ul className="min-w-0 list-none text-[11px] space-y-0.5" style={{ color: aion.colors.muted }}>
                <li><span className="inline-block size-2.5 align-middle rounded" style={{ background: "#600020" }} /> Entradas</li>
                <li><span className="inline-block size-2.5 align-middle rounded" style={{ background: "#333" }} /> Principales</li>
                <li><span className="inline-block size-2.5 align-middle rounded" style={{ background: "#E8A0C4" }} /> Pastas</li>
                <li><span className="inline-block size-2.5 align-middle rounded" style={{ background: "#8B4513" }} /> Carnes</li>
              </ul>
            </div>
          </li>
        </div>
        <div
          className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-black/5"
        >
          <h2
            className="text-sm font-extrabold"
            style={{ color: aion.colors.text }}
          >Platos más vendidos</h2>
          <p
            className="text-xs"
            style={{ color: aion.colors.muted }}
          >Top 5 de la semana (demo)</p>
          <ol className="mt-2 list-none">
            {top.map((i, idx) => (
              <li
                key={i.name}
                className="mb-1 flex items-center justify-between border-b border-stone-100 py-1.5 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="grid size-6 place-items-center rounded-md text-xs font-extrabold"
                    style={{
                      background: aion.colors.pillInactive,
                      color: aion.colors.primary,
                    }}
                  >{idx + 1}</span>
                  <div
                    className="size-8 rounded-full"
                    style={{
                      background: aion.colors.pillInactive,
                    }}
                    title={i.name}
                    aria-label="Miniatura de plato"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: aion.colors.text }}>{i.name}</p>
                    <p className="text-xs" style={{ color: aion.colors.muted }}>{i.n} vendidos</p>
                  </div>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: aion.colors.primary }}>{i.rev} ingresos</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}
