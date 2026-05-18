"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type OrderNotification = {
  id: string;
  fullId: string;
  tableOrType: string;
  total: number;
  date: string;
  status: string;
};

const SEEN_KEY = "aion_seen_order_ids";
const POLL_MS = 30_000;

export function useOrderNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const seenRef = useRef<Set<string> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const { orders } = (await res.json()) as {
        orders: OrderNotification[];
      };

      if (seenRef.current === null) {
        // First load: mark all existing orders as seen
        const stored: string[] = JSON.parse(
          localStorage.getItem(SEEN_KEY) ?? "[]",
        );
        const seen = new Set([...stored, ...orders.map((o) => o.fullId)]);
        seenRef.current = seen;
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
        return;
      }

      // Subsequent polls: detect orders not yet seen
      const fresh = orders.filter((o) => !seenRef.current!.has(o.fullId));
      if (fresh.length === 0) return;

      fresh.forEach((o) => seenRef.current!.add(o.fullId));
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seenRef.current!]));
      setNotifications((prev) => [...fresh, ...prev].slice(0, 15));
    } catch {
      /* silently ignore network errors */
    }
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  const dismiss = (fullId: string) =>
    setNotifications((p) => p.filter((n) => n.fullId !== fullId));

  const dismissAll = () => setNotifications([]);

  return { notifications, dismiss, dismissAll };
}
