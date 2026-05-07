# Go-Live Multitenant Checklist

## 1) Base de datos

1. Validar schema:
   - `npx prisma validate`
2. Aplicar migración:
   - `npx prisma migrate dev --name admin_multitenant_expand_v1` (local)
   - `npx prisma migrate deploy` (producción)
3. Ejecutar backfill:
   - `npm run db:backfill:admin`

## 2) Verificaciones de integridad

Ejecutar checks SQL:

- `orders` sin tenant:
  - `select count(*) from orders where restaurant_id is null;`
- `orders` sin branch:
  - `select count(*) from orders where branch_id is null;`
- `sales` sin tenant:
  - `select count(*) from sales where restaurant_id is null;`
- `settings` por tenant:
  - `select count(*) from restaurant_settings;`
  - `select count(*) from restaurants;`

## 3) Verificaciones funcionales

1. Crear pedido desde cliente y confirmar que se guarda con `restaurant_id`.
2. Verificar en staff que solo aparecen órdenes del tenant autenticado.
3. Cambiar estado de una orden en staff y verificar que no permite cambiar órdenes de otro tenant.
4. Entrar a `/admin` y confirmar carga de settings/branding por restaurante.

## 4) Endurecimiento (siguiente migración)

Después de validar backfill en producción:

- convertir a `NOT NULL`:
  - `orders.restaurant_id`
  - `orders.branch_id`
  - `sales.restaurant_id`
- agregar constraints de negocio que ahora no pueden romper datos históricos.

## 5) Seguridad de producción

- Rotar secretos JWT y credenciales DB.
- Revisar CORS y cookies `secure` + `httpOnly`.
- Activar monitoreo de errores y alertas.

