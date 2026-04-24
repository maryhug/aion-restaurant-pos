import type { ReactNode } from "react";
import { AionCartProvider } from "@/components/aion/providers/cart-state";

export default function AionClienteLayout({ children }: { children: ReactNode }) {
  return <AionCartProvider>{children}</AionCartProvider>;
}
