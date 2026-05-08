import prisma from "../src/lib/prisma";

const rows = await prisma.menu_items.findMany({
  select: { name: true, image_url: true, category: true, restaurant_id: true },
  orderBy: { category: "asc" },
});

const byRestaurant: Record<string, typeof rows> = {};
for (const row of rows) {
  const key = row.restaurant_id ?? "unknown";
  if (!byRestaurant[key]) byRestaurant[key] = [];
  byRestaurant[key].push(row);
}

for (const [rid, items] of Object.entries(byRestaurant)) {
  console.log(`\n=== Restaurant ${rid.slice(0, 8)} ===`);
  for (const item of items) {
    console.log(`  [${item.category}] ${item.name} → ${item.image_url ?? "NULL"}`);
  }
}

await prisma.$disconnect();
