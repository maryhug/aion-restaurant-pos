# AION — Sistema POS Inteligente para Restaurantes

AION es una plataforma POS (Point of Sale) moderna para restaurantes construida con **Next.js 16**, **Prisma 7** y **PostgreSQL en Neon**. Permite gestionar menú, pedidos, reservas, gastos y ventas con vistas diferenciadas para administradores, staff y clientes.

---

## Stack tecnológico

| Tecnología | Versión | Rol en el proyecto |
|---|---|---|
| **Next.js** | 16.2.4 | Framework full-stack — App Router, Server Components, API Routes |
| **React** | 19 | Interfaz de usuario |
| **TypeScript** | 5 | Tipado estático en todo el proyecto |
| **Prisma** | 7.7 | ORM — consultas a la base de datos |
| **@prisma/adapter-pg** | 7.7 | Adaptador de Prisma 7 para node-postgres |
| **PostgreSQL (Neon)** | — | Base de datos relacional serverless en la nube |
| **node-postgres (pg)** | 8 | Driver de PostgreSQL para Node.js |
| **bcryptjs** | 3 | Hash seguro de contraseñas |
| **jose** | 6 | Generación y verificación de JWT (access + refresh tokens) |
| **Tailwind CSS** | 4 | Estilos utilitarios |
| **MongoDB + Mongoose** | 9 | Logs de interacciones con la IA |
| **ESLint + Prettier** | 9 / 3 | Linting y formato de código |
| **Husky + lint-staged** | — | Hooks de Git para calidad de código |
| **tsx + dotenv-cli** | — | Ejecutar scripts TypeScript (seed, migraciones) |

---

## Requisitos previos

- **Node.js** 20 o superior
- **npm** 10 o superior
- Cuenta en **Neon** (PostgreSQL serverless) — ya configurado con las credenciales en `.env.local`

---

## Instalación y primeros pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Sincronizar el schema con la base de datos Neon
npm run db:push

# 3. Regenerar el cliente Prisma
npm run db:generate

# 4. Poblar la base de datos con datos iniciales
npm run db:seed

# 5. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Variables de entorno

### `.env.local` — leído por Next.js en runtime

```env
# ── Base de datos Neon (pooler) ───────────────────────────────────
DATABASE_URL="postgresql://neondb_owner:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:<password>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require"

# ── JWT Access Token (duración: 15 minutos) ───────────────────────
JWT_SECRET="<hex-128-chars>"
JWT_ACCESS_SECRET="<mismo-valor>"
JWT_ACCESS_EXPIRES_IN="15m"

# ── JWT Refresh Token (duración: 7 días) ──────────────────────────
JWT_REFRESH_SECRET="<hex-128-chars-diferente>"
JWT_REFRESH_EXPIRES_IN="7d"
```

### `.env` — leído por Prisma CLI (`prisma studio`, `db push`, etc.)

```env
DATABASE_URL="<misma-url-que-arriba>"
DIRECT_URL="<misma-url-que-arriba>"
```

> Para generar secrets seguros:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev              # Servidor local en http://localhost:3000
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linting con ESLint

# Base de datos
npm run db:push          # Sincroniza el schema Prisma con la BD (sin crear migraciones)
npm run db:generate      # Regenera @prisma/client
npm run db:migrate       # Aplica migraciones en producción
npm run db:seed          # Inserta datos iniciales (restaurante, usuarios, menú, mesas)

# Herramientas
npx prisma studio        # Interfaz visual de la BD → http://localhost:5555
```

---

## Credenciales de prueba

> Ejecuta `npm run db:seed` para que existan estos usuarios en la BD.

### Administrador
| Campo | Valor |
|---|---|
| Email | `admin@ilcafeto.com` |
| Contraseña | `ilcafeto2024!` |
| Rol | `admin` |
| Acceso | `http://localhost:3000/aion/login` → redirige a `/aion/admin` |

### Staff
| Email | Contraseña | Nombre |
|---|---|---|
| `staff1@ilcafeto.com` | `Staff1234!` | Carlos Mesero |
| `staff2@ilcafeto.com` | `Staff1234!` | Laura Barista |
| `staff3@ilcafeto.com` | `Staff1234!` | Andrés Cajero |
| Acceso | Login → redirige a `/aion/staff` | — |

