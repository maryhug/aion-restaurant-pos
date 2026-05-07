import Link from "next/link";
import Image from "next/image";
import { aion } from "@/lib/aion/tokens";

export default function AionLandingPage() {
  return (
    <main
      className="flex min-h-dvh flex-col px-4 py-6 sm:px-6"
      style={{
        background: `linear-gradient(180deg, ${aion.colors.pageBgAlt} 0%, ${aion.colors.pageBg} 100%)`,
      }}
    >
      <section className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto mb-9 w-fit">
            <Image
              src="/brands/il-cafeto-logo.png"
              alt="Logo Il Cafeto"
              width={650}
              height={246}
              className="h-auto w-[310px] object-contain"
              priority
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/aion/cliente/experiencia"
              className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out hover:-translate-y-0.5"
            >
              <div
                className="mb-3 inline-grid size-9 place-items-center rounded-full text-sm"
                style={{
                  background: aion.colors.tagBg,
                  color: aion.colors.primary,
                }}
              >
                ✨
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ color: aion.colors.primary }}
              >
                Experience
              </h2>
              <p className="mt-2 text-sm" style={{ color: aion.colors.muted }}>
                Quiz interactivo, descubrimiento de platos y reveal
                cinematográfico
              </p>
              <p
                className="mt-4 text-sm font-bold"
                style={{ color: aion.colors.primary }}
              >
                Abrir experiencia →
              </p>
            </Link>

            <Link
              href="/aion/cliente/menu"
              className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-in-out hover:-translate-y-0.5"
            >
              <div
                className="mb-3 inline-grid size-9 place-items-center rounded-full text-sm"
                style={{
                  background: aion.colors.tagBg,
                  color: aion.colors.primary,
                }}
              >
                ⊞
              </div>
              <h2
                className="text-xl font-extrabold"
                style={{ color: aion.colors.primary }}
              >
                Menú clásico
              </h2>
              <p className="mt-2 text-sm" style={{ color: aion.colors.muted }}>
                Explora nuestra carta completa y elige a tu gusto
              </p>
              <p
                className="mt-4 text-sm font-bold"
                style={{ color: aion.colors.primary }}
              >
                Abrir menú →
              </p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="pb-2 pt-4 text-center">
        <p
          className="text-xs uppercase tracking-[0.18em]"
          style={{ color: aion.colors.muted }}
        >
          CREATED BY AION
        </p>
        <p
          className="mt-1 text-sm font-medium"
          style={{ color: aion.colors.muted }}
        >
          Una experiencia interactiva.
        </p>
      </footer>
    </main>
  );
}
