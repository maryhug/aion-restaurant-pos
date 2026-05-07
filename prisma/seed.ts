import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DATABASE_URL o DIRECT_URL");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Datos del menú (exportados de menu_il_cafeto.csv) — no se modifican
// ---------------------------------------------------------------------------
const menuItems = [
  // Smoothies
  { category: "Smoothies", name: "Mango naranja", price: 16000 },
  { category: "Smoothies", name: "Fresa naranja limón", price: 16000 },
  { category: "Smoothies", name: "Fresa naranja banano", price: 16000 },
  { category: "Smoothies", name: "Piña naranja mora", price: 16000 },
  { category: "Smoothies", name: "Piña naranja banano", price: 16000 },
  // Cervezas
  { category: "Cervezas", name: "BBC", price: 12000 },
  { category: "Cervezas", name: "3 Cordilleras", price: 12000 },
  { category: "Cervezas", name: "Club Colombia", price: 9000 },
  { category: "Cervezas", name: "Corona", price: 12000 },
  { category: "Cervezas", name: "Stella", price: 12000 },
  // Cócteles
  { category: "Cócteles", name: "Colimocho", price: 28000 },
  { category: "Cócteles", name: "Tinto de verano", price: 26000 },
  { category: "Cócteles", name: "Mojito", price: 27000 },
  { category: "Cócteles", name: "Cuba libre", price: 26000 },
  { category: "Cócteles", name: "Muller", price: 25000 },
  { category: "Cócteles", name: "Margarita", price: 26000 },
  // Sangría
  { category: "Sangría", name: "Copa sangría", price: 25000 },
  { category: "Sangría", name: "Jarra x2", price: 40000 },
  { category: "Sangría", name: "Jarra x5", price: 70000 },
  // Vino
  { category: "Vino", name: "Vino casa", price: 20000 },
  { category: "Vino", name: "Vino rosado", price: 22000 },
  { category: "Vino", name: "Vino blanco", price: 23000 },
  { category: "Vino", name: "Merlot", price: 25000 },
  // Entradas
  { category: "Entradas", name: "Maíz sencillo", price: 22000 },
  { category: "Entradas", name: "Maíz especial", price: 28000 },
  { category: "Entradas", name: "Nachos", price: 18000 },
  { category: "Entradas", name: "Cazuela pequeña", price: 23000 },
  { category: "Entradas", name: "Cazuela grande", price: 28500 },
  { category: "Entradas", name: "Tabla de queso", price: 60000 },
  { category: "Entradas", name: "Combinado ibérico", price: 75000 },
  // Cafés
  { category: "Cafés", name: "Expreso", price: 5000 },
  { category: "Cafés", name: "Americano", price: 7000 },
  { category: "Cafés", name: "Capuchino", price: 8500 },
  { category: "Cafés", name: "Moka caliente", price: 9000 },
  { category: "Cafés", name: "Carajillo amaretto", price: 11000 },
  { category: "Cafés", name: "Carajillo whisky", price: 14000 },
  { category: "Cafés", name: "Carajillo vino", price: 15000 },
  { category: "Cafés", name: "Carajillo coñac", price: 11000 },
  { category: "Cafés", name: "Carajillo ron", price: 9500 },
  { category: "Cafés", name: "Latte macchiato", price: 15000 },
  { category: "Cafés", name: "Irlandés", price: 15000 },
  { category: "Cafés", name: "Café helado", price: 13000 },
  { category: "Cafés", name: "Moka frío", price: 14500 },
  { category: "Cafés", name: "Frapuchino", price: 15000 },
  { category: "Cafés", name: "Aromática tradicional", price: 5000 },
  { category: "Cafés", name: "Aromática frutos rojos", price: 7000 },
  { category: "Cafés", name: "Té chai", price: 9000 },
  // Postres
  { category: "Postres", name: "Brownie", price: 14000 },
  { category: "Postres", name: "Fresas chantilli", price: 15500 },
  // Sándwiches
  { category: "Sándwiches", name: "Ibérico", price: 35000 },
  { category: "Sándwiches", name: "IL Cafeto Mixto", price: 26500 },
  { category: "Sándwiches", name: "Tradicional", price: 20000 },
  { category: "Sándwiches", name: "Hawaiano", price: 20000 },
  { category: "Sándwiches", name: "Pollo", price: 26000 },
  { category: "Sándwiches", name: "Pollo desmechado", price: 23000 },
  { category: "Sándwiches", name: "Carne desmechada", price: 26000 },
  { category: "Sándwiches", name: "Bacon", price: 25000 },
  { category: "Sándwiches", name: "Vegetariano", price: 22000 },
  { category: "Sándwiches", name: "Atún", price: 26000 },
  { category: "Sándwiches", name: "Cerdo", price: 25000 },
  // Carnes
  { category: "Carnes", name: "Brocheta de cerdo", price: 36000 },
  { category: "Carnes", name: "Pechuga gratinada", price: 40000 },
  { category: "Carnes", name: "Cañón", price: 39000 },
  { category: "Carnes", name: "Milanesa", price: 39000 },
  { category: "Carnes", name: "Solomito", price: 42000 },
  { category: "Carnes", name: "Salmón", price: 47000 },
  // Ensaladas
  { category: "Ensaladas", name: "Ensalada en bowl", price: 30000 },
  // Adiciones
  { category: "Adiciones", name: "Adición queso", price: 5000 },
  { category: "Adiciones", name: "Champiñones", price: 5000 },
  { category: "Adiciones", name: "Tocineta", price: 7000 },
  // Bebidas
  { category: "Bebidas", name: "Limonada natural", price: 8500 },
  { category: "Bebidas", name: "Limonada lychee", price: 14500 },
  { category: "Bebidas", name: "Coco", price: 15000 },
  { category: "Bebidas", name: "Cereza", price: 14000 },
  { category: "Bebidas", name: "Hierbabuena", price: 10000 },
  { category: "Bebidas", name: "Piña hierbabuena", price: 13000 },
  { category: "Bebidas", name: "Jugo agua", price: 7500 },
  { category: "Bebidas", name: "Jugo leche", price: 9000 },
  { category: "Bebidas", name: "Avena", price: 11500 },
  { category: "Bebidas", name: "Milo frío", price: 10500 },
  { category: "Bebidas", name: "Botella agua", price: 6000 },
  { category: "Bebidas", name: "Soda michelada", price: 9000 },
  { category: "Bebidas", name: "Soda saborizada", price: 14000 },
  { category: "Bebidas", name: "Batido de proteína", price: 18000 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsertUser(
  email: string,
  name: string,
  password: string,
  role: string,
) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) return existing;
  const hashed = await bcrypt.hash(password, 12);
  return prisma.users.create({ data: { email, name, password: hashed, role } });
}