### Clientes
| Email | Contraseña | Nivel fidelidad |
|---|---|---|
| `cliente1@gmail.com` | `Cliente1234!` | Explorer |
| `cliente2@gmail.com` | `Cliente1234!` | Adventurer |
| `cliente3@gmail.com` | `Cliente1234!` | Gourmet |
| Acceso | Login → redirige a `/aion/cliente/menu` | — |

---

## Rutas de la aplicación

### Páginas públicas

| Ruta | Descripción |
|---|---|
| `/` | Página de inicio con chat IA integrado |
| `/aion` | Landing de AION — acceso rápido por rol |
| `/aion/login` | Inicio de sesión (todos los roles) |
| `/aion/registro` | Registro de nuevos clientes |
| `/reservar` | Formulario de reserva de mesa sin necesidad de cuenta |

### Vista Cliente — `/aion/cliente/`

| Ruta | Descripción | Datos |
|---|---|---|
| `/aion/cliente/menu` | Menú completo con filtro por categoría y búsqueda | BD — `menu_items` |
| `/aion/cliente/plato/[id]` | Detalle de un plato: descripción, precio y botón agregar | BD — `menu_items` |
| `/aion/cliente/carrito` | Resumen del carrito antes de confirmar | sessionStorage |
| `/aion/cliente/reserva-hora` | Fecha, hora, mesa y datos para la preorden | BD — crea `reservations` + `orders` |
| `/aion/cliente/confirmacion` | Código y resumen de la preorden confirmada | sessionStorage |
| `/aion/cliente/pedido` | Estado en tiempo real del pedido (polling cada 10 s) | BD — `orders` |

### Vista Staff — `/aion/staff`

| Ruta | Descripción | Datos |
|---|---|---|
| `/aion/staff` | Kanban: Pendiente → Preparando → Listo. Polling cada 15 s. Los botones avanzan el estado en BD | BD — `orders` |

### Vista Administrador — `/aion/admin/`

| Ruta | Descripción | Datos |
|---|---|---|
| `/aion/admin` | Dashboard con KPIs reales: ventas del mes, pedidos, ticket promedio, clientes. Gráfica de 7 días y top 5 platos | BD — `sales`, `orders`, `users`, `order_items` |
| `/aion/admin/menu` | Listado completo del menú con disponibilidad | BD — `menu_items` |
| `/aion/admin/gastos` | Registro y reporte mensual de gastos operativos | BD — `expenses`, `sales` |

---

## API Routes

### Autenticación

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login — devuelve access + refresh tokens en cookies httpOnly | No |
| `POST` | `/api/auth/register` | Crea usuario con rol `customer` | No |
| `POST` | `/api/auth/logout` | Borra cookies de sesión | No |
| `POST` | `/api/auth/refresh` | Renueva el access token con el refresh token | No |

### Restaurante

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/restaurant` | Retorna el restaurante activo (nombre, ID, dirección) | No |

### Reservas y mesas

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/reservas/mesas` | Mesas disponibles. Params: `restaurantId`, `date`, `time`, `partySize` | No |
| `POST` | `/api/reservas` | Crea reserva. Sin sesión crea usuario guest automáticamente | Opcional |
| `GET` | `/api/reservas` | Lista reservas del restaurante activo | Admin/Staff |

### Pedidos

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/orders` | Crea orden con ítems del carrito para el restaurante | No |
| `GET` | `/api/pedido?orderId=` | Estado en tiempo real de una orden | No |
| `GET` | `/api/staff/orders` | Órdenes activas (pending/preparing/ready) | Staff/Admin |
| `PATCH` | `/api/staff/orders/[id]` | Avanza estado de orden. Al entregar → crea venta automáticamente | Staff/Admin |

### Gastos y reportes

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/admin/expenses?year=&month=` | Lista gastos del mes | Admin |
| `POST` | `/api/admin/expenses` | Registra un nuevo gasto | Admin |
| `GET` | `/api/admin/expenses/report?year=&month=` | Reporte: ventas, costos, gastos y ganancia | Admin |

