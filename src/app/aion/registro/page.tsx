"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { aion } from "@/lib/aion/tokens";
import { AionPasswordField } from "@/components/aion/auth/password-field";
import { isStrongPassword, isValidEmail } from "@/lib/auth/validators";

const Mail = (
  <svg
    className="text-stone-400"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 5 9-5" />
  </svg>
);
const UserI = (
  <svg
    className="text-stone-400"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
    <circle cx="12" cy="7" r="3.5" />
  </svg>
);
const PhoneI = (
  <svg
    className="text-stone-400"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M7 2h2l1 2h2l2 1v1l-2 3h-2l-2-1H8L6 4V3l1-1Z" />
    <rect x="5" y="8" width="12" height="10" rx="1.5" />
  </svg>
);

function IconInput(p: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-xs font-bold"
        style={{ color: aion.colors.text }}
        htmlFor={p.id}
      >
        {p.label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {p.icon}
        </span>
        {p.children}
      </div>
    </div>
  );
}

export default function AionRegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setOk(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password1 || !password2) {
      setErr("Completa todos los campos obligatorios.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setErr("Ingresa un email válido.");
      return;
    }
    if (!isStrongPassword(password1)) {
      setErr(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.",
      );
      return;
    }
    if (password1 !== password2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    if (!terms) {
      setErr("Debes aceptar términos y política.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          phone: phone.trim(),
          password: password1,
          confirmPassword: password2,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 409) {
          // Email ya registrado → llevar al login
          router.push("/aion/login?hint=ya-registrado");
          return;
        }
        setErr(data.error ?? "No se pudo crear la cuenta.");
        return;
      }

      setOk(data.message ?? "Cuenta creada con éxito.");
      router.push("/aion/cliente/menu");
    } catch {
      setErr("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center px-4 py-8"
      style={{ background: aion.colors.pageBg, color: aion.colors.text }}
    >
      <p
        className="text-2xl font-extrabold tracking-wide"
        style={{ color: aion.colors.primary }}
      >
        AION
      </p>
      <p className="mt-1 text-sm" style={{ color: aion.colors.muted }}>
        Sistema POS Inteligente
      </p>
      <div className="mt-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-center text-lg font-extrabold">Crear cuenta</h1>
        <p className="text-center text-xs" style={{ color: aion.colors.muted }}>
          Regístrate para comenzar a usar AION
        </p>
        {ok !== null ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-800"
            role="status"
          >
            {ok}
          </p>
        ) : null}
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <IconInput id="aion-r-name" label="Nombre completo" icon={UserI}>
            <input
              id="aion-r-name"
              className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
              name="name"
              autoComplete="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => {
                setName(e.currentTarget.value);
                setErr(null);
              }}
            />
          </IconInput>
          <IconInput id="aion-r-mail" label="Email" icon={Mail}>
            <input
              id="aion-r-mail"
              className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
                setErr(null);
              }}
            />
          </IconInput>
          <IconInput id="aion-r-phone" label="Teléfono" icon={PhoneI}>
            <input
              id="aion-r-phone"
              className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+34 600 000 000"
              value={phone}
              onChange={(e) => {
                setPhone(e.currentTarget.value);
              }}
            />
          </IconInput>
          <AionPasswordField
            id="aion-r-pw1"
            name="password1"
            label="Contraseña"
            autoComplete="new-password"
            placeholder="Crea una contraseña"
            required
            value={password1}
            onChange={(e) => {
              setPassword1(e.currentTarget.value);
              setErr(null);
            }}
          />
          <AionPasswordField
            id="aion-r-pw2"
            name="password2"
            label="Confirmar contraseña"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            required
            value={password2}
            onChange={(e) => {
              setPassword2(e.currentTarget.value);
              setErr(null);
            }}
          />
          <label
            className="flex items-start gap-2 text-xs"
            style={{ color: aion.colors.muted }}
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                setErr(null);
              }}
            />
            Acepto los{" "}
            <a
              className="font-bold"
              style={{ color: aion.colors.primary }}
              href="#"
            >
              términos de servicio
            </a>{" "}
            y la{" "}
            <a
              className="font-bold"
              style={{ color: aion.colors.primary }}
              href="#"
            >
              política de privacidad
            </a>
          </label>
          {err ? (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ background: aion.colors.primary }}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p
          className="mt-4 text-center text-sm"
          style={{ color: aion.colors.muted }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link
            className="font-extrabold"
            style={{ color: aion.colors.primary }}
            href="/aion/login"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
