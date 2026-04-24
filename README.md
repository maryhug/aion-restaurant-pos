# AION POS

Sistema inteligente de gestion para restaurantes y cafeterias.

Stack principal: `Next.js` + `TypeScript` + `Supabase (PostgreSQL)` + `MongoDB` + `JWT`.

## Inicio rapido

1. Instalar dependencias:
```bash
npm install
```
2. Configurar variables de entorno en `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
3. Ejecutar en local:
```bash
npm run dev
```
4. Abrir:
- `http://localhost:3000/aion`

## Arquitectura por modulos

El sistema esta dividido en 5 modulos funcionales para repartir trabajo y explicacion en equipo.

---

## 1) Modulo Autenticacion

### Responsabilidad
- Registro y login.
- Emision de `access token` y `refresh token`.
- Control de roles (`client`, `staff`, `admin`).
- Proteccion de rutas via proxy/middleware.

### Rutas principales
- UI:
  - `GET /aion/login`
  - `GET /aion/registro`
- API:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Proteccion:
  - `src/proxy.ts` protege:
    - `/aion/admin/:path*`
    - `/aion/staff/:path*`

### Paso a paso del flujo
1. Usuario envia email/password en login o registro.
2. Backend valida formato y reglas de password.
3. En registro, password se hashea con `bcryptjs`.
4. En login, se compara password plano vs hash con `bcrypt.compare`.
5. Se generan:
   - access token (corto)
   - refresh token (mas largo)
6. Ambos se guardan en cookies `httpOnly`.
7. Si access expira, `refresh` emite nuevo access automaticamente.
8. `logout` limpia cookies de sesion.

