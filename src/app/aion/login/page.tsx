"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { aion } from "@/lib/aion/tokens";
import { AionPasswordField } from "@/components/aion/auth/password-field";
import { isValidEmail } from "@/lib/auth/validators";

type LoginApiSuccess = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "customer" | "staff" | "admin";
  };
  accessToken: string;
  refreshToken: string;
};

type ApiError = { error?: string; details?: string };

export default function AionLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("hint") === "ya-registrado") {
      setOk("Este correo ya tiene cuenta. Inicia sesión aquí.");
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    setOk(null);
    setErr(null);

    if (!normalizedEmail || !password) {
      setErr("Email y contraseña son obligatorios.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setErr("Ingresa un email válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const errorData = data as ApiError;
        setErr(errorData.error ?? "No se pudo iniciar sesión.");
        return;
      }

      const successData = data as LoginApiSuccess;
      setOk(successData.message ?? "Inicio de sesión exitoso.");
      const target =
        successData.user.role === "admin"
          ? "/aion/admin"
          : successData.user.role === "staff"
            ? "/aion/staff"
            : "/aion/cliente/menu";
      router.push(target);
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
        aria-labelledby="aion-welcome"
      >
        <h1 id="aion-welcome" className="text-center text-lg font-extrabold">
          Bienvenido
        </h1>
        <p className="text-center text-xs" style={{ color: aion.colors.muted }}>
          Inicia sesión para acceder a tu cuenta
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
          <div>
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: aion.colors.muted }}
              htmlFor="aion-login-email"
            >
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                <svg
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
              </span>
              <input
                id="aion-login-email"
                className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm ring-1 ring-black/10"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr(null);
                }}
                aria-invalid={err ? "true" : "false"}
              />
            </div>
          </div>
          <AionPasswordField
            id="aion-login-pw"
            name="password"
            label="Contraseña"
            rightLink={{ href: "#", text: "¿Olvidaste tu contraseña?" }}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.currentTarget.value);
              setErr(null);
            }}
            aria-label="Contraseña"
          />
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
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
        <div
          className="my-4 flex items-center gap-2 text-center text-xs"
          style={{ color: aion.colors.muted }}
        >
          <div className="h-px flex-1 bg-stone-200" />
          <span>Demo rápido</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Link
            className="rounded-xl border border-stone-200 py-2 text-center font-medium"
            style={{ color: aion.colors.text }}
            href="/aion/cliente/menu"
          >
            Cliente
          </Link>
          <Link
            className="rounded-xl border border-stone-200 py-2 text-center font-medium"
            style={{ color: aion.colors.text }}
            href="/aion/staff"
          >
            Staff
          </Link>
          <Link
            className="rounded-xl border border-stone-200 py-2 text-center font-medium"
            style={{ color: aion.colors.text }}
            href="/aion/admin"
          >
            Admin
          </Link>
        </div>
        <p
          className="mt-4 text-center text-sm"
          style={{ color: aion.colors.muted }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            className="font-extrabold"
            style={{ color: aion.colors.primary }}
            href="/aion/registro"
          >
            Regístrate
          </Link>
        </p>
      </div>
      <p
        className="mt-6 max-w-sm text-center text-[10px] leading-normal"
        style={{ color: aion.colors.muted }}
      >
        Al iniciar sesión, aceptas nuestros{" "}
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
