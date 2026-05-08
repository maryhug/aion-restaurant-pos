import type { ReactNode } from "react";
import { AionCartProvider } from "@/components/aion/providers/cart-state";
import { AionOrderProvider } from "@/lib/aion/order-context";

export default function CazuelaClienteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AionCartProvider>
      <AionOrderProvider>{children}</AionOrderProvider>
    </AionCartProvider>
  );
}