### Archivos clave
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/validators.ts`
- `src/proxy.ts`

---

## 2) Modulo Staff

### Responsabilidad
- Operacion diaria de pedidos.
- Gestion de estados de orden.
- Control basico de ocupacion de mesas.

### Rutas principales
- UI:
  - `GET /aion/staff`
- API esperadas para evolucion:
  - `GET /api/staff/orders/active`
  - `PATCH /api/staff/orders/:id/status`
  - `PATCH /api/staff/tables/:id/status`
  - `POST /api/staff/checkin`

### Paso a paso del flujo operativo
1. Staff abre dashboard de ordenes activas.
2. Cocina cambia estado:
   - `pending -> preparing -> ready -> delivered`
3. Al llegar cliente se hace check-in manual.
4. Al entregar y cerrar orden, mesa pasa a disponible.
5. Staff monitorea urgencias y colas en tiempo real.

### Archivos clave actuales
- `src/app/aion/staff/page.tsx`

> Nota: parte de staff esta en modo demo UI; el siguiente paso es conectar totalmente con tablas `orders` y `tables` de Supabase.

---

## 3) Modulo Admin

### Responsabilidad
- Gobierno del negocio: menu, mesas, usuarios staff y reportes.

### Rutas principales
- UI:
  - `GET /aion/admin`
  - `GET /aion/admin/menu`
- API esperadas para evolucion:
  - `GET/POST/PATCH/DELETE /api/admin/products`
  - `GET/POST/PATCH/DELETE /api/admin/tables`
  - `GET/POST/PATCH /api/admin/shifts`
  - `GET/POST/PATCH/DELETE /api/admin/staff-users`
  - `GET /api/admin/reports/sales`

### Paso a paso del flujo administrativo
1. Admin gestiona productos:
   - nombre, precio, categoria, disponibilidad, foto.
2. Admin gestiona mesas:
   - numero, capacidad, QR.
3. Configura horarios/turnos operativos.
4. Da de alta o baja usuarios de staff.
5. Consulta dashboard de ventas y reportes.

### Archivos clave actuales
- `src/app/aion/admin/page.tsx`
- `src/app/aion/admin/menu/page.tsx`
- `src/components/aion/admin/sidebar-nav.tsx`

---

## 4) Modulo Cliente

### Responsabilidad
- Experiencia de usuario final: menu, carrito, reserva y estado del pedido.

### Rutas principales
- `GET /aion/cliente/menu`
- `GET /aion/cliente/plato/[id]`
- `GET /aion/cliente/carrito`
- `GET /aion/cliente/reserva-hora`
- `GET /aion/cliente/confirmacion`
- `GET /aion/cliente/pedido`

### Paso a paso del flujo cliente
1. Cliente entra por QR/link.
2. Explora menu con filtros y busqueda.
3. Agrega platos a carrito de preorden.
4. Elige fecha/hora y datos de reserva.
5. Confirma preorden + reserva.
6. Visualiza estado del pedido.
7. Consulta historial (pendiente de conexion total).

### Archivos clave
- `src/app/aion/cliente/*`
- `src/components/aion/client/*`
- `src/components/aion/providers/cart-state.tsx`
- `src/lib/aion/preorder-storage.ts`

---

## 5) Modulo Reserva

### Responsabilidad
- Orquestar disponibilidad, reserva, preorden y confirmacion.

### Rutas principales
- UI:
  - `GET /aion/cliente/reserva-hora`
  - `GET /aion/cliente/confirmacion`
- API actuales relacionadas:
  - `src/lib/db/reservations.ts` (base de consultas/reserva)
- API esperadas para evolucion:
  - `POST /api/booking/reservations`
  - `GET /api/booking/availability`
  - `PATCH /api/booking/reservations/:id`
  - `DELETE /api/booking/reservations/:id`
  - `POST /api/booking/reservations/:id/preorder`
  - `POST /api/booking/reservations/:id/notify`

### Paso a paso del flujo de reserva
1. Cliente selecciona fecha/hora/personas.
2. Sistema valida disponibilidad en tiempo real.
3. Se crea reserva y se asocia preorden.
4. Se genera identificador (QR o link).
5. Se envia confirmacion.
6. Cliente puede cancelar/modificar bajo reglas de tiempo minimo.

---

## Integracion con Supabase

### Cliente Supabase
- `src/lib/db/supabase.ts`

### Tablas principales usadas
- `users`
- `menu_items`
- `tables`
- `reservations`
- `orders`
- `order_items`
- `restaurants`

### Tipado de BD
- `src/types/database.ts`

---

## Reparto sugerido para exposicion en equipo

- Integrante 1: **Autenticacion** (JWT, refresh, proxy de roles).
- Integrante 2: **Staff** (cola cocina, estados, check-in/mesas).
- Integrante 3: **Admin** (menu, mesas, reportes, staff users).
- Integrante 4: **Cliente** (menu, carrito, perfil/historial, estado).
- Integrante 5: **Reserva** (disponibilidad, asociacion preorden, confirmaciones).

---

## Preparacion para examen (repos separados)

Como en el examen **no compartiran repositorio**, usen este esquema:

- Solo `Auth` se comparte por contrato (login/register/refresh/logout).
- Cada modulo debe poder correr sin importar el codigo interno de los otros.
- La integracion entre modulos se hace por HTTP (API), no por imports cruzados.

### Contrato comun obligatorio (Auth)

Endpoints compartidos:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Respuesta esperada de `login/register`:

- `accessToken`
- `refreshToken`
- `user: { id, name, email, role }`

Roles:

- `client`
- `staff`
- `admin`

Regla:

- Ningun modulo (Staff/Admin/Cliente/Reserva) implementa su propio login.
- Todos consumen este contrato.

---

## Matriz exacta por integrante (para no pisarse)

### Integrante A - Modulo Auth

**Se lleva:**

- `src/app/api/auth/*`
- `src/lib/auth/*`
- `src/proxy.ts`

**Debe exponer en examen:**

1. Validaciones de credenciales
2. Hash y verificacion de password
3. Access/refresh token
4. Control de roles y proteccion de rutas

**Entregable independiente:**

- Microservicio/API auth funcional con contrato estable

---

### Integrante B - Modulo Staff

**Se lleva:**

- `src/app/aion/staff/*`
- (si crea API) `src/app/api/staff/*`

**Debe exponer en examen:**

1. Cola de cocina y ordenes activas
2. Cambio de estado `pending -> preparing -> ready -> delivered`
3. Check-in manual
4. Liberacion de mesa

**Dependencias permitidas:**

- Solo consumo de Auth (token + role)
- Solo lectura/escritura de tablas propias (`orders`, `tables`)

---

### Integrante C - Modulo Admin

**Se lleva:**

- `src/app/aion/admin/*`
- `src/components/aion/admin/*`
- (si crea API) `src/app/api/admin/*`

**Debe exponer en examen:**

1. CRUD productos
2. Gestion mesas
3. Turnos/horarios
4. Gestion de staff users
5. Reportes y dashboard

**Dependencias permitidas:**

- Auth por rol `admin`
- Datos de `menu_items`, `tables`, `sales`, `users`

---

### Integrante D - Modulo Cliente

**Se lleva:**

- `src/app/aion/cliente/*`
- `src/components/aion/client/*`
- `src/components/aion/providers/cart-state.tsx`
- `src/lib/aion/*` (solo cliente)

**Debe exponer en examen:**

1. Exploracion de menu con filtros
2. Carrito de preorden
3. Historial de pedidos/reservas
4. Estado de pedido en tiempo real

**Dependencias permitidas:**

- Auth `client`
- API de Reserva para confirmar flujo

---

### Integrante E - Modulo Reserva

**Se lleva:**

- `src/app/aion/cliente/reserva-hora/*` y confirmacion relacionada
- `src/lib/db/reservations.ts`
- (si crea API) `src/app/api/booking/*`

**Debe exponer en examen:**

1. Crear reserva
2. Asociar preorden
3. Validar disponibilidad en tiempo real
4. Generar QR/link
5. Cancelar/modificar con reglas

**Dependencias permitidas:**

- Auth para identificar usuario
- Tablas `reservations`, `tables`, `orders`

---

## Checklist rapido para independencia real (obligatorio)

Antes del examen, cada integrante valida:

1. Su modulo compila y corre sin importar codigo interno de otros modulos.
2. No tiene imports directos a logica de otro modulo (solo contratos/API).
3. Tiene variables de entorno propias documentadas.
4. Tiene un README corto de su modulo: rutas, flujo, errores comunes.
5. Tiene 3 demos minimas:
   - caso exitoso
   - caso de validacion/error
   - caso borde

---

## Guion corto para responder si preguntan

"El sistema esta modularizado por responsabilidad de negocio.  
Auth es transversal y se comparte solo por contrato de API.  
Staff, Admin, Cliente y Reserva se ejecutan en repos separados y se integran via endpoints versionados.  
Esto reduce acoplamiento y permite trabajo paralelo por equipo."

---

## Estado actual

- Ya existe base funcional end-to-end de UI para los 5 modulos.
- Auth con access/refresh tokens implementado.
- Rutas sensibles (`/aion/admin`, `/aion/staff`) protegidas por rol.
- Parte de datos ya es dinamica desde Supabase (menu y admin menu).
- Faltantes recomendados: completar endpoints por modulo y realtime para staff.
