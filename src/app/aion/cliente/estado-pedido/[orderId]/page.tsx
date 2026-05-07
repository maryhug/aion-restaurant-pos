import { AionOrderStatusClient } from "@/components/aion/client/order-status-client";

export default async function AionEstadoPedidoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <AionOrderStatusClient orderId={orderId} />;
}