async function linkToRestaurant(
  userId: string,
  restaurantId: string,
  role: string,
) {
  const exists = await prisma.user_restaurants.findUnique({
    where: {
      user_id_restaurant_id: { user_id: userId, restaurant_id: restaurantId },
    },
  });
  if (!exists) {
    await prisma.user_restaurants.create({
      data: { user_id: userId, restaurant_id: restaurantId, role },
    });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Iniciando seed...");

  // ── 1. Restaurante ────────────────────────────────────────────────────────
  let restaurant = await prisma.restaurants.findFirst({
    where: { name: "Il Cafeto" },
  });
  if (!restaurant) {
    restaurant = await prisma.restaurants.create({
      data: {
        name: "Il Cafeto",
        address: "Calle 93 #15-23, Bogotá",
        phone: "601-3456789",
      },
    });
    console.log(`Restaurante creado: ${restaurant.id}`);
  } else {
    console.log(`Restaurante existente: ${restaurant.id}`);
  }

  // ── 2. Usuarios (uno por cada rol) ───────────────────────────────────────
  const adminUser = await upsertUser(
    "admin@ilcafeto.com",
    "Admin Il Cafeto",
    "ilcafeto2024!",
    "admin",
  );
  const staffUser1 = await upsertUser(
    "staff1@ilcafeto.com",
    "Carlos Mesero",
    "Staff1234!",
    "staff",
  );
  const staffUser2 = await upsertUser(
    "staff2@ilcafeto.com",
    "Laura Barista",
    "Staff1234!",
    "staff",
  );
  const staffUser3 = await upsertUser(
    "staff3@ilcafeto.com",
    "Andrés Cajero",
    "Staff1234!",
    "staff",
  );
  const customer1 = await upsertUser(
    "cliente1@gmail.com",
    "María García",
    "Cliente1234!",
    "customer",
  );
  const customer2 = await upsertUser(
    "cliente2@gmail.com",
    "Juan Rodríguez",
    "Cliente1234!",
    "customer",
  );
  const customer3 = await upsertUser(
    "cliente3@gmail.com",
    "Sofía Martínez",
    "Cliente1234!",
    "customer",
  );

  console.log("Usuarios listos (admin x1, staff x3, customer x3)");

  // ── 3. Membresías al restaurante ─────────────────────────────────────────
  await linkToRestaurant(adminUser.id, restaurant.id, "admin");
  await linkToRestaurant(staffUser1.id, restaurant.id, "staff");
  await linkToRestaurant(staffUser2.id, restaurant.id, "staff");
  await linkToRestaurant(staffUser3.id, restaurant.id, "staff");
  console.log("Membresías listas");

  // ── 4. Mesas ─────────────────────────────────────────────────────────────
  const existingTables = await prisma.tables.count({
    where: { restaurant_id: restaurant.id },
  });
  if (existingTables === 0) {
    await prisma.tables.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        restaurant_id: restaurant!.id,
        number: i + 1,
        capacity: i < 8 ? 4 : 6,
        status: "available",
      })),
    });
    console.log("12 mesas creadas");
  } else {
    console.log(`Mesas existentes: ${existingTables}`);
  }

  // ── 5. Menú ───────────────────────────────────────────────────────────────
  let menuCreated = 0;
  let menuUpdated = 0;
  for (const item of menuItems) {
    const existing = await prisma.menu_items.findFirst({
      where: { restaurant_id: restaurant.id, name: item.name },
    });
    if (existing) {
      await prisma.menu_items.update({
        where: { id: existing.id },
        data: { price: item.price, category: item.category },
      });
      menuUpdated++;
    } else {
      await prisma.menu_items.create({
        data: {
          restaurant_id: restaurant.id,
          name: item.name,
          price: item.price,
          category: item.category,
          available: true,
        },
      });
      menuCreated++;
    }
  }
  console.log(`Menú: ${menuCreated} creados, ${menuUpdated} actualizados`);

  // ── 6. Niveles de usuario ─────────────────────────────────────────────────
  const levelData = [
    { userId: customer1.id, level: "explorer", xp: 0, visits: 0 },
    { userId: customer2.id, level: "adventurer", xp: 350, visits: 7 },
    { userId: customer3.id, level: "gourmet", xp: 1100, visits: 22 },
  ];
  for (const ld of levelData) {
    const exists = await prisma.user_levels.findUnique({
      where: { user_id: ld.userId },
    });
    if (!exists) {
      await prisma.user_levels.create({
        data: {
          user_id: ld.userId,
          level: ld.level,
          xp: ld.xp,
          total_visits: ld.visits,
        },
      });
    }
  }
  console.log("Niveles de usuario listos");

  // ── 7. Recompensas ────────────────────────────────────────────────────────
  const rewardData = [
    {
      userId: customer1.id,
      type: "welcome_drink",
      value: "Smoothie gratis",
      claimed: false,
    },
    {
      userId: customer2.id,
      type: "discount_10",
      value: "10% descuento",
      claimed: true,
    },
    {
      userId: customer3.id,
      type: "free_dessert",
      value: "Postre gratis",
      claimed: false,
    },
    {
      userId: customer3.id,
      type: "discount_15",
      value: "15% descuento",
      claimed: true,
    },
  ];
  const rewardsCount = await prisma.rewards.count({
    where: { user_id: { in: [customer1.id, customer2.id, customer3.id] } },
  });
  if (rewardsCount === 0) {
    for (const r of rewardData) {
      await prisma.rewards.create({
        data: {
          user_id: r.userId,
          type: r.type,
          value: r.value,
          claimed: r.claimed,
        },
      });
    }
    console.log(`${rewardData.length} recompensas creadas`);
  } else {
    console.log(`Recompensas existentes: ${rewardsCount}`);
  }

  // ── 8. Órdenes, items y ventas ────────────────────────────────────────────
  const allTables = await prisma.tables.findMany({
    where: { restaurant_id: restaurant.id },
    orderBy: { number: "asc" },
  });
  const allMenuItems = await prisma.menu_items.findMany({
    where: { restaurant_id: restaurant.id },
  });

  const pick = (arr: typeof allMenuItems, name: string) =>
    arr.find((m) => m.name === name) ?? arr[0];

  const existingOrders = await prisma.orders.count();
  if (existingOrders === 0) {
    // Orden 1 — entregada, mesa 1
    const mojito = pick(allMenuItems, "Mojito");
    const nachos = pick(allMenuItems, "Nachos");
    const order1 = await prisma.orders.create({
      data: {
        table_id: allTables[0].id,
        status: "delivered",
        total: Number(mojito.price) + Number(nachos.price),
        created_at: new Date("2026-05-01T19:30:00Z"),
      },
    });
    await prisma.order_items.createMany({
      data: [
        {
          order_id: order1.id,
          menu_item_id: mojito.id,
          quantity: 1,
          unit_price: mojito.price,
        },
        {
          order_id: order1.id,
          menu_item_id: nachos.id,
          quantity: 1,
          unit_price: nachos.price,
        },
      ],
    });
    await prisma.sales.create({
      data: {
        order_id: order1.id,
        restaurant_id: restaurant.id,
        table_id: allTables[0].id,
        total: order1.total,
        payment_method: "cash",
        cash_received: 60000,
        change_given: 60000 - Number(order1.total),
        created_at: new Date("2026-05-01T20:00:00Z"),
      },
    });

    // Orden 2 — entregada, mesa 3
    const solomito = pick(allMenuItems, "Solomito");
    const cerveza = pick(allMenuItems, "Club Colombia");
    const order2 = await prisma.orders.create({
      data: {
        table_id: allTables[2].id,
        status: "delivered",
        total: Number(solomito.price) + Number(cerveza.price) * 2,
        created_at: new Date("2026-05-02T20:15:00Z"),
      },
    });
    await prisma.order_items.createMany({
      data: [
        {
          order_id: order2.id,
          menu_item_id: solomito.id,
          quantity: 1,
          unit_price: solomito.price,
        },
        {
          order_id: order2.id,
          menu_item_id: cerveza.id,
          quantity: 2,
          unit_price: cerveza.price,
        },
      ],
    });
    await prisma.sales.create({
      data: {
        order_id: order2.id,
        restaurant_id: restaurant.id,
        table_id: allTables[2].id,
        total: order2.total,
        payment_method: "card",
        created_at: new Date("2026-05-02T21:00:00Z"),
      },
    });

    // Orden 3 — pendiente, mesa 5
    const capuchino = pick(allMenuItems, "Capuchino");
    const brownie = pick(allMenuItems, "Brownie");
    const iberico = pick(allMenuItems, "Ibérico");
    const order3 = await prisma.orders.create({
      data: {
        table_id: allTables[4].id,
        status: "pending",
        total:
          Number(capuchino.price) +
          Number(brownie.price) +
          Number(iberico.price),
        created_at: new Date("2026-05-06T10:00:00Z"),
      },
    });
    await prisma.order_items.createMany({
      data: [
        {
          order_id: order3.id,
          menu_item_id: capuchino.id,
          quantity: 1,
          unit_price: capuchino.price,
        },
        {
          order_id: order3.id,
          menu_item_id: brownie.id,
          quantity: 1,
          unit_price: brownie.price,
        },
        {
          order_id: order3.id,
          menu_item_id: iberico.id,
          quantity: 1,
          unit_price: iberico.price,
        },
      ],
    });

    console.log("3 órdenes + items + 2 ventas creadas");
  } else {
    console.log(`Órdenes existentes: ${existingOrders}`);
  }

  // ── 9. Reservaciones ──────────────────────────────────────────────────────
  const existingReservations = await prisma.reservations.count();
  if (existingReservations === 0) {
    await prisma.reservations.createMany({
      data: [
        {
          user_id: customer1.id,
          table_id: allTables[1].id,
          date: new Date("2026-05-10"),
          time: new Date("1970-01-01T19:00:00"),
          party_size: 2,
          status: "confirmed",
        },
        {
          user_id: customer2.id,
          table_id: allTables[3].id,
          date: new Date("2026-05-11"),
          time: new Date("1970-01-01T20:00:00"),
          party_size: 4,
          status: "pending",
        },
        {
          user_id: customer3.id,
          table_id: allTables[5].id,
          date: new Date("2026-05-12"),
          time: new Date("1970-01-01T13:30:00"),
          party_size: 3,
          status: "pending",
        },
      ],
    });
    console.log("3 reservaciones creadas");
  } else {
    console.log(`Reservaciones existentes: ${existingReservations}`);
  }

  // ── 10. Gastos ────────────────────────────────────────────────────────────
  const existingExpenses = await prisma.expenses.count({
    where: { restaurant_id: restaurant.id },
  });
  if (existingExpenses === 0) {
    await prisma.expenses.createMany({
      data: [
        {
          restaurant_id: restaurant.id,
          user_id: adminUser.id,
          description: "Compra de insumos mayo",
          amount: 350000,
          category: "ingredientes",
          date: new Date("2026-05-02"),
        },
        {
          restaurant_id: restaurant.id,
          user_id: adminUser.id,
          description: "Pago nómina meseros",
          amount: 800000,
          category: "nomina",
          date: new Date("2026-05-01"),
        },
        {
          restaurant_id: restaurant.id,
          user_id: adminUser.id,
          description: "Factura gas y electricidad",
          amount: 180000,
          category: "servicios",
          date: new Date("2026-05-03"),
        },
        {
          restaurant_id: restaurant.id,
          user_id: adminUser.id,
          description: "Mantenimiento cafetera",
          amount: 95000,
          category: "equipos",
          date: new Date("2026-05-04"),
        },
        {
          restaurant_id: restaurant.id,
          user_id: adminUser.id,
          description: "Servilletas y empaques",
          amount: 45000,
          category: "otros",
          date: new Date("2026-05-05"),
        },
      ],
    });
    console.log("5 gastos creados");
  } else {
    console.log(`Gastos existentes: ${existingExpenses}`);
  }

  console.log("\n=== Seed completado ===");
  console.log("Credenciales de acceso:");
  console.log("  Admin  → admin@ilcafeto.com   / ilcafeto2024!");
  console.log("  Staff1 → staff1@ilcafeto.com  / Staff1234!");
  console.log("  Staff2 → staff2@ilcafeto.com  / Staff1234!");
  console.log("  Staff3 → staff3@ilcafeto.com  / Staff1234!");
  console.log("  Cliente1 → cliente1@gmail.com / Cliente1234!");
  console.log("  Cliente2 → cliente2@gmail.com / Cliente1234!");
  console.log("  Cliente3 → cliente3@gmail.com / Cliente1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
