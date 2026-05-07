# Modulo Admin (`/admin`)

## Estructura

- `src/app/admin/*`: rutas App Router del panel.
- `src/features/admin/types.ts`: contratos TypeScript.
- `src/features/admin/mocks.ts`: datos mock realistas aislados por tenant.
- `src/features/admin/tenant-context.tsx`: contexto tenant/branch + carga de tema.
- `src/features/admin/helpers.ts`: utilidades de formato, paginacion, export y theme.
- `src/features/admin/components/*`: componentes reutilizables.

## Estrategia multitenant lista para backend

Persistir en backend:

- `tenants`
- `restaurants` (relacion 1:N con branches)
- `branches`
- `tenant_settings` (JSON por tenant):
  - `branding`
  - `operational`
  - `notifications`
  - `featureFlags`

Clave de aislamiento recomendada en frontend:

- `tenantId` + `branchId` en estado global de admin.
- Todos los fetch deben incluir `tenantId` en token/sesión y `branchId` opcional en query.

## Theming por tenant

- Guardar `branding` por tenant en `tenant_settings.branding`.
- Al iniciar sesión admin:
  1. resolver tenant activo,
  2. cargar settings,
  3. aplicar CSS variables (`--admin-primary`, `--admin-secondary`, `--admin-accent`, `--admin-bg`).
- Tailwind + CSS variables permite tema dinámico sin recompilar.

## Notas

- Se usa mock tipado en todas las vistas para facilitar integración incremental con backend real.
- Componentes y páginas quedan listas para reemplazar `mocks.ts` por endpoints.

