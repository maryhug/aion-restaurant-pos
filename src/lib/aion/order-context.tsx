"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem, OrderItem } from "@/types/database";

export type DraftOrderItem = OrderItem & {
  name: string;
  category: string;
  image_url: string | null;
};

type OrderContextValue = {
  items: DraftOrderItem[];
  orderId: string | null;
  setItemsFromMenu: (items: MenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  setOrderId: (id: string | null) => void;
  clear: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

function toDraft(item: MenuItem, quantity = 1): DraftOrderItem {
  return {
    id: `draft-${item.id}`,
    order_id: "draft",
    menu_item_id: item.id,
    quantity,
    unit_price: Number(item.price),
    name: item.name,
    category: item.category,
    image_url: item.image_url,
  };
}

export function AionOrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DraftOrderItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);

  const setItemsFromMenu = useCallback((menuItems: MenuItem[]) => {
    setItems(menuItems.map((item) => toDraft(item)));
  }, []);

  const addMenuItem = useCallback((item: MenuItem) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.menu_item_id === item.id);
      if (i === -1) return [...prev, toDraft(item)];
      const next = [...prev];
      next[i] = { ...next[i], quantity: next[i].quantity + 1 };
      return next;
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((item) => item.menu_item_id !== menuItemId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setOrderId(null);
  }, []);

  const value = useMemo(
    () => ({
      items,
      orderId,
      setItemsFromMenu,
      addMenuItem,
      removeItem,
      setOrderId,
      clear,
    }),
    [items, orderId, setItemsFromMenu, addMenuItem, removeItem, clear],
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useAionOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx)
    throw new Error("useAionOrder debe usarse dentro de AionOrderProvider");
  return ctx;
}
