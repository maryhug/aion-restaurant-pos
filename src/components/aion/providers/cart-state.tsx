"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
export type CartItem = {
  dishId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  category?: string;
};

type CartState = {
  items: CartItem[];
  add: (
    item: {
      dishId: string;
      name: string;
      unitPrice: number;
      category?: string;
    },
    amount?: number,
  ) => void;
  setQty: (dishId: string, quantity: number) => void;
  remove: (dishId: string) => void;
  clear: () => void;
  total: number;
  subtotal: number;
  lineCount: number;
};

const CartContext = createContext<CartState | null>(null);

export function AionCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback(
    (
      item: {
        dishId: string;
        name: string;
        unitPrice: number;
        category?: string;
      },
      amount: number = 1,
    ) => {
      setItems((prev) => {
        const i = prev.findIndex((l) => l.dishId === item.dishId);
        if (i === -1) return [...prev, { ...item, quantity: amount }];
        const next = [...prev];
        next[i] = {
          ...next[i],
          name: item.name,
          unitPrice: item.unitPrice,
          category: item.category,
          quantity: next[i].quantity + amount,
        };
        return next;
      });
    },
    [],
  );

  const setQty = useCallback((dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((l) => l.dishId !== dishId));
      return;
    }
    setItems((prev) => {
      const i = prev.findIndex((l) => l.dishId === dishId);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], quantity };
      return next;
    });
  }, []);

  const remove = useCallback((dishId: string) => {
    setItems((prev) => prev.filter((l) => l.dishId !== dishId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const { subtotal, lineCount, total } = useMemo(() => {
    const sub = items.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const count = items.reduce((s, l) => s + l.quantity, 0);
    return { subtotal: sub, lineCount: count, total: sub };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      add,
      setQty,
      remove,
      clear,
      total,
      subtotal,
      lineCount,
    }),
    [items, add, setQty, remove, clear, total, subtotal, lineCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useAionCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useAionCart must be used within AionCartProvider");
  }
  return ctx;
}

export function useAionCartOptional(): CartState | null {
  return useContext(CartContext);
}