### Otros

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/chat` | Chat con IA usando RAG sobre el menú del restaurante |
| `GET` | `/api/test-mongo` | Prueba de conexión a MongoDB |

---

## Estructura completa del proyecto

```
AION1.2/
│
├── prisma/
│   ├── schema.prisma              # Modelos de todas las tablas de la BD
│   ├── seed.ts                    # Datos iniciales: restaurante, usuarios, menú, mesas, órdenes, gastos
│   ├── migrations/                # Historial de migraciones SQL
│   └── prisma.config.ts           # Configuración Prisma 7 (datasource URL)
│
├── src/
│   │
│   ├── app/                       # Next.js App Router
│   │   │
│   │   ├── page.tsx               # Raíz "/" — página de bienvenida + chat IA
│   │   │
│   │   ├── reservar/
│   │   │   └── page.tsx           # "/reservar" — formulario de reserva público
│   │   │
│   │   ├── aion/
│   │   │   ├── page.tsx           # "/aion" — landing con accesos por rol
│   │   │   ├── login/page.tsx     # "/aion/login" — formulario de login
│   │   │   ├── registro/page.tsx  # "/aion/registro" — formulario de registro
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx     # Layout del panel admin
│   │   │   │   ├── page.tsx       # "/aion/admin" — dashboard KPIs reales
│   │   │   │   ├── menu/page.tsx  # "/aion/admin/menu" — gestión del menú
│   │   │   │   └── gastos/page.tsx # "/aion/admin/gastos" — gastos operativos
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   └── page.tsx       # "/aion/staff" — kanban de pedidos en tiempo real
│   │   │   │
│   │   │   └── cliente/
│   │   │       ├── layout.tsx     # Proveedor del carrito (AionCartProvider)
│   │   │       ├── menu/page.tsx          # "/aion/cliente/menu"
│   │   │       ├── plato/[id]/page.tsx    # "/aion/cliente/plato/:id"
│   │   │       ├── carrito/page.tsx       # "/aion/cliente/carrito"
│   │   │       ├── reserva-hora/page.tsx  # "/aion/cliente/reserva-hora"
│   │   │       ├── confirmacion/page.tsx  # "/aion/cliente/confirmacion"
│   │   │       └── pedido/page.tsx        # "/aion/cliente/pedido"
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts     # POST /api/auth/login
│   │       │   ├── register/route.ts  # POST /api/auth/register
│   │       │   ├── logout/route.ts    # POST /api/auth/logout
│   │       │   └── refresh/route.ts   # POST /api/auth/refresh
│   │       ├── restaurant/route.ts    # GET /api/restaurant
│   │       ├── reservas/
│   │       │   ├── route.ts           # GET + POST /api/reservas
│   │       │   └── mesas/route.ts     # GET /api/reservas/mesas
│   │       ├── orders/route.ts        # POST /api/orders
│   │       ├── pedido/route.ts        # GET /api/pedido
│   │       ├── staff/
│   │       │   └── orders/
│   │       │       ├── route.ts       # GET /api/staff/orders
│   │       │       └── [id]/route.ts  # PATCH /api/staff/orders/:id
│   │       ├── admin/
│   │       │   └── expenses/
│   │       │       ├── route.ts       # GET + POST /api/admin/expenses
│   │       │       └── report/route.ts # GET /api/admin/expenses/report
│   │       ├── chat/route.ts          # POST /api/chat
│   │       └── test-mongo/route.ts    # GET /api/test-mongo
│   │
│   ├── lib/
│   │   ├── prisma.ts              # Singleton de PrismaClient con adaptador PrismaPg (Neon)
│   │   │
│   │   ├── auth/
│   │   │   ├── jwt.ts             # signAccessToken(), signRefreshToken(), verifyAccessToken()
│   │   │   ├── session.ts         # getServerSession(), requireTenantSession()
│   │   │   ├── validators.ts      # isValidEmail(), isStrongPassword(), isValidName()
│   │   │   └── prisma-error.ts    # Mapeo errores Prisma → respuesta HTTP legible
│   │   │
│   │   ├── aion/
│   │   │   ├── tokens.ts          # Design tokens: colores, radios, espaciado del sistema
│   │   │   ├── types.ts           # Tipos TS: AionDish, AionStaffOrder, OrderState, AionKpi
│   │   │   ├── menu-items.ts      # fetchAionMenuDishes(), fetchAionDishById() — Prisma
│   │   │   ├── currency.ts        # formatCOP(n) — formato moneda colombiana (COP)
│   │   │   └── preorder-storage.ts # savePreorderMeta(), loadPreorderMeta() — sessionStorage
│   │   │
│   │   ├── db/
│   │   │   ├── expenses.ts        # createExpense(), getExpensesByMonth(), getMonthlyProfit()
│   │   │   ├── reservations.ts    # getAvailableTables(), createReservation()
│   │   │   ├── mongodb.ts         # Singleton de conexión a MongoDB
│   │   │   └── models/
│   │   │       ├── AiLog.ts       # Schema Mongoose: logs de interacciones IA
│   │   │       └── Conversation.ts # Schema Mongoose: historial de conversaciones
│   │   │
│   │   └── ai/
│   │       └── log.ts             # logAIInteraction() → guarda en MongoDB
│   │
│   ├── components/
│   │   └── aion/
│   │       ├── admin/
│   │       │   ├── sidebar-nav.tsx       # Sidebar de navegación para el panel admin
│   │       │   └── menu-table-toggle.tsx # Toggle ON/OFF de disponibilidad de platos
│   │       │
│   │       ├── auth/
│   │       │   ├── logout-button.tsx     # Botón que llama POST /api/auth/logout
│   │       │   └── password-field.tsx    # Input de contraseña con botón mostrar/ocultar
│   │       │
│   │       ├── client/
│   │       │   ├── menu-page-client.tsx  # Lógica client: filtros y búsqueda del menú
│   │       │   ├── menu-card.tsx         # Tarjeta de plato en el listado del menú
│   │       │   └── dish-add-button.tsx   # Botón con contador para agregar al carrito
│   │       │
│   │       ├── providers/
│   │       │   └── cart-state.tsx        # Context del carrito: useState + sessionStorage
│   │       │
│   │       ├── ui/
│   │       │   ├── aion-dish-thumbnail.tsx # Avatar circular con iniciales del plato
│   │       │   └── badge.tsx               # Badges de categoría y etiquetas dietéticas
│   │       │
│   │       └── icons.tsx                 # SVG icons: Search, Filter, QR, Clock, etc.
│   │
│   ├── types/
│   │   └── database.ts            # Interfaces TS de todas las tablas + tipo Database
│   │
│   └── data/
│       ├── aion-dishes.ts         # Labels de categorías para la UI (sin datos hardcodeados)
│       └── dishes.ts              # Dataset de platos para el RAG del chat IA
│
├── public/                        # Archivos estáticos
├── .env                           # DATABASE_URL para Prisma CLI (prisma studio, db:push)
├── .env.local                     # Variables de entorno de la app (cargadas por Next.js)
├── prisma.config.ts               # Configuración Prisma 7: datasource URL desde env
├── next.config.ts                 # Configuración de Next.js
├── menu_il_cafeto.csv             # Fuente original del menú de Il Cafeto (84 productos)
├── tsconfig.json                  # Configuración TypeScript con alias @/
└── eslint.config.mjs              # Configuración ESLint
```

---

## Base de datos — Modelos

| Tabla | Descripción |
|---|---|
| `restaurants` | Restaurantes de la plataforma |
| `users` | Usuarios: `admin`, `staff`, `customer` |
| `user_restaurants` | Relación usuario ↔ restaurante con rol (multi-tenant) |
| `tables` | Mesas con capacidad, estado y QR |
| `menu_items` | Platos del menú: precio, categoría, stock, costo, disponibilidad |
| `orders` | Órdenes de pedido — ciclo completo de estados |
| `order_items` | Líneas de cada orden (plato × cantidad × precio unitario) |
| `reservations` | Reservas de mesa vinculadas a un usuario y fecha |
| `sales` | Ventas cerradas — se crean automáticamente al entregar una orden |
| `expenses` | Gastos operativos categorizados por mes |
| `rewards` | Recompensas de fidelidad para clientes |
| `user_levels` | Nivel gamificado del cliente (explorer → adventurer → gourmet → master) |

---

## Flujo de estados de una orden

```
BD:  pending ──→ preparing ──→ ready ──→ delivered
                                              ↓
