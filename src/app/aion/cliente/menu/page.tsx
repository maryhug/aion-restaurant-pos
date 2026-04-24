import { AionMenuPageClient } from "@/components/aion/client/menu-page-client";
import { fetchAionMenuDishes } from "@/lib/aion/menu-items";

export default async function AionMenuPage() {
  const dishes = await fetchAionMenuDishes();
  return <AionMenuPageClient dishes={dishes} />;
}
