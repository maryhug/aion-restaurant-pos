import { AionMenuPageClient } from "@/components/aion/client/menu-page-client";
import { fetchAionMenuDishes } from "@/lib/aion/menu-items";
import { getCazuelaRestaurantId } from "@/lib/cazuela/restaurant";
import { getCazuelaBrandingTokens } from "@/lib/cazuela/branding";

export default async function CazuelaMenuPage() {
  const [restaurantId, tokens] = await Promise.all([
    getCazuelaRestaurantId(),
    getCazuelaBrandingTokens(),
  ]);
  const dishes = await fetchAionMenuDishes({
    restaurantId: restaurantId ?? undefined,
  });
  return (
    <AionMenuPageClient dishes={dishes} basePath="/cazuela" tokens={tokens} />
  );
}
