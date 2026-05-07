"use client";

import {
  RestaurantProfileForm,
  SettingsTabs,
  TenantBrandingForm,
  TenantThemePreview,
} from "@/features/admin/components/domain";
import { useAdminTenant } from "@/features/admin/tenant-context";

export default function AdminSettingsPage() {
  const { tenant } = useAdminTenant();
  return (
    <SettingsTabs>
      <RestaurantProfileForm />
      <div className="grid gap-3 lg:grid-cols-2">
        <TenantBrandingForm />
        <TenantThemePreview tenant={tenant} />
      </div>
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="font-bold">Preferencias operativas</h3>
        <p className="mt-1 text-sm text-stone-600">
          Moneda, zona horaria, impuestos, propina, turnos y métodos de pago por
          tenant.
        </p>
      </article>
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="font-bold">Usuarios y permisos</h3>
        <p className="mt-1 text-sm text-stone-600">
          Listado de usuarios del tenant, roles y activación/desactivación.
        </p>
      </article>
      <article className="rounded-2xl border border-black/5 bg-white p-4">
        <h3 className="font-bold">Integraciones, notificaciones y seguridad</h3>
        <p className="mt-1 text-sm text-stone-600">
          Placeholders para pasarela, WhatsApp, webhooks, alertas, sesiones y
          2FA.
        </p>
      </article>
    </SettingsTabs>
  );
}
