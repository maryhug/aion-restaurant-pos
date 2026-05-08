import { AionOrderStatusClient } from "@/components/aion/client/order-status-client";
import { getCazuelaBrandingTokens } from "@/lib/cazuela/branding";

export default async function CazuelaEstadoPedidoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, tokens] = await Promise.all([
    params,
    getCazuelaBrandingTokens(),
  ]);
  return (
    <AionOrderStatusClient
      orderId={orderId}
      basePath="/cazuela"
      tokens={tokens}
    />
  );
}
