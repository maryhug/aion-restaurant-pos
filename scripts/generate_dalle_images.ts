/**
 * Genera imágenes para el menú usando DALL-E 3.
 * Estilo: fotografía editorial de comida, plato cerámico pastel, luz natural, guarniciones florales.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/generate_dalle_images.ts          → genera todos
 *   npx tsx --env-file=.env scripts/generate_dalle_images.ts --test   → genera solo 1
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ── Config ──────────────────────────────────────────────────────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
if (!OPENAI_KEY) throw new Error("Falta OPENAI_API_KEY en .env");

const DB_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
if (!DB_URL) throw new Error("Falta DATABASE_URL en .env");

const OUTPUT_DIR = path.join(process.cwd(), "public", "assets");
const TEST_MODE = process.argv.includes("--test");

// ── BD ───────────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Platos ───────────────────────────────────────────────────────────────────
const ALL_ITEMS: { name: string; hint: string }[] = [
  // Smoothies
  { name: "Mango naranja", hint: "a fresh mango and orange smoothie drink" },
  {
    name: "Fresa naranja limón",
    hint: "a strawberry, orange and lemon smoothie",
  },
  {
    name: "Fresa naranja banano",
    hint: "a strawberry, orange and banana smoothie",
  },
  {
    name: "Piña naranja mora",
    hint: "a pineapple, orange and blackberry smoothie",
  },
  {
    name: "Piña naranja banano",
    hint: "a pineapple, orange and banana smoothie",
  },
  // Cervezas
  { name: "BBC", hint: "a dark craft beer in a glass" },
  { name: "3 Cordilleras", hint: "a craft beer bottle and glass" },
  { name: "Club Colombia", hint: "a lager beer bottle" },
  { name: "Corona", hint: "a Corona beer bottle with lime" },
  { name: "Stella", hint: "a Stella Artois beer glass" },
  // Cócteles
  { name: "Colimocho", hint: "a colimocho cocktail, red wine and cola" },
  {
    name: "Tinto de verano",
    hint: "a tinto de verano wine and soda cocktail in a tall glass",
  },
  { name: "Mojito", hint: "a classic mojito cocktail with mint and lime" },
  { name: "Cuba libre", hint: "a cuba libre rum and cola cocktail with lime" },
  { name: "Muller", hint: "a Muller cocktail white wine and lemonade" },
  { name: "Margarita", hint: "a classic margarita cocktail with salt rim" },
  // Sangría
  { name: "Copa sangría", hint: "a glass of red sangria with fruit" },
  { name: "Jarra x2", hint: "a small pitcher of sangria for two" },
  { name: "Jarra x5", hint: "a large jug of sangria with fruit slices" },
  // Vino
  { name: "Vino casa", hint: "a glass of house red wine" },
  { name: "Vino rosado", hint: "a glass of rosé wine" },
  { name: "Vino blanco", hint: "a glass of white wine" },
  { name: "Merlot", hint: "a glass of merlot red wine" },
  // Entradas
  {
    name: "Maíz sencillo",
    hint: "a simple grilled corn on the cob with butter",
  },
  {
    name: "Maíz especial",
    hint: "a special seasoned grilled corn with toppings",
  },
  { name: "Nachos", hint: "a plate of nachos with guacamole and salsa" },
  { name: "Cazuela pequeña", hint: "a small clay pot casserole appetizer" },
  { name: "Cazuela grande", hint: "a large clay pot casserole appetizer" },
  { name: "Tabla de queso", hint: "an artisan cheese and charcuterie board" },
  {
    name: "Combinado ibérico",
    hint: "a Spanish iberico ham and charcuterie combination platter",
  },
  // Cafés
  { name: "Expreso", hint: "a double espresso coffee in a small cup" },
  { name: "Americano", hint: "an americano coffee in a white cup" },
  { name: "Capuchino", hint: "a cappuccino with latte art foam" },
  { name: "Moka caliente", hint: "a hot mocha coffee with chocolate" },
  {
    name: "Carajillo amaretto",
    hint: "a carajillo coffee with amaretto liqueur",
  },
  { name: "Carajillo whisky", hint: "a carajillo coffee with whisky" },
  { name: "Carajillo vino", hint: "a carajillo coffee with wine" },
  { name: "Carajillo coñac", hint: "a carajillo coffee with cognac" },
  { name: "Carajillo ron", hint: "a carajillo coffee with rum" },
  { name: "Latte macchiato", hint: "a tall latte macchiato with milk layers" },
  { name: "Irlandés", hint: "an Irish coffee with cream on top" },
  { name: "Café helado", hint: "an iced coffee in a tall glass" },
  { name: "Moka frío", hint: "a cold iced mocha coffee drink" },
  { name: "Frapuchino", hint: "a blended frappuccino with whipped cream" },
  {
    name: "Aromática tradicional",
    hint: "a traditional herbal tea infusion in a cup",
  },
  { name: "Aromática frutos rojos", hint: "a red berries herbal tea infusion" },
  { name: "Té chai", hint: "a spiced chai tea latte" },
  // Postres
  { name: "Brownie", hint: "a rich chocolate brownie dessert" },
  { name: "Fresas chantilli", hint: "fresh strawberries with whipped cream" },
  // Sándwiches
  { name: "Ibérico", hint: "a toasted sandwich with iberico ham" },
  { name: "IL Cafeto Mixto", hint: "a mixed toasted cafe sandwich" },
  { name: "Tradicional", hint: "a classic ham and cheese toasted sandwich" },
  { name: "Hawaiano", hint: "a hawaiian sandwich with ham and pineapple" },
  { name: "Pollo", hint: "a grilled chicken sandwich" },
  { name: "Pollo desmechado", hint: "a pulled chicken sandwich" },
  { name: "Carne desmechada", hint: "a pulled beef sandwich" },
  { name: "Bacon", hint: "a crispy bacon toasted sandwich" },
  { name: "Vegetariano", hint: "a fresh vegetarian sandwich" },
  { name: "Atún", hint: "a tuna sandwich" },
  { name: "Cerdo", hint: "a pork sandwich" },
  // Carnes
  { name: "Brocheta de cerdo", hint: "pork skewer brochette with vegetables" },
  {
    name: "Pechuga gratinada",
    hint: "a gratin chicken breast with melted cheese",
  },
  { name: "Cañón", hint: "a grilled beef cannon cut steak" },
  { name: "Milanesa", hint: "a breaded milanesa steak" },
  { name: "Solomito", hint: "a beef tenderloin fillet steak" },
  { name: "Salmón", hint: "a grilled salmon fillet" },
  // Ensaladas
  { name: "Ensalada en bowl", hint: "a fresh mixed salad in a bowl" },
  // Adiciones
  { name: "Adición queso", hint: "melted golden cheese" },
  { name: "Champiñones", hint: "sautéed mushrooms with garlic and herbs" },
  { name: "Tocineta", hint: "crispy bacon strips" },
  // Bebidas
  { name: "Limonada natural", hint: "a fresh natural lemonade in a glass" },
  { name: "Limonada lychee", hint: "a lychee lemonade drink" },
  { name: "Coco", hint: "a coconut water drink" },
  { name: "Cereza", hint: "a cherry flavored drink" },
  { name: "Hierbabuena", hint: "a mint lemonade drink" },
  { name: "Piña hierbabuena", hint: "a pineapple and mint drink" },
  { name: "Jugo agua", hint: "a fresh fruit juice with water" },
  { name: "Jugo leche", hint: "a fresh fruit juice with milk" },
  { name: "Avena", hint: "a traditional oatmeal drink" },
  { name: "Milo frío", hint: "a cold chocolate malt Milo drink" },
  { name: "Botella agua", hint: "a mineral water bottle" },
  { name: "Soda michelada", hint: "a michelada soda beer cocktail" },
  { name: "Soda saborizada", hint: "a flavored soda drink" },
  { name: "Batido de proteína", hint: "a protein shake smoothie" },

  // ── La Cazuela ───────────────────────────────────────────────────────────────
  // Sopas / Caldos
  {
    name: "Sancocho de gallina",
    hint: "a traditional Colombian sancocho de gallina chicken soup in a clay bowl",
  },
  { name: "Mondongo", hint: "a Colombian mondongo tripe soup with vegetables" },
  {
    name: "Caldo de costilla",
    hint: "a Colombian caldo de costilla beef rib broth soup",
  },
  { name: "Sopa de lentejas", hint: "a hearty Colombian lentil soup" },
  { name: "Sopa de fríjoles", hint: "a traditional Colombian bean soup" },
  // Platos fuertes
  {
    name: "Fritanga",
    hint: "a Colombian fritanga mixed fry platter with chicharrón, chorizo and morcilla",
  },
  {
    name: "Bandeja paisa",
    hint: "a Colombian bandeja paisa with beans, rice, chicharrón, egg and chorizo",
  },
  {
    name: "Ajiaco",
    hint: "a bowl of Colombian ajiaco potato and chicken soup",
  },
  {
    name: "Posta negra",
    hint: "a Colombian posta negra braised beef in dark sauce",
  },
  {
    name: "Pechuga a la plancha",
    hint: "a grilled chicken breast with Colombian side dishes",
  },
  {
    name: "Trucha al ajillo",
    hint: "a Colombian trout fillet with garlic sauce",
  },
  // Entradas
  { name: "Chicharrón", hint: "crispy Colombian chicharrón fried pork rinds" },
  {
    name: "Arepa con hogao",
    hint: "a Colombian arepa cornbread with hogao tomato sauce",
  },
  { name: "Empanadas", hint: "crispy Colombian empanadas filled with meat" },
  {
    name: "Patacones con guacamole",
    hint: "Colombian patacones fried plantain slices with guacamole",
  },
  // Postres
  {
    name: "Natilla",
    hint: "a traditional Colombian natilla caramel custard pudding in a small cup",
  },
  {
    name: "Buñuelos",
    hint: "traditional Colombian buñuelos fried cheese puffs",
  },
  {
    name: "Arroz con leche",
    hint: "a creamy Colombian arroz con leche rice pudding",
  },
  {
    name: "Postre de natas",
    hint: "a traditional Colombian postre de natas cream dessert",
  },
  // Bebidas La Cazuela
  {
    name: "Jugo de maracuyá",
    hint: "a fresh Colombian passion fruit juice in a glass",
  },
  { name: "Jugo de lulo", hint: "a Colombian lulo naranjilla fruit juice" },
  {
    name: "Jugo de guanábana",
    hint: "a Colombian soursop guanábana fruit juice",
  },
  {
    name: "Chocolate caliente",
    hint: "a traditional Colombian hot chocolate with cheese",
  },
  {
    name: "Agua de panela",
    hint: "a traditional Colombian agua de panela sugarcane drink",
  },
  {
    name: "Chicha de maíz",
    hint: "a traditional Colombian chicha fermented corn drink",
  },
];

// ── Estilo base (basado en la imagen de referencia del cliente) ──────────────
const STYLE =
  "overhead food photography, elegant plating on a soft pastel pink ceramic plate, " +
  "natural diffused window light with gentle soft shadows, minimalist fine dining styling, " +
  "delicate edible flowers and micro herbs as garnish, white linen surface, " +
  "warm golden tones, editorial magazine quality, shallow depth of field, " +
  "airy and romantic aesthetic, soft bokeh background";

function buildPrompt(hint: string): string {
  return `${hint}, ${STYLE}. No text, no labels, no watermarks.`;
}

// ── DALL-E 3 API call ────────────────────────────────────────────────────────
async function generateImage(prompt: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/images/generations",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString());
            if (json.error) {
              console.error("  API error:", json.error.message);
              resolve(null);
              return;
            }
            const b64 = json.data?.[0]?.b64_json;
            resolve(b64 ? Buffer.from(b64, "base64") : null);
          } catch {
            resolve(null);
          }
        });
        res.on("error", () => resolve(null));
      },
    );
    req.on("error", () => resolve(null));
    req.setTimeout(60000, () => {
      req.destroy();
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const items = TEST_MODE ? ALL_ITEMS.slice(0, 1) : ALL_ITEMS;
  const total = items.length;
  console.log(`Generando ${total} imagen(es) con DALL-E 3...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < items.length; i++) {
    const { name, hint } = items[i];
    const fileName = `dalle_${slug(name)}.jpeg`;
    const outPath = path.join(OUTPUT_DIR, fileName);

    // Saltar si ya existe
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
      console.log(`[${i + 1}/${total}] SKIP  ${name}`);
      ok++;
      // Actualizar BD de todas formas
      await prisma.menu_items.updateMany({
        where: { name },
        data: { image_url: `/assets/${fileName}` },
      });
      continue;
    }

    const prompt = buildPrompt(hint);
    process.stdout.write(`[${i + 1}/${total}] ${name}... `);

    const buf = await generateImage(prompt);
    if (buf) {
      fs.writeFileSync(outPath, buf);
      await prisma.menu_items.updateMany({
        where: { name },
        data: { image_url: `/assets/${fileName}` },
      });
      const kb = Math.round(buf.length / 1024);
      console.log(`OK (${kb} KB)`);
      ok++;
    } else {
      console.log("FAIL");
      fail++;
    }

    // Rate limit: DALL-E 3 permite ~5 img/min en tier 1
    if (i < items.length - 1) await sleep(13000);
  }

  console.log(`\nOK: ${ok} | FAIL: ${fail} | Total: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
