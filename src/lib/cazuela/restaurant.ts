import prisma from "@/lib/prisma";

let cachedId: string | null = null;

export async function getCazuelaRestaurantId(): Promise<string | null> {
  if (cachedId) return cachedId;
  const r = await prisma.restaurants.findFirst({
    where: { name: "La Cazuela" },
  });
  if (r) cachedId = r.id;
  return cachedId ?? null;
}
