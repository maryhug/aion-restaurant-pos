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
function desc(
  ingredientes: string,
  sabor: string,
  perfil: string,
  recomendado_con: string,
) {
  return JSON.stringify({ ingredientes, sabor, perfil, recomendado_con });
}

type MenuItem = {
  category: string;
  name: string;
  price: number;
  description: string;
};
const menuItems: MenuItem[] = [
  // Smoothies
  {
    category: "Smoothies",
    name: "Mango naranja",
    price: 16000,
    description: desc(
      "mango,naranja",
      "dulce,cítrico,tropical",
      "refrescante,frutal",
      "sandwich hawaiano,pollo",
    ),
  },
  {
    category: "Smoothies",
    name: "Fresa naranja limón",
    price: 16000,
    description: desc(
      "fresa,naranja,limón",
      "cítrico,dulce",
      "refrescante",
      "postres,fresas chantilli",
    ),
  },
  {
    category: "Smoothies",
    name: "Fresa naranja banano",
    price: 16000,
    description: desc(
      "fresa,naranja,banano",
      "dulce,cremoso",
      "frutal",
      "brownie,sandwich tradicional",
    ),
  },
  {
    category: "Smoothies",
    name: "Piña naranja mora",
    price: 16000,
    description: desc(
      "piña,naranja,mora",
      "ácido,tropical",
      "refrescante",
      "ensaladas,salmón",
    ),
  },
  {
    category: "Smoothies",
    name: "Piña naranja banano",
    price: 16000,
    description: desc(
      "piña,naranja,banano",
      "tropical,cremoso",
      "frutal",
      "sandwich hawaiano",
    ),
  },
  // Cervezas
  {
    category: "Cervezas",
    name: "BBC",
    price: 12000,
    description: desc(
      "malta,lúpulo",
      "amargo,artesanal",
      "cerveza artesanal",
      "carnes,nachos",
    ),
  },
  {
    category: "Cervezas",
    name: "3 Cordilleras",
    price: 12000,
    description: desc(
      "malta,lúpulo",
      "intenso,artesanal",
      "cerveza fuerte",
      "brocheta de cerdo",
    ),
  },
  {
    category: "Cervezas",
    name: "Club Colombia",
    price: 9000,
    description: desc("malta", "suave,balanceado", "lager", "sandwiches"),
  },
  {
    category: "Cervezas",
    name: "Corona",
    price: 12000,
    description: desc(
      "malta,lúpulo",
      "ligero,cítrico",
      "refrescante",
      "ensaladas,salmón",
    ),
  },
  {
    category: "Cervezas",
    name: "Stella",
    price: 12000,
    description: desc(
      "malta,lúpulo",
      "elegante,seco",
      "premium lager",
      "combinado ibérico",
    ),
  },
  // Cócteles
  {
    category: "Cócteles",
    name: "Colimocho",
    price: 28000,
    description: desc(
      "vino tinto,gaseosa",
      "dulce,afrutado",
      "suave",
      "tapas ibéricas",
    ),
  },
  {
    category: "Cócteles",
    name: "Tinto de verano",
    price: 26000,
    description: desc(
      "vino tinto,gaseosa,cítricos",
      "refrescante,dulce",
      "ligero",
      "ensalada,salmón",
    ),
  },
  {
    category: "Cócteles",
    name: "Mojito",
    price: 27000,
    description: desc(
      "ron,limón,hierbabuena",
      "mentolado,cítrico",
      "refrescante",
      "cazuelas,nachos",
    ),
  },
  {
    category: "Cócteles",
    name: "Cuba libre",
    price: 26000,
    description: desc("ron,cola,limón", "dulce,fuerte", "clásico", "carnes"),
  },
  {
    category: "Cócteles",
    name: "Muller",
    price: 25000,
    description: desc("licor,frutas", "dulce,frutal", "suave", "postres"),
  },
  {
    category: "Cócteles",
    name: "Margarita",
    price: 26000,
    description: desc(
      "tequila,limón",
      "cítrico,fuerte",
      "coctel clásico",
      "nachos",
    ),
  },
  // Sangría
  {
    category: "Sangría",
    name: "Copa sangría",
    price: 25000,
    description: desc(
      "vino tinto,fresa,naranja,manzana",
      "frutal,dulce",
      "refrescante",
      "tapas ibéricas",
    ),
  },
  {
    category: "Sangría",
    name: "Jarra x2",
    price: 40000,
    description: desc(
      "vino tinto,fresa,naranja,manzana",
      "frutal,dulce",
      "compartir",
      "entradas",
    ),
  },
  {
    category: "Sangría",
    name: "Jarra x5",
    price: 70000,
    description: desc(
      "vino tinto,fresa,naranja,manzana",
      "frutal,dulce",
      "grupal",
      "combinado ibérico",
    ),
  },
  // Vino
  {
    category: "Vino",
    name: "Vino casa",
    price: 20000,
    description: desc("vino tinto", "seco,frutal", "vino tinto", "carnes"),
  },
  {
    category: "Vino",
    name: "Vino rosado",
    price: 22000,
    description: desc("vino rosado", "suave,dulce", "ligero", "ensaladas"),
  },
  {
    category: "Vino",
    name: "Vino blanco",
    price: 23000,
    description: desc("vino blanco", "cítrico,seco", "refrescante", "salmón"),
  },
  {
    category: "Vino",
    name: "Merlot",
    price: 25000,
    description: desc(
      "uva merlot",
      "robusto,frutal",
      "vino premium",
      "solomito",
    ),
  },
  // Entradas
  {
    category: "Entradas",
    name: "Maíz sencillo",
    price: 22000,
    description: desc(
      "maíz,queso,sal,pimienta",
      "salado,cremoso",
      "snack",
      "cervezas",
    ),
  },
  {
    category: "Entradas",
    name: "Maíz especial",
    price: 28000,
    description: desc(
      "maíz,pollo,tocineta,queso,crema de leche",
      "cremoso,salado",
      "abundante",
      "mojito",
    ),
  },
  {
    category: "Entradas",
    name: "Nachos",
    price: 18000,
    description: desc(
      "nachos,queso cheddar,mozzarella,guacamole",
      "salado",
      "mexicano",
      "margarita",
    ),
  },
  {
    category: "Entradas",
    name: "Cazuela pequeña",
    price: 23000,
    description: desc(
      "pollo o carne desmechada,pico de gallo,queso,nachos",
      "intenso,salado",
      "caliente",
      "cerveza",
    ),
  },
  {
    category: "Entradas",
    name: "Cazuela grande",
    price: 28500,
    description: desc(
      "pollo,carne desmechada,pico de gallo,queso,nachos",
      "abundante,salado",
      "compartir",
      "mojito",
    ),
  },
  {
    category: "Entradas",
    name: "Tabla de queso",
    price: 60000,
    description: desc(
      "quesos,aceitunas,pan",
      "salado,gourmet",
      "compartir",
      "vino",
    ),
  },
  {
    category: "Entradas",
    name: "Combinado ibérico",
    price: 75000,
    description: desc(
      "jamón serrano,chorizo,lomo,queso manchego,aceitunas,pan",
      "gourmet,salado",
      "premium",
      "vino tinto",
    ),
  },
  {
    category: "Entradas",
    name: "Tapas ibéricas",
    price: 35000,
    description: desc(
      "jamón serrano,chorizo,lomo,queso manchego,aceitunas,pan",
      "gourmet",
      "para compartir",
      "sangría",
    ),
  },
  // Cafés
  {
    category: "Cafés",
    name: "Expreso",
    price: 5000,
    description: desc("café", "intenso", "energético", "brownie"),
  },
  {
    category: "Cafés",
    name: "Americano",
    price: 7000,
    description: desc("café,agua", "suave", "clásico", "sandwich tradicional"),
  },
  {
    category: "Cafés",
    name: "Capuchino",
    price: 8500,
    description: desc("espresso,leche", "cremoso", "cafetería", "postres"),
  },
  {
    category: "Cafés",
    name: "Moka caliente",
    price: 9000,
    description: desc("café,chocolate,leche", "dulce", "cafetería", "brownie"),
  },
  {
    category: "Cafés",
    name: "Carajillo amaretto",
    price: 11000,
    description: desc("café,amaretto", "dulce,fuerte", "licor café", "postres"),
  },
  {
    category: "Cafés",
    name: "Carajillo whisky",
    price: 14000,
    description: desc("café,whisky", "intenso", "licor café", "carnes"),
  },
  {
    category: "Cafés",
    name: "Carajillo vino",
    price: 15000,
    description: desc(
      "café,vino",
      "afrutado",
      "experimental",
      "tabla de quesos",
    ),
  },
  {
    category: "Cafés",
    name: "Carajillo coñac",
    price: 11000,
    description: desc("café,coñac", "fuerte", "licor café", "brownie"),
  },
  {
    category: "Cafés",
    name: "Carajillo ron",
    price: 9500,
    description: desc("café,ron", "dulce", "licor café", "postres"),
  },
  {
    category: "Cafés",
    name: "Latte macchiato",
    price: 15000,
    description: desc(
      "espresso,leche",
      "suave,cremoso",
      "cafetería",
      "fresas chantilli",
    ),
  },
  {
    category: "Cafés",
    name: "Irlandés",
    price: 15000,
    description: desc(
      "café,whisky,crema",
      "cremoso,fuerte",
      "premium",
      "brownie",
    ),
  },
  {
    category: "Cafés",
    name: "Café helado",
    price: 13000,
    description: desc("café,hielo", "refrescante", "cold coffee", "sandwiches"),
  },
  {
    category: "Cafés",
    name: "Moka frío",
    price: 14500,
    description: desc(
      "café,chocolate,hielo",
      "dulce",
      "cold coffee",
      "brownie",
    ),
  },
  {
    category: "Cafés",
    name: "Frapuchino",
    price: 15000,
    description: desc("café,hielo,leche", "dulce,frío", "cafetería", "postres"),
  },
  {
    category: "Cafés",
    name: "Aromática tradicional",
    price: 5000,
    description: desc("hierbas", "suave", "caliente", "postres"),
  },
  {
    category: "Cafés",
    name: "Aromática frutos rojos",
    price: 7000,
    description: desc("frutos rojos", "dulce", "infusión", "fresas chantilli"),
  },
  {
    category: "Cafés",
    name: "Té chai",
    price: 9000,
    description: desc("té,especias,leche", "especiado", "caliente", "postres"),
  },
  // Postres
  {
    category: "Postres",
    name: "Brownie",
    price: 14000,
    description: desc(
      "brownie,chantilli,canela",
      "dulce,chocolate",
      "postre caliente",
      "capuchino",
    ),
  },
  {
    category: "Postres",
    name: "Fresas chantilli",
    price: 15500,
    description: desc(
      "fresas,chantilli,lecherita",
      "dulce,frutal",
      "postre frío",
      "latte macchiato",
    ),
  },
  // Sándwiches
  {
    category: "Sándwiches",
    name: "Ibérico",
    price: 35000,
    description: desc(
      "jamón serrano,chorizo,lomo,queso manchego,aceitunas",
      "salado,gourmet",
      "premium",
      "vino tinto",
    ),
  },
  {
    category: "Sándwiches",
    name: "IL Cafeto Mixto",
    price: 26500,
    description: desc(
      "pollo,carne desmechada,pepino agridulce,cebolla caramelizada,queso",
      "dulce,salado",
      "especialidad",
      "cerveza",
    ),
  },
  {
    category: "Sándwiches",
    name: "Tradicional",
    price: 20000,
    description: desc("jamón,queso,tomate", "clásico", "simple", "americano"),
  },
  {
    category: "Sándwiches",
    name: "Hawaiano",
    price: 20000,
    description: desc(
      "jamón,piña,queso",
      "dulce,salado",
      "tropical",
      "smoothie",
    ),
  },
  {
    category: "Sándwiches",
    name: "Pollo",
    price: 26000,
    description: desc("pechuga,champiñones", "salado", "proteico", "limonada"),
  },
  {
    category: "Sándwiches",
    name: "Pollo desmechado",
    price: 23000,
    description: desc(
      "pollo desmechado",
      "casero",
      "tradicional",
      "jugo natural",
    ),
  },
  {
    category: "Sándwiches",
    name: "Carne desmechada",
    price: 26000,
    description: desc(
      "carne desmechada,pepino agridulce,cebolla caramelizada",
      "intenso",
      "especial",
      "cerveza",
    ),
  },
  {
    category: "Sándwiches",
    name: "Bacon",
    price: 25000,
    description: desc(
      "jamón,tocineta ahumada,queso",
      "ahumado,salado",
      "fuerte",
      "coca cola",
    ),
  },
  {
    category: "Sándwiches",
    name: "Vegetariano",
    price: 22000,
    description: desc(
      "maíz,champiñones,queso",
      "vegetal",
      "vegetariano",
      "smoothie",
    ),
  },
  {
    category: "Sándwiches",
    name: "Atún",
    price: 26000,
    description: desc(
      "atún,champiñones,queso",
      "marino,salado",
      "proteico",
      "vino blanco",
    ),
  },
  {
    category: "Sándwiches",
    name: "Cerdo",
    price: 25000,
    description: desc(
      "cañón de cerdo,queso",
      "intenso",
      "especial",
      "cerveza artesanal",
    ),
  },
  // Carnes
  {
    category: "Carnes",
    name: "Brocheta de cerdo",
    price: 36000,
    description: desc(
      "cerdo,papas,ensalada,pan",
      "salado",
      "parrilla",
      "cerveza",
    ),
  },
  {
    category: "Carnes",
    name: "Pechuga gratinada",
    price: 40000,
    description: desc(
      "pollo,champiñones,queso",
      "cremoso",
      "gratinado",
      "vino blanco",
    ),
  },
  {
    category: "Carnes",
    name: "Cañón",
    price: 39000,
    description: desc(
      "cañón de cerdo,papas,ensalada",
      "jugoso",
      "premium",
      "vino tinto",
    ),
  },
  {
    category: "Carnes",
    name: "Milanesa",
    price: 39000,
    description: desc("carne apanada,papas", "crujiente", "clásico", "cerveza"),
  },
  {
    category: "Carnes",
    name: "Solomito",
    price: 42000,
    description: desc(
      "solomito,papas,ensalada",
      "premium",
      "carne fina",
      "merlot",
    ),
  },
  {
    category: "Carnes",
    name: "Salmón",
    price: 47000,
    description: desc(
      "salmón,camarones,papas,ensalada",
      "marino",
      "premium",
      "vino blanco",
    ),
  },
  // Ensaladas
  {
    category: "Ensaladas",
    name: "Ensalada en bowl",
    price: 30000,
    description: desc(
      "lechuga,queso,tomate,maíz,champiñones,aceitunas,atún o pollo",
      "fresco",
      "saludable",
      "vino rosado",
    ),
  },
  // Adiciones
  {
    category: "Adiciones",
    name: "Adición queso",
    price: 5000,
    description: desc("queso", "cremoso", "extra", "sandwiches"),
  },
  {
    category: "Adiciones",
    name: "Champiñones",
    price: 5000,
    description: desc("champiñones", "salado", "extra", "carnes"),
  },
  {
    category: "Adiciones",
    name: "Tocineta",
    price: 7000,
    description: desc("tocineta", "ahumado", "extra", "maíz especial"),
  },
  // Bebidas
  {
    category: "Bebidas",
    name: "Limonada natural",
    price: 8500,
    description: desc("limón,azúcar", "cítrico", "refrescante", "carnes"),
  },
  {
    category: "Bebidas",
    name: "Limonada lychee",
    price: 14500,
    description: desc(
      "lychee,limón",
      "dulce,tropical",
      "especial",
      "ensaladas",
    ),
  },
  {
    category: "Bebidas",
    name: "Coco",
    price: 15000,
    description: desc(
      "coco,leche en polvo",
      "cremoso,tropical",
      "dulce",
      "postres",
    ),
  },
  {
    category: "Bebidas",
    name: "Cereza",
    price: 14000,
    description: desc("cereza", "dulce", "frutal", "sandwiches"),
  },
  {
    category: "Bebidas",
    name: "Hierbabuena",
    price: 10000,
    description: desc(
      "hierbabuena,limón",
      "mentolado",
      "refrescante",
      "mojito",
    ),
  },
  {
    category: "Bebidas",
    name: "Piña hierbabuena",
    price: 13000,
    description: desc("piña,hierbabuena", "tropical", "refrescante", "salmón"),
  },
  {
    category: "Bebidas",
    name: "Jugo agua",
    price: 7500,
    description: desc("fruta,agua", "natural", "ligero", "almuerzos"),
  },
  {
    category: "Bebidas",
    name: "Jugo leche",
    price: 9000,
    description: desc("fruta,leche", "cremoso", "natural", "postres"),
  },
  {
    category: "Bebidas",
    name: "Avena",
    price: 11500,
    description: desc("avena,leche", "cremoso", "tradicional", "desayunos"),
  },
  {
    category: "Bebidas",
    name: "Milo frío",
    price: 10500,
    description: desc("milo,leche", "dulce", "energético", "brownie"),
  },
  {
    category: "Bebidas",
    name: "Botella agua",
    price: 6000,
    description: desc("agua", "neutral", "hidratación", "cualquier comida"),
  },
  {
    category: "Bebidas",
    name: "Soda michelada",
    price: 9000,
    description: desc("soda,sal,limón", "cítrico", "refrescante", "nachos"),
  },
  {
    category: "Bebidas",
    name: "Soda saborizada",
    price: 14000,
    description: desc(
      "soda,sal,limón,sirope",
      "dulce,cítrico",
      "especial",
      "sandwiches",
    ),
  },
  {
    category: "Bebidas",
    name: "Batido de proteína",
    price: 18000,
    description: desc("proteína,leche o agua", "proteico", "fitness", "pollo"),
  },
];

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
  if (existing) {
    if (existing.role !== role) {
      return prisma.users.update({ where: { email }, data: { role } });
    }
    return existing;
  }
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
        data: {
          price: item.price,
          category: item.category,
          description: item.description,
        },
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
          description: item.description,
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

  // ── 11. Sede (branch) ────────────────────────────────────────────────────
  let branch = await prisma.branches.findFirst({
    where: { restaurant_id: restaurant.id, name: "Sede Centro" },
  });
  if (!branch) {
    branch = await prisma.branches.create({
      data: {
        restaurant_id: restaurant.id,
        name: "Sede Centro",
        city: "Bogotá",
        address: "Calle 93 #15-23, Bogotá",
        is_active: true,
      },
    });
    console.log("Sede Centro creada");
  } else {
    console.log("Sede Centro existente");
  }

  // ── 12. Empleados ─────────────────────────────────────────────────────────
  const existingEmployees = await prisma.employees.count({
    where: { restaurant_id: restaurant.id },
  });
  let emp1Id: string, emp2Id: string, emp3Id: string;
  if (existingEmployees === 0) {
    const [emp1, emp2, emp3] = await Promise.all([
      prisma.employees.create({
        data: {
          restaurant_id: restaurant.id,
          branch_id: branch.id,
          user_id: staffUser1.id,
          full_name: staffUser1.name,
          document_number: "1020045566",
          role_title: "Mesero",
          contract_type: "indefinido",
          salary: 1850000,
          status: "active",
          hired_at: new Date("2024-02-12"),
        },
      }),
      prisma.employees.create({
        data: {
          restaurant_id: restaurant.id,
          branch_id: branch.id,
          user_id: staffUser2.id,
          full_name: staffUser2.name,
          document_number: "1019982233",
          role_title: "Barista",
          contract_type: "fijo",
          salary: 2100000,
          status: "active",
          hired_at: new Date("2023-11-10"),
        },
      }),
      prisma.employees.create({
        data: {
          restaurant_id: restaurant.id,
          branch_id: branch.id,
          user_id: staffUser3.id,
          full_name: staffUser3.name,
          document_number: "43888771",
          role_title: "Cajero",
          contract_type: "prestacion",
          salary: 2500000,
          status: "active",
          hired_at: new Date("2022-08-05"),
        },
      }),
    ]);
    emp1Id = emp1.id;
    emp2Id = emp2.id;
    emp3Id = emp3.id;
    console.log("3 empleados creados");

    const paymentRecords = [
      { employeeId: emp1Id, amount: 1850000, date: new Date("2026-04-30") },
      { employeeId: emp1Id, amount: 1850000, date: new Date("2026-03-31") },
      { employeeId: emp2Id, amount: 2100000, date: new Date("2026-04-30") },
      { employeeId: emp2Id, amount: 2100000, date: new Date("2026-03-31") },
      { employeeId: emp3Id, amount: 2500000, date: new Date("2026-03-31") },
    ];
    for (const p of paymentRecords) {
      await prisma.employee_payments.create({
        data: {
          restaurant_id: restaurant.id,
          employee_id: p.employeeId,
          gross_amount: p.amount,
          net_amount: p.amount,
          payment_date: p.date,
          payment_method: "transfer",
        },
      });
    }
    console.log("5 pagos de empleados creados");
  } else {
    console.log(`Empleados existentes: ${existingEmployees}`);
    const firstEmp = await prisma.employees.findFirst({
      where: { restaurant_id: restaurant.id },
      orderBy: { hired_at: "asc" },
    });
    emp3Id = firstEmp!.id;
    emp2Id = firstEmp!.id;
    emp1Id = firstEmp!.id;
  }

  // ── 13. Caja, turnos y cierres ───────────────────────────────────────────
  const existingRegisters = await prisma.cash_registers.count({
    where: { restaurant_id: restaurant.id },
  });
  if (existingRegisters === 0) {
    const register = await prisma.cash_registers.create({
      data: {
        restaurant_id: restaurant.id,
        branch_id: branch.id,
        name: "Caja Principal",
        code: "CAJA-01",
        is_active: true,
      },
    });
    console.log("Caja Principal creada");

    // Closed shift (previous day)
    const closedShift = await prisma.cash_shifts.create({
      data: {
        restaurant_id: restaurant.id,
        branch_id: branch.id,
        cash_register_id: register.id,
        opened_by_employee_id: emp3Id,
        closed_by_employee_id: emp3Id,
        opened_at: new Date("2026-05-06T15:00:00Z"),
        closed_at: new Date("2026-05-06T22:58:00Z"),
        opening_balance: 200000,
        expected_cash: 1330000,
        counted_cash: 1320000,
        difference: -10000,
        status: "closed",
        note: "Sin novedades",
      },
    });

    await prisma.cash_closures.create({
      data: {
        restaurant_id: restaurant.id,
        branch_id: branch.id,
        cash_shift_id: closedShift.id,
        closed_by_employee_id: emp3Id,
        total_sales_cash: 1380000,
        total_sales_card: 2050000,
        total_sales_transfer: 420000,
        total_other_income: 50000,
        total_withdrawals: 180000,
        total_cash_expenses: 120000,
        expected_cash: 1330000,
        counted_cash: 1320000,
        difference: -10000,
        status: "faltante",
        note: "Sin novedades",
      },
    });

    // Open shift (today)
    await prisma.cash_shifts.create({
      data: {
        restaurant_id: restaurant.id,
        branch_id: branch.id,
        cash_register_id: register.id,
        opened_by_employee_id: emp3Id,
        opened_at: new Date("2026-05-07T08:00:00Z"),
        opening_balance: 200000,
        status: "open",
      },
    });
    console.log("1 turno cerrado + cierre + 1 turno abierto creados");
  } else {
    console.log(`Registros de caja existentes: ${existingRegisters}`);
  }

  // ── 14. Configuración y branding ─────────────────────────────────────────
  const [existingSettings, existingBranding] = await Promise.all([
    prisma.restaurant_settings.findUnique({
      where: { restaurant_id: restaurant.id },
    }),
    prisma.restaurant_branding.findUnique({
      where: { restaurant_id: restaurant.id },
    }),
  ]);
  if (!existingSettings) {
    await prisma.restaurant_settings.create({
      data: {
        restaurant_id: restaurant.id,
        currency: "COP",
        timezone: "America/Bogota",
        tax_rate: 19,
        tip_suggested_pct: 10,
        cancellation_policy: "Hasta 2 horas antes sin costo",
        reservation_tolerance_min: 15,
        reservation_max_minutes: 120,
      },
    });
    console.log("Configuración creada");
  }
  if (!existingBranding) {
    await prisma.restaurant_branding.create({
      data: {
        restaurant_id: restaurant.id,
        primary_color: "#581c22",
        secondary_color: "#7b4b52",
        accent_color: "#d97706",
        background_color: "#ffe5e5",
      },
    });
    console.log("Branding creado");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTAURANTE 2 — La Cazuela (para probar multi-tenant)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(
    "\n── Restaurante 2: La Cazuela ──────────────────────────────────",
  );

  let restaurant2 = await prisma.restaurants.findFirst({
    where: { name: "La Cazuela" },
  });
  if (!restaurant2) {
    restaurant2 = await prisma.restaurants.create({
      data: {
        name: "La Cazuela",
        address: "Carrera 7 #45-12, Medellín",
        phone: "604-2341567",
      },
    });
    console.log(`Restaurante 2 creado: ${restaurant2.id}`);
  } else {
    console.log(`Restaurante 2 existente: ${restaurant2.id}`);
  }

  const admin2 = await upsertUser(
    "admin@lacazuela.com",
    "Admin La Cazuela",
    "lacazuela2024!",
    "admin",
  );
  const staff2a = await upsertUser(
    "staff1@lacazuela.com",
    "Pedro Cocinero",
    "Staff1234!",
    "staff",
  );
  const staff2b = await upsertUser(
    "staff2@lacazuela.com",
    "Diana Mesera",
    "Staff1234!",
    "staff",
  );

  await linkToRestaurant(admin2.id, restaurant2.id, "admin");
  await linkToRestaurant(staff2a.id, restaurant2.id, "staff");
  await linkToRestaurant(staff2b.id, restaurant2.id, "staff");

  const customer2a = await upsertUser(
    "cliente4@gmail.com",
    "Rosa López",
    "Cliente1234!",
    "customer",
  );
  const customer2b = await upsertUser(
    "cliente5@gmail.com",
    "Víctor Peña",
    "Cliente1234!",
    "customer",
  );

  console.log("Usuarios y membresías Restaurante 2 listos");

  // Sede
  let branch2 = await prisma.branches.findFirst({
    where: { restaurant_id: restaurant2.id },
  });
  if (!branch2) {
    branch2 = await prisma.branches.create({
      data: {
        restaurant_id: restaurant2.id,
        name: "Sede El Poblado",
        city: "Medellín",
        address: "Carrera 7 #45-12, Medellín",
        is_active: true,
      },
    });
    console.log("Sede El Poblado creada");
  }

  // Mesas
  const existingTables2 = await prisma.tables.count({
    where: { restaurant_id: restaurant2.id },
  });
  if (existingTables2 === 0) {
    await prisma.tables.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({
        restaurant_id: restaurant2.id,
        number: i + 1,
        capacity: i < 5 ? 4 : 6,
        status: "available",
      })),
    });
    console.log("8 mesas Restaurante 2 creadas");
  }

  // Menú
  const menu2Items = [
    { category: "Sopas", name: "Sancocho de gallina", price: 28000 },
    { category: "Sopas", name: "Ajiaco bogotano", price: 26000 },
    { category: "Sopas", name: "Mondongo", price: 24000 },
    { category: "Platos fuertes", name: "Bandeja paisa", price: 38000 },
    { category: "Platos fuertes", name: "Fritanga", price: 35000 },
    { category: "Platos fuertes", name: "Cazuela de mariscos", price: 42000 },
    { category: "Platos fuertes", name: "Trucha al ajillo", price: 36000 },
    { category: "Platos fuertes", name: "Chuleta de cerdo", price: 34000 },
    { category: "Entradas", name: "Empanadas x3", price: 12000 },
    { category: "Entradas", name: "Patacones con hogao", price: 14000 },
    { category: "Entradas", name: "Chicharrón", price: 18000 },
    { category: "Bebidas", name: "Jugo de lulo", price: 8000 },
    { category: "Bebidas", name: "Jugo de maracuyá", price: 8000 },
    { category: "Bebidas", name: "Aguapanela", price: 5000 },
    { category: "Bebidas", name: "Cerveza Águila", price: 7000 },
    { category: "Postres", name: "Arroz con leche", price: 10000 },
    { category: "Postres", name: "Natilla", price: 10000 },
  ] as const;

  let menu2Created = 0;
  for (const item of menu2Items) {
    const exists = await prisma.menu_items.findFirst({
      where: { restaurant_id: restaurant2.id, name: item.name },
    });
    if (!exists) {
      await prisma.menu_items.create({
        data: {
          restaurant_id: restaurant2.id,
          name: item.name,
          price: item.price,
          category: item.category,
          available: true,
        },
      });
      menu2Created++;
    }
  }
  console.log(`Menú Restaurante 2: ${menu2Created} items creados`);

  // Empleados
  const existingEmployees2 = await prisma.employees.count({
    where: { restaurant_id: restaurant2.id },
  });
  let emp2aId: string;
  if (existingEmployees2 === 0) {
    const empA = await prisma.employees.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        user_id: staff2a.id,
        full_name: staff2a.name,
        document_number: "32112344",
        role_title: "Cocinero",
        contract_type: "indefinido",
        salary: 2200000,
        status: "active",
        hired_at: new Date("2023-06-01"),
      },
    });
    const empB = await prisma.employees.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        user_id: staff2b.id,
        full_name: staff2b.name,
        document_number: "45678901",
        role_title: "Mesera",
        contract_type: "fijo",
        salary: 1900000,
        status: "active",
        hired_at: new Date("2024-01-15"),
      },
    });
    emp2aId = empA.id;
    console.log("2 empleados Restaurante 2 creados");

    await prisma.employee_payments.createMany({
      data: [
        {
          restaurant_id: restaurant2.id,
          employee_id: empA.id,
          gross_amount: 2200000,
          net_amount: 2200000,
          payment_date: new Date("2026-04-30"),
          payment_method: "transfer",
        },
        {
          restaurant_id: restaurant2.id,
          employee_id: empB.id,
          gross_amount: 1900000,
          net_amount: 1900000,
          payment_date: new Date("2026-04-30"),
          payment_method: "transfer",
        },
      ],
    });
  } else {
    const firstEmp2 = await prisma.employees.findFirst({
      where: { restaurant_id: restaurant2.id },
    });
    emp2aId = firstEmp2!.id;
    console.log(`Empleados Restaurante 2 existentes: ${existingEmployees2}`);
  }

  // Gastos
  const existingExpenses2 = await prisma.expenses.count({
    where: { restaurant_id: restaurant2.id },
  });
  if (existingExpenses2 === 0) {
    await prisma.expenses.createMany({
      data: [
        {
          restaurant_id: restaurant2.id,
          user_id: admin2.id,
          description: "Compra carnes y mariscos",
          amount: 520000,
          category: "ingredientes",
          date: new Date("2026-05-03"),
        },
        {
          restaurant_id: restaurant2.id,
          user_id: admin2.id,
          description: "Gas industrial",
          amount: 130000,
          category: "servicios",
          date: new Date("2026-05-04"),
        },
        {
          restaurant_id: restaurant2.id,
          user_id: admin2.id,
          description: "Pago nómina mayo",
          amount: 4100000,
          category: "nomina",
          date: new Date("2026-05-01"),
        },
      ],
    });
    console.log("3 gastos Restaurante 2 creados");
  }

  // Caja y cierres
  const existingRegisters2 = await prisma.cash_registers.count({
    where: { restaurant_id: restaurant2.id },
  });
  if (existingRegisters2 === 0) {
    const register2 = await prisma.cash_registers.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        name: "Caja Poblado",
        code: "CAZA-01",
        is_active: true,
      },
    });

    const closedShift2 = await prisma.cash_shifts.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        cash_register_id: register2.id,
        opened_by_employee_id: emp2aId,
        closed_by_employee_id: emp2aId,
        opened_at: new Date("2026-05-06T14:00:00Z"),
        closed_at: new Date("2026-05-06T23:00:00Z"),
        opening_balance: 300000,
        expected_cash: 1980000,
        counted_cash: 2000000,
        difference: 20000,
        status: "closed",
        note: "Cierre sin novedad",
      },
    });

    await prisma.cash_closures.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        cash_shift_id: closedShift2.id,
        closed_by_employee_id: emp2aId,
        total_sales_cash: 1980000,
        total_sales_card: 1200000,
        total_sales_transfer: 600000,
        total_other_income: 0,
        total_withdrawals: 0,
        total_cash_expenses: 300000,
        expected_cash: 1980000,
        counted_cash: 2000000,
        difference: 20000,
        status: "sobrante",
        note: "Cierre sin novedad",
      },
    });

    await prisma.cash_shifts.create({
      data: {
        restaurant_id: restaurant2.id,
        branch_id: branch2.id,
        cash_register_id: register2.id,
        opened_by_employee_id: emp2aId,
        opened_at: new Date("2026-05-07T09:00:00Z"),
        opening_balance: 300000,
        status: "open",
      },
    });
    console.log("Caja Restaurante 2 creada");
  }

  // Ventas
  const allTables2 = await prisma.tables.findMany({
    where: { restaurant_id: restaurant2.id },
    orderBy: { number: "asc" },
  });
  const allMenu2 = await prisma.menu_items.findMany({
    where: { restaurant_id: restaurant2.id },
  });
  const pick2 = (name: string) =>
    allMenu2.find((m) => m.name === name) ?? allMenu2[0];

  const existingSales2 = await prisma.sales.count({
    where: { restaurant_id: restaurant2.id },
  });
  if (existingSales2 === 0 && allTables2.length > 0 && allMenu2.length > 0) {
    const bandeja = pick2("Bandeja paisa");
    const lulo = pick2("Jugo de lulo");
    const order2a = await prisma.orders.create({
      data: {
        table_id: allTables2[0].id,
        status: "delivered",
        total: Number(bandeja.price) + Number(lulo.price),
        created_at: new Date("2026-05-05T12:30:00Z"),
      },
    });
    await prisma.order_items.createMany({
      data: [
        {
          order_id: order2a.id,
          menu_item_id: bandeja.id,
          quantity: 2,
          unit_price: bandeja.price,
        },
        {
          order_id: order2a.id,
          menu_item_id: lulo.id,
          quantity: 2,
          unit_price: lulo.price,
        },
      ],
    });
    await prisma.sales.create({
      data: {
        order_id: order2a.id,
        restaurant_id: restaurant2.id,
        table_id: allTables2[0].id,
        total: order2a.total,
        payment_method: "cash",
        cash_received: 100000,
        change_given: 100000 - Number(order2a.total),
        created_at: new Date("2026-05-05T13:00:00Z"),
      },
    });

    const cazuela = pick2("Cazuela de mariscos");
    const aguapanela = pick2("Aguapanela");
    const order2b = await prisma.orders.create({
      data: {
        table_id: allTables2[1].id,
        status: "delivered",
        total: Number(cazuela.price) * 2 + Number(aguapanela.price) * 2,
        created_at: new Date("2026-05-06T19:00:00Z"),
      },
    });
    await prisma.order_items.createMany({
      data: [
        {
          order_id: order2b.id,
          menu_item_id: cazuela.id,
          quantity: 2,
          unit_price: cazuela.price,
        },
        {
          order_id: order2b.id,
          menu_item_id: aguapanela.id,
          quantity: 2,
          unit_price: aguapanela.price,
        },
      ],
    });
    await prisma.sales.create({
      data: {
        order_id: order2b.id,
        restaurant_id: restaurant2.id,
        table_id: allTables2[1].id,
        total: order2b.total,
        payment_method: "card",
        created_at: new Date("2026-05-06T20:00:00Z"),
      },
    });
    console.log("2 ventas Restaurante 2 creadas");
  }

  // Reservas
  const existingRes2 = await prisma.reservations.count({
    where: { tables: { restaurant_id: restaurant2.id } },
  });
  if (existingRes2 === 0 && allTables2.length >= 3) {
    await prisma.reservations.createMany({
      data: [
        {
          user_id: customer2a.id, // ← Nuevo cliente para restaurante 2
          table_id: allTables2[2].id,
          date: new Date("2026-05-09"),
          time: new Date("1970-01-01T12:00:00"),
          party_size: 4,
          status: "confirmed",
        },
        {
          user_id: customer2b.id, // ← Nuevo cliente para restaurante 2
          table_id: allTables2[3].id,
          date: new Date("2026-05-10"),
          time: new Date("1970-01-01T19:00:00"),
          party_size: 6,
          status: "pending",
        },
      ],
    });
    console.log("2 reservas Restaurante 2 creadas");
  }

  // Configuración y branding
  const [settings2, branding2] = await Promise.all([
    prisma.restaurant_settings.findUnique({
      where: { restaurant_id: restaurant2.id },
    }),
    prisma.restaurant_branding.findUnique({
      where: { restaurant_id: restaurant2.id },
    }),
  ]);
  if (!settings2) {
    await prisma.restaurant_settings.create({
      data: {
        restaurant_id: restaurant2.id,
        currency: "COP",
        timezone: "America/Bogota",
        tax_rate: 19,
        tip_suggested_pct: 10,
        cancellation_policy: "Sin cancelaciones el mismo día",
        reservation_tolerance_min: 10,
        reservation_max_minutes: 90,
      },
    });
  }
  if (!branding2) {
    await prisma.restaurant_branding.create({
      data: {
        restaurant_id: restaurant2.id,
        primary_color: "#14532d",
        secondary_color: "#166534",
        accent_color: "#ca8a04",
        background_color: "#f0fdf4",
      },
    });
  }
  console.log("Configuración y branding Restaurante 2 listos");

  console.log("\n=== Seed completado ===");
  console.log(
    "── Restaurante 1: Il Cafeto ───────────────────────────────────",
  );
  console.log("  Admin  → admin@ilcafeto.com   / ilcafeto2024!");
  console.log("  Staff1 → staff1@ilcafeto.com  / Staff1234!");
  console.log("  Staff2 → staff2@ilcafeto.com  / Staff1234!");
  console.log("  Staff3 → staff3@ilcafeto.com  / Staff1234!");
  console.log(
    "── Restaurante 2: La Cazuela ──────────────────────────────────",
  );
  console.log("  Admin  → admin@lacazuela.com  / lacazuela2024!");
  console.log("  Staff1 → staff1@lacazuela.com / Staff1234!");
  console.log("  Staff2 → staff2@lacazuela.com / Staff1234!");
  console.log(
    "── Clientes (compartidos) ─────────────────────────────────────",
  );
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