UI:  pendiente → preparando  → listo → [crea sales automáticamente]

Staff presiona "Iniciar"  → PATCH /api/staff/orders/:id → pending → preparing
Staff presiona "Listo"    → PATCH /api/staff/orders/:id → preparing → ready
Staff presiona "Entregar" → PATCH /api/staff/orders/:id → ready → delivered + INSERT sales
```

---

## Flujo completo de una preorden (vista cliente)

```
1. /aion/cliente/menu
   └── Navega el menú, filtra por categoría, busca y agrega platos al carrito

2. /aion/cliente/carrito
   └── Revisa y ajusta cantidades antes de continuar

3. /aion/cliente/reserva-hora
   ├── Busca mesas disponibles → GET /api/reservas/mesas
   ├── Selecciona mesa, fecha, hora y datos personales
   ├── Al confirmar:
   │   ├── POST /api/reservas  → crea reservación en BD
   │   └── POST /api/orders    → crea orden con los ítems del carrito en BD
   └── Guarda { orderRef, orderId, items... } en sessionStorage

4. /aion/cliente/confirmacion
   └── Muestra el código de reserva y el resumen de la preorden

5. /aion/cliente/pedido
   └── Polling cada 10 s → GET /api/pedido?orderId=...
       Muestra timeline: recibido → cocina → listo → servido
