import Link from "next/link";
import { aion } from "@/lib/aion/tokens";
import { IconQr } from "@/components/aion/icons";

const steps = [
  { n: 1, title: "Escanea", desc: "Escanea el QR o abre el link" },
  { n: 2, title: "Explora", desc: "Navega el menú y elige" },
  { n: 3, title: "Reserva", desc: "Selecciona fecha y hora" },
  { n: 4, title: "Disfruta", desc: "Llega y tu pedido está listo" },
] as const;

export default function AionLandingPage() {
  return (
    <div className="min-h-dvh" style={{ background: aion.colors.pageBgAlt }}>
      <header
        className="px-4 pb-12 pt-10 text-center text-white sm:px-6"
        style={{ background: aion.colors.hero }}
      >
        <p className="text-2xl font-extrabold tracking-wide">AION</p>
        <p className="mt-1 text-sm text-white/90">Sistema POS Inteligente</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/90">
          Reserva, preordena y disfruta tu experiencia gastronómica sin esperas. La
          forma inteligente de gestionar tu restaurante.
        </p>
        <Link
          href="/aion/cliente/menu"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm"
        >
          <IconQr size={18} className="text-stone-800" />
          Escanear QR / Ver menú
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section>
          <h2 className="text-xl font-bold" style={{ color: aion.colors.text }}>
            Todo lo que necesitas
          </h2>
          <p className="mt-1 text-sm" style={{ color: aion.colors.muted }}>
            Una plataforma completa para clientes, personal y administradores.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div
              className="rounded-2xl bg-stone-100/80 p-4 shadow-sm ring-1 ring-black/5"
              style={{ minHeight: "220px" }}
            >
              <div
                className="grid size-10 place-items-center rounded-lg text-sm font-bold"
                style={{ background: aion.colors.tagBg, color: aion.colors.primary }}
              >
                🍴
              </div>
              <h3 className="mt-3 text-sm font-bold">Portal Cliente</h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: aion.colors.muted }}
              >
                Explora el menú, preordena y reserva tu mesa en segundos.
              </p>
              <ul
                className="mt-2 list-none space-y-0.5 text-xs"
                style={{ color: aion.colors.muted }}
              >
                <li>· Menú en tiempo real</li>
                <li>· Preorden antes de llegar</li>
                <li>· Seguimiento del pedido</li>
              </ul>
              <Link
                className="mt-4 block w-full rounded-xl py-2 text-center text-sm font-medium text-white"
                style={{ background: aion.colors.primary }}
                href="/aion/cliente/menu"
              >
                Acceder como Cliente
              </Link>
            </div>
            <div
              className="rounded-2xl bg-stone-100/80 p-4 shadow-sm ring-1 ring-black/5"
              style={{ minHeight: "220px" }}
            >
              <div
                className="grid size-10 place-items-center rounded-lg text-sm font-bold"
                style={{ background: aion.colors.tagBg, color: aion.colors.primary }}
              >
                👨‍🍳
              </div>
              <h3 className="mt-3 text-sm font-bold">Panel Staff</h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: aion.colors.muted }}
              >
                Gestiona pedidos en tiempo real con indicadores de urgencia.
              </p>
              <ul
                className="mt-2 list-none space-y-0.5 text-xs"
                style={{ color: aion.colors.muted }}
              >
                <li>· Dashboard de pedidos</li>
                <li>· Estados en tiempo real</li>
                <li>· Alertas de urgencia</li>
              </ul>
              <Link
                className="mt-4 block w-full rounded-xl py-2 text-center text-sm font-medium text-stone-900"
                style={{ background: aion.colors.pillInactive }}
                href="/aion/staff"
              >
                Acceder como Staff
              </Link>
            </div>
            <div
              className="rounded-2xl bg-stone-100/80 p-4 shadow-sm ring-1 ring-black/5"
              style={{ minHeight: "220px" }}
            >
              <div
                className="grid size-10 place-items-center rounded-lg text-sm font-bold"
                style={{
                  background: aion.colors.pillInactive,
                  color: aion.colors.primary,
                }}
              >
                ⚙️
              </div>
              <h3 className="mt-3 text-sm font-bold">Administración</h3>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: aion.colors.muted }}
              >
                Controla ventas, métricas y gestiona tu menú.
              </p>
              <ul
                className="mt-2 list-none space-y-0.5 text-xs"
                style={{ color: aion.colors.muted }}
              >
                <li>· Panel de ventas</li>
                <li>· Métricas del día</li>
                <li>· Gestión de menú</li>
              </ul>
              <Link
                className="mt-4 block w-full rounded-xl py-2 text-center text-sm font-medium text-stone-900"
                style={{ background: aion.colors.pillInactive }}
                href="/aion/admin"
              >
                Acceder como Admin
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold" style={{ color: aion.colors.text }}>
            Cómo funciona
          </h2>
          <p className="mt-1 text-sm" style={{ color: aion.colors.muted }}>
            Una experiencia sin fricciones en 4 simples pasos.
          </p>
          <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex min-w-0 flex-1 flex-col items-center text-center"
              >
                <span
                  className="grid size-9 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: aion.colors.primary }}
                >
                  {s.n}
                </span>
                <p className="mt-2 text-sm font-bold">{s.title}</p>
                <p
                  className="mt-1 text-xs leading-relaxed"
                  style={{ color: aion.colors.muted }}
                >
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 py-6 text-sm">
        <div
          className="mx-auto flex max-w-5xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          style={{ color: aion.colors.muted }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: aion.colors.text }}
          >
            AION · POS inteligente
          </p>
          <div
            className="flex gap-4 text-sm"
            style={{ color: aion.colors.primaryAlt }}
          >
            <Link href="/aion/login" className="font-medium">
              Iniciar sesión
            </Link>
            <Link href="/aion/registro" className="font-medium">
              Registrarse
            </Link>
          </div>
        </div>
        <p
          className="mt-4 text-center text-xs"
          style={{ color: aion.colors.muted }}
        >
          © 2026 AION. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
