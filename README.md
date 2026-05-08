# Aion — Sistema de Gestión para Restaurantes

Plataforma **multi-tenant** SaaS construida con **Next.js 16 App Router**, **Prisma 7 + Neon PostgreSQL** y **JWT** (jose). Cada restaurante tiene su propio espacio de datos completamente aislado; un mismo despliegue sirve a todos los tenants.

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura multi-tenant](#arquitectura-multi-tenant)
3. [Requisitos previos](#requisitos-previos)
4. [Variables de entorno](#variables-de-entorno)
5. [Instalación y arranque](#instalación-y-arranque)
6. [Scripts disponibles](#scripts-disponibles)
7. [Credenciales de prueba](#credenciales-de-prueba)
8. [Rutas de la aplicación](#rutas-de-la-aplicación)
   - [Páginas públicas / auth](#páginas-públicas--auth)
   - [Vista cliente](#vista-cliente)
   - [Vista staff](#vista-staff)
   - [Vista admin](#vista-admin)
9. [API REST — referencia completa](#api-rest--referencia-completa)
   - [Auth](#auth)
   - [Cliente / público](#cliente--público)
   - [Staff](#staff)
   - [Admin](#admin-requiere-rol-admin--restaurantid-en-jwt)
10. [Modelo de datos](#modelo-de-datos)
11. [Autenticación y seguridad](#autenticación-y-seguridad)
12. [Cómo agregar un nuevo restaurante](#cómo-agregar-un-nuevo-restaurante)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos | Neon PostgreSQL (serverless) |
| ORM | Prisma 7.7 con `PrismaPg` adapter |
| Auth | JWT vía `jose` — cookies HTTP-only |
| Estilos | Tailwind CSS v4 |
| Runtime | Node 22 |
| Seed / scripts | `tsx` + `dotenv-cli` |

---

## Arquitectura multi-tenant

```
JWT (access token)
  └─ id, email, role, restaurantId   ← se fija en el login
         │
         ▼
requireAdmin()  →  filtra TODOS los queries por restaurantId
         │
         ▼
Base de datos (Neon)
  ├─ restaurants         (tenant raíz)
  ├─ branches            (sedes del restaurante)
  ├─ user_restaurants    (qué admin/staff pertenece a qué restaurante)
  ├─ menu_items          → restaurant_id
  ├─ tables              → restaurant_id
  ├─ reservations        → table_id  (indirecto)
  ├─ orders              → restaurant_id
  ├─ sales               → restaurant_id
  ├─ expenses            → restaurant_id
  ├─ employees           → restaurant_id
  ├─ cash_registers      → restaurant_id
  ├─ cash_shifts         → restaurant_id
  └─ cash_closures       → restaurant_id
```

**Regla clave:** el `restaurantId` se lee del JWT en el servidor. El cliente nunca puede falsificar a qué tenant pertenecen sus datos.

---

## Requisitos previos

- Node.js ≥ 20.6
- Una base de datos Neon (o Postgres compatible)
- npm / pnpm / yarn

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Conexión principal (pooler de Neon para queries normales)
DATABASE_URL="postgresql://usuario:password@host/dbname?sslmode=require"

# Conexión directa (sin pooler — requerida por Prisma para migraciones y seed)
DIRECT_URL="postgresql://usuario:password@host-directo/dbname?sslmode=require"

# Secretos JWT (mínimo 32 caracteres cada uno)
JWT_ACCESS_SECRET="tu-secreto-de-access-muy-largo"
JWT_REFRESH_SECRET="tu-secreto-de-refresh-muy-largo"
```

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Generar el cliente de Prisma
npm run db:generate

# 3. Aplicar el schema a la base de datos
npm run db:push

# 4. Cargar datos de prueba (dos restaurantes)
npm run db:seed

# 5. Arrancar el servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Scripts disponibles

| Script | Comando real | Descripción |
|---|---|---|
| `npm run dev` | `next dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | `next build` | Build de producción |
| `npm run start` | `next start` | Sirve el build de producción |
| `npm run lint` | `eslint` | Linter + Prettier |
| `npm run db:generate` | `prisma generate` | Regenera el cliente Prisma |
| `npm run db:push` | `prisma db push` | Sincroniza schema con la DB (sin migraciones) |
| `npm run db:seed` | `dotenv -e .env -- tsx prisma/seed.ts` | Inserta datos de prueba (2 restaurantes) |
| `npm run db:migrate` | `prisma migrate deploy` | Aplica migraciones en producción |

---

## Credenciales de prueba

El seed crea **dos restaurantes completamente independientes** para verificar el aislamiento multi-tenant.

### Restaurante 1 — Il Cafeto (Bogotá)

Branding: rojo borgoña `#581c22` · Sede: Centro

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@ilcafeto.com` | `ilcafeto2024!` |
| Staff (Mesero) | `staff1@ilcafeto.com` | `Staff1234!` |
| Staff (Barista) | `staff2@ilcafeto.com` | `Staff1234!` |
| Staff (Cajero) | `staff3@ilcafeto.com` | `Staff1234!` |

### Restaurante 2 — La Cazuela (Medellín)

Branding: verde `#14532d` · Sede: El Poblado

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@lacazuela.com` | `lacazuela2024!` |
| Staff (Cocinero) | `staff1@lacazuela.com` | `Staff1234!` |
| Staff (Mesera) | `staff2@lacazuela.com` | `Staff1234!` |

### Clientes (compartidos)

| Email | Contraseña |
|---|---|
| `cliente1@gmail.com` | `Cliente1234!` |
| `cliente2@gmail.com` | `Cliente1234!` |
| `cliente3@gmail.com` | `Cliente1234!` |

> **Prueba de aislamiento:** entra con `admin@ilcafeto.com` → verás menú español, 12 mesas, 3 empleados. Cierra sesión, entra con `admin@lacazuela.com` → verás menú colombiano, 8 mesas, 2 empleados. Los datos nunca se mezclan.

---

## Rutas de la aplicación

### Páginas públicas / auth

| Ruta | Descripción |
|---|---|
| `/aion` | Landing / redirect según sesión activa |
| `/aion/login` | Inicio de sesión (todos los roles) |
| `/aion/registro` | Registro de nuevos clientes (crea `role: "customer"`) |

### Vista cliente

Prefijo: `/aion/cliente/`

| Ruta | Descripción |
|---|---|
| `/aion/cliente/menu` | Menú del restaurante con filtros por categoría |
| `/aion/cliente/plato/[id]` | Detalle de un plato — descripción, precio, alérgenos |
| `/aion/cliente/carrito` | Carrito de compras activo |
| `/aion/cliente/pre-orden` | Revisión del pedido antes de confirmar |
| `/aion/cliente/pedido` | Confirmación y resumen del pedido enviado |
| `/aion/cliente/confirmacion` | Pantalla de confirmación post-pago |
| `/aion/cliente/estado-pedido/[orderId]` | Estado en tiempo real del pedido |
| `/aion/cliente/experiencia` | Gamificación: nivel XP, recompensas del usuario |
| `/aion/cliente/reserva-hora` | Formulario de reserva de mesa |

### Vista staff

| Ruta | Descripción |
|---|---|
| `/aion/staff` | Panel principal — lista de órdenes activas (pendiente / preparando / listo) con tiempo de espera y alertas de urgencia |

### Vista admin

Prefijo: `/aion/admin/`  
**Requiere:** cookie JWT con `role = "admin"` y `restaurantId` válido.

| Ruta | Descripción |
|---|---|
| `/aion/admin` | **Dashboard** — KPIs: ventas hoy / semana / mes, ticket promedio, gastos del mes, beneficio estimado, ítem más vendido, gráfico de ventas 7 días, alertas de stock bajo y reservas del día |
| `/aion/admin/pedidos` | Gestión de pedidos con tabla de estados y edición |
| `/aion/admin/inventario` | CRUD completo de productos y servicios; activar / desactivar items; 3 pestañas: Productos / Servicios / Movimientos |
| `/aion/admin/gastos` | Registro de gastos con categorías, gráfico por categoría, total del período |
| `/aion/admin/empleados` | CRUD de empleados: nombre, cargo (datalist con 13 cargos predefinidos), tipo de contrato, salario, estado (activo / inactivo); tabla de historial de pagos |
| `/aion/admin/mesas-reservas` | CRUD de mesas (número, capacidad, zona, estado) y reservas; board visual de ocupación |
| `/aion/admin/cierre-caja` | Formulario de cierre con 6 campos editables, historial de cierres cerrados, modal de detalle por turno |
| `/aion/admin/configuracion` | Info del restaurante, branding con color picker y preview live, ajustes (moneda / zona horaria / IVA / propina), gestión de usuarios del tenant |

---

## API REST — referencia completa

### Auth

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Pública | `{ name, email, password, confirmPassword }` | `201 { user, accessToken, refreshToken }` + sets cookies |
| `POST` | `/api/auth/login` | Pública | `{ email, password }` | `200 { user, accessToken, refreshToken }` + sets cookies |
| `POST` | `/api/auth/logout` | Pública | — | `200` + borra ambas cookies |
| `POST` | `/api/auth/refresh` | Cookie refresh | — | Nuevo access token en cookie |

**Validaciones en registro:**
- Nombre ≥ 2 caracteres
- Email RFC válido
- Contraseña: mínimo 8 chars + mayúscula + minúscula + número
- Contraseña y confirmación deben coincidir

---

### Cliente / público

| Método | Ruta | Auth | Params / Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/api/restaurant` | Pública | `?restaurantId=` | Info del restaurante + menú disponible |
| `POST` | `/api/orders` | Pública | `{ restaurantId, tableId?, branchId?, items[{ menuItemId, quantity, unitPrice }] }` | `201 { order }` |
| `GET` | `/api/orders/[orderId]` | Pública | — | Estado e items del pedido |
| `POST` | `/api/reservas` | Pública o sesión | `{ restaurantId, tableId, date, time, partySize, name, email }` | `200 { reservation }` |
| `GET` | `/api/reservas` | Sesión staff/admin | — | Lista de reservas del restaurante |
| `GET` | `/api/reservas/mesas` | Pública | `?restaurantId=` | Mesas disponibles para reservar |

**Notas:**
- `POST /api/orders` valida que todos los `menuItemId` pertenezcan al `restaurantId` y estén `available: true`.
- `POST /api/reservas` resuelve el usuario: si hay sesión activa usa ese `userId`; si no, busca por email o crea un usuario guest sin contraseña.

---

### Staff

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/api/staff/orders` | Sesión staff/admin | — | Órdenes activas (pending/preparing/ready) con tiempo de espera y flag `urgent` |
| `GET` | `/api/staff/orders/active` | Sesión staff/admin | — | Subset de órdenes más urgentes |
| `GET` | `/api/staff/orders/[id]` | Sesión staff/admin | — | Detalle de una orden |
| `PUT` | `/api/staff/orders/[id]/status` | Sesión staff/admin | `{ status: "preparing"\|"ready"\|"delivered" }` | `{ ok: true }` |

---

### Admin (requiere rol admin + restaurantId en JWT)

Todos los endpoints admin pasan por `requireAdmin()`:
1. Lee `aion_access_token` → verifica firma y expiración
2. Si expiró → intenta con `aion_refresh_token`
3. Comprueba `role === "admin"` y `restaurantId !== null`
4. Retorna `403` si alguna condición falla

#### Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/dashboard` | KPIs: ventas hoy/semana/mes, ticket promedio, total gastos del mes, beneficio estimado, ítem más vendido, ventas por día (últimos 7 días), alertas de stock bajo, count de reservas del día |

#### Perfil del admin

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/me` | — | `{ id, email, name }` del usuario autenticado |
| `PUT` | `/api/admin/me` | `{ name }` | Actualiza el nombre del admin en la DB |

#### Configuración del restaurante

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/configuracion` | — | Info del restaurante, branding, settings y branches activas |
| `PUT` | `/api/admin/configuracion` | Ver abajo | Actualiza cualquier combinación de los tres bloques |

Body PUT (todos los bloques son opcionales):
```json
{
  "restaurant": { "name": "...", "address": "...", "phone": "..." },
  "settings":   { "currency": "COP", "timezone": "America/Bogota", "taxRate": 19, "tipSuggestion": 10 },
  "branding":   { "primaryColor": "#581c22", "secondaryColor": "#7b4b52", "accentColor": "#d97706", "backgroundColor": "#ffe5e5" }
}
```

#### Inventario (`menu_items`)

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/inventario` | — | Lista completa de items del restaurante (productos + servicios) |
| `POST` | `/api/admin/inventario` | `{ name, category, price, unitCost?, stock?, minStock? }` | Crea un item. `category: "servicio"` lo trata como servicio |
| `PUT` | `/api/admin/inventario` | `{ id, name, category, price, unitCost?, stock?, minStock?, available? }` | Edita. `available: false` desactiva; `available: true` reactiva |
| `DELETE` | `/api/admin/inventario` | `{ id, soft?: true }` | `soft: true` → desactiva (soft delete). Sin `soft` → elimina físicamente |

#### Gastos

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/gastos` | — | Lista + totales + desglose por categoría |
| `POST` | `/api/admin/gastos` | `{ description, category, amount, date, branchId? }` | Crea un gasto asociado al restaurante |
| `PUT` | `/api/admin/gastos` | `{ id, description, category, amount, date }` | Edita un gasto existente |
| `DELETE` | `/api/admin/gastos` | `{ id }` | Elimina un gasto |

Categorías sugeridas: `ingredientes`, `nomina`, `servicios`, `equipos`, `otros`

#### Empleados

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/empleados` | — | Lista de empleados + nómina estimada del mes + conteo activos |
| `POST` | `/api/admin/empleados` | `{ fullName, documentNumber?, roleTitle, contractType, salary?, status, hiredAt?, branchId? }` | Crea empleado |
| `PUT` | `/api/admin/empleados` | `{ id, fullName, documentNumber?, roleTitle, contractType, salary?, status, hiredAt?, branchId? }` | Edita empleado |
| `DELETE` | `/api/admin/empleados` | `{ id, activate: boolean }` | `activate: true` → activa; `activate: false` → desactiva (soft) |

Tipos de contrato: `fijo`, `indefinido`, `prestacion`, `temporal`  
Estados del empleado: `active`, `inactive`, `suspended`

#### Mesas y Reservas

Un solo endpoint con campo `entity` como discriminador.

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/mesas-reservas` | — | Mesas y reservas del restaurante |
| `POST` | `/api/admin/mesas-reservas` | `{ entity: "table", number, capacity, zone?, status, branchId? }` | Crea mesa |
| `POST` | `/api/admin/mesas-reservas` | `{ entity: "reservation", customerName, tableId, date, time, partySize, status, notes?, branchId? }` | Crea reserva |
| `PUT` | `/api/admin/mesas-reservas` | `{ entity: "table", id, number, capacity, zone?, status }` | Edita mesa |
| `PUT` | `/api/admin/mesas-reservas` | `{ entity: "reservation", id, tableId, date, time, partySize, status, customerName?, notes? }` | Edita reserva |
| `DELETE` | `/api/admin/mesas-reservas` | `{ entity: "table", id }` | Elimina mesa |
| `DELETE` | `/api/admin/mesas-reservas` | `{ entity: "reservation", id }` | Elimina reserva |

Estados de mesa: `libre`, `ocupada`, `reservada`, `limpieza`  
Estados de reserva: `pendiente`, `confirmada`, `cancelada`

#### Cierre de Caja

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/cierre-caja` | — | `{ current: CashClosing\|null, closings: CashClosing[] }` |
| `POST` | `/api/admin/cierre-caja` | `{ countedCash, note?, fecha?, branchId? }` | Registra cierre. Si hay turno abierto sin cierre → cierra ese turno. Si no hay turno abierto → crea turno y cierre manual |

Lógica del estado del cierre:
- `countedCash === expected` → `cuadrado`
- `countedCash > expected` → `sobrante`
- `countedCash < expected` → `faltante`

#### Usuarios del tenant

| Método | Ruta | Body | Descripción |
|---|---|---|---|
| `GET` | `/api/admin/usuarios` | — | Lista de admin/staff vinculados al restaurante |
| `POST` | `/api/admin/usuarios` | `{ name, email, password, role: "admin"\|"staff" }` | Crea usuario y lo vincula. Si el email ya existe, solo crea el vínculo |
| `DELETE` | `/api/admin/usuarios` | `{ userId }` | Desvincula al usuario del restaurante. Un admin no puede eliminarse a sí mismo |

#### Pedidos (vista admin)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/admin/orders` | Lista de pedidos del restaurante con items y totales |

---

## Modelo de datos

```
users
  id, name, email, password, role (customer | staff | admin)

user_restaurants                     ← membresía M-N (tenant ↔ usuario)
  user_id, restaurant_id, role

restaurants
  id, name, address, phone

branches
  id, restaurant_id, name, city, address, is_active

restaurant_settings                  ← 1:1 con restaurant
  restaurant_id, currency, timezone, tax_rate, tip_suggested_pct,
  cancellation_policy, reservation_tolerance_min, reservation_max_minutes

restaurant_branding                  ← 1:1 con restaurant
  restaurant_id, primary_color, secondary_color, accent_color,
  background_color, logo_url

menu_items
  id, restaurant_id, name, category, price, cost_price,
  stock, min_stock, available

tables
  id, restaurant_id, branch_id, number, capacity, zone, status

reservations
  id, user_id, table_id, restaurant_id, branch_id,
  date, time, party_size, status, customer_name, notes

orders
  id, table_id, restaurant_id, branch_id, status, total, created_at

order_items
  id, order_id, menu_item_id, quantity, unit_price

sales
  id, order_id, restaurant_id, table_id, total, payment_method,
  cash_received, change_given, created_at

expenses
  id, restaurant_id, branch_id, user_id, description,
  category, amount, date

employees
  id, restaurant_id, branch_id, user_id, full_name, document_number,
  role_title, contract_type, salary, status, hired_at

employee_payments
  id, restaurant_id, employee_id, gross_amount, net_amount,
  payment_date, payment_method

cash_registers
  id, restaurant_id, branch_id, name, code, is_active

cash_shifts
  id, restaurant_id, branch_id, cash_register_id,
  opened_by_employee_id, closed_by_employee_id,
  opened_at, closed_at, opening_balance, status, note

cash_closures
  id, restaurant_id, branch_id, cash_shift_id, closed_by_employee_id,
  total_sales_cash, total_sales_card, total_sales_transfer,
  total_other_income, total_withdrawals, total_cash_expenses,
  expected_cash, counted_cash, difference, status, note

user_levels                          ← gamificación (1:1 con user)
  user_id, level, xp, total_visits

rewards
  id, user_id, type, value, claimed
```

---

## Autenticación y seguridad

### Flujo de tokens

```
Login → POST /api/auth/login
  ├─ Genera access token  (15 min)  → cookie: aion_access_token  (HTTP-only)
  └─ Genera refresh token (7 días)  → cookie: aion_refresh_token (HTTP-only)

Petición a API admin:
  requireAdmin(req)
    1. Lee aion_access_token → verifica firma + expiración
    2. Si expiró → lee aion_refresh_token → verifica
    3. Comprueba role === "admin" && restaurantId !== null
    4. Retorna { id, email, role, restaurantId }  o  403

Logout → POST /api/auth/logout
  └─ Borra ambas cookies (maxAge: 0)
```

### Payload del JWT

```typescript
{
  id:           string          // UUID del usuario
  email:        string
  role:         "customer" | "staff" | "admin"
  restaurantId: string | null   // null si el usuario no tiene restaurante asignado
}
```

### Por qué aparece 403 con `restaurantId: null`

El `restaurantId` se resuelve **en el momento del login** consultando `user_restaurants`. Si el usuario existe en la DB pero no tiene fila en esa tabla, el JWT tiene `restaurantId: null` y `requireAdmin` retorna 403.

**Solución:**
1. Ejecutar `npm run db:seed` (crea el vínculo si falta)
2. Cerrar sesión y volver a iniciar sesión para obtener un JWT nuevo con el `restaurantId` correcto

---

## Cómo agregar un nuevo restaurante

### Opción 1 — Via seed (desarrollo / pruebas)

Agrega en `prisma/seed.ts` dentro de `main()`:

```typescript
const miRestaurante = await prisma.restaurants.create({
  data: { name: "Mi Restaurante", address: "...", phone: "..." }
});
const admin = await upsertUser("admin@mirestaurante.com", "Admin", "Pass1234!", "admin");
await linkToRestaurant(admin.id, miRestaurante.id, "admin");
```

Luego: `npm run db:seed`

### Opción 2 — Agregar staff desde el panel admin

Un admin existente puede ir a `/aion/admin/configuracion` → sección **Usuarios** → **Agregar usuario**, ingresar nombre, email, contraseña temporal y rol (`admin` o `staff`). El sistema crea la cuenta, la hashea y la vincula automáticamente al restaurante del admin que la crea.

### Opción 3 — Producción (onboarding manual)

1. Crear el restaurante en la DB
2. Crear el usuario admin con `role: "admin"` en `users`
3. Crear la fila en `user_restaurants` con `role: "admin"`
4. El admin inicia sesión → su JWT ya tiene el `restaurantId` correcto
5. Desde el panel puede personalizar branding, agregar staff y configurar sedes

---

## Datos de prueba incluidos en el seed

### Il Cafeto

- 74 items de menú (Smoothies, Cervezas, Cócteles, Sangría, Vino, Entradas, Cafés, Postres, Sándwiches, Carnes, Ensaladas, Adiciones, Bebidas)
- 12 mesas (capacidad 4–6 personas)
- 3 empleados con historial de pagos
- 5 gastos de mayo 2026
- 3 órdenes + 2 ventas históricas
- 3 reservas futuras
- 1 caja con 1 turno cerrado + cierre + 1 turno abierto
- Branding rojo borgoña, IVA 19%, moneda COP

### La Cazuela

- 17 items de menú (Sopas, Platos fuertes, Entradas, Bebidas, Postres)
- 8 mesas (capacidad 4–6 personas)
- 2 empleados con historial de pagos
- 3 gastos de mayo 2026
- 2 órdenes + 2 ventas históricas
- 2 reservas futuras
- 1 caja con 1 turno cerrado + cierre + 1 turno abierto
- Branding verde, IVA 19%, moneda COP