```

---

## Autenticación — JWT doble token

| Token | Cookie | Duración | Uso |
|---|---|---|---|
| Access Token | `aion_access_token` | 15 minutos | Autenticar cada request |
| Refresh Token | `aion_refresh_token` | 7 días | Renovar el access token |

Ambas cookies son `httpOnly` — inaccesibles desde JavaScript del navegador.

**Payload del JWT:**
```json
{
  "id": "uuid-del-usuario",
  "email": "user@email.com",
  "role": "admin | staff | customer",
  "restaurantId": "uuid-del-restaurante | null"
}
```

**Redireccionamiento por rol después del login:**
- `admin` → `/aion/admin`
- `staff` → `/aion/staff`
- `customer` → `/aion/cliente/menu`

---

## Menú — Il Cafeto (84 productos)

| Categoría | Cantidad |
|---|---|
| Cafés | 17 |
| Sándwiches | 11 |
| Bebidas | 14 |
| Entradas | 7 |
| Cócteles | 6 |
| Cervezas | 5 |
| Smoothies | 5 |
| Vino | 4 |
| Carnes | 6 |
| Sangría | 3 |
| Adiciones | 3 |
| Postres | 2 |
| Ensaladas | 1 |

Los productos se importan desde `menu_il_cafeto.csv` al ejecutar `npm run db:seed`.

---

## Datos de prueba (generados por el seed)

El seed crea automáticamente:

- **1 restaurante**: Il Cafeto (Calle 93 #15-23, Bogotá)
- **7 usuarios**: 1 admin + 3 staff + 3 clientes
- **12 mesas**: números 1-8 (capacidad 4) y 9-12 (capacidad 6)
- **84 ítems del menú**
- **3 órdenes** de ejemplo con sus order_items
- **2 ventas** registradas
- **3 reservaciones** futuras
- **5 gastos** con todas las categorías
- **3 niveles de usuario** y **4 recompensas**

---

## Notas técnicas importantes

### Prisma 7 — cambios respecto a versiones anteriores

- `url` y `directUrl` **ya no van en `schema.prisma`** — se configuran en `prisma.config.ts`
- Se usa el adaptador `PrismaPg` (driver de node-postgres) en lugar de la conexión directa
- El cliente se inicializa con `new PrismaClient({ adapter })` — ver `src/lib/prisma.ts`

### Neon — conexión desde node-postgres

- El parámetro `channel_binding=require` no es soportado por `pg` — se elimina automáticamente en `src/lib/prisma.ts`
- Se usa `ssl: { rejectUnauthorized: false }` para conexiones a Neon y Supabase

### Regla principal de arquitectura

> Los componentes `"use client"` **nunca** llaman a Prisma directamente.  
> Toda consulta a la BD desde el browser va a través de un **API route**.  
> Los Server Components sí pueden llamar Prisma directamente.
