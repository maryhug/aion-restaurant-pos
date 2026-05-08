"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { aion } from "@/lib/aion/tokens";
import { AionPasswordField } from "@/components/aion/auth/password-field";
import {
  isStrongPassword,
  isValidEmail,
  isValidName,
} from "@/lib/auth/validators";

const MailIcon = (
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

const UserIcon = (
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

function IconInput(p: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-xs font-medium"
        style={{ color: aion.colors.muted }}
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

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirm", string>
>;

export default function AionRegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<FieldErrors>({});

  function clearErr() {
    setErr(null);
    setFieldErr({});
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim() || !isValidName(name)) e.name = "Mínimo 2 caracteres";
    if (!email.trim()) e.email = "Obligatorio";
    else if (!isValidEmail(email.trim().toLowerCase()))
      e.email = "Email no válido";
    if (!password) e.password = "Obligatorio";
    else if (!isStrongPassword(password))
      e.password = "Mínimo 8 caracteres, una mayúscula, minúscula y número";
    if (!confirm) e.confirm = "Obligatorio";
    else if (password !== confirm) e.confirm = "Las contraseñas no coinciden";
    return e;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setOk(null);
    setErr(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErr(errors);
      return;
    }
    setFieldErr({});

    if (!terms) {
      setErr("Debes aceptar los términos y la política de privacidad.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword: confirm,
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        if (res.status === 409) {
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
      style={{ background: aion.colors.pageBgBeige, color: aion.colors.text }}
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

      <div
        className="mt-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        role="region"
        aria-labelledby="aion-register-heading"
      >
        <h1
          id="aion-register-heading"
          className="text-center text-lg font-extrabold"
        >
          Crear cuenta
        </h1>
        <p className="text-center text-xs" style={{ color: aion.colors.muted }}>
          Regístrate para comenzar a usar AION
        </p>

        {ok ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-800"
            role="status"
          >
            {ok}
          </p>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          {/* Nombre */}
          <div>
            <IconInput id="aion-r-name" label="Nombre completo" icon={UserIcon}>
              <input
                id="aion-r-name"
                className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
                name="name"
                autoComplete="name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => {
                  setName(e.currentTarget.value);
                  clearErr();
                }}
                aria-invalid={!!fieldErr.name}
              />
            </IconInput>
            {fieldErr.name ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {fieldErr.name}
              </p>
            ) : null}
          </div>

          {/* Email */}
          <div>
            <IconInput id="aion-r-email" label="Email" icon={MailIcon}>
              <input
                id="aion-r-email"
                className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.currentTarget.value);
                  clearErr();
                }}
                aria-invalid={!!fieldErr.email}
              />
            </IconInput>
            {fieldErr.email ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {fieldErr.email}
              </p>
            ) : null}
          </div>

          {/* Contraseña */}
          <div>
            <AionPasswordField
              id="aion-r-pw"
              name="password"
              label="Contraseña"
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.currentTarget.value);
                clearErr();
              }}
              aria-invalid={!!fieldErr.password}
            />
            {fieldErr.password ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {fieldErr.password}
              </p>
            ) : null}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <AionPasswordField
              id="aion-r-pw2"
              name="confirmPassword"
              label="Confirmar contraseña"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.currentTarget.value);
                clearErr();
              }}
              aria-invalid={!!fieldErr.confirm}
            />
            {fieldErr.confirm ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {fieldErr.confirm}
              </p>
            ) : null}
          </div>

          {/* Términos */}
          <label
            className="flex items-start gap-2 text-xs"
            style={{ color: aion.colors.muted }}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-rose-800"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                setErr(null);
              }}
            />
            Acepto los{" "}
            <a
              className="font-bold underline"
              style={{ color: aion.colors.primary }}
              href="#"
            >
              términos de servicio
            </a>{" "}
            y la{" "}
            <a
              className="font-bold underline"
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
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-70"
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

      <p
        className="mt-6 max-w-sm text-center text-[10px] leading-normal"
        style={{ color: aion.colors.muted }}
      >
        Al registrarte, aceptas nuestros{" "}
        <a className="underline" href="#">
          Términos de servicio
        </a>{" "}
        y{" "}
        <a className="underline" href="#">
          Política de privacidad
        </a>
      </p>
    </div>
  );
}
