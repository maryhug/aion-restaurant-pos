"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Language = "es" | "en";

export const staffDictionary = {
  es: {
    dashboard: "Panel de órdenes",
    pending: "Pendiente",
    preparing: "Preparando",
    ready: "Listo",
    delivered: "Entregado",
    update: "Actualizar",
    retry: "Reintentar",
    noOrders: "Sin órdenes en esta columna",
    elapsed: "Hace",
    minutes: "min",
    now: "Ahora",
    table: "Mesa",
    new: "¡Nuevo!",
    toPreparing: "Iniciar",
    toReady: "Listo",
    toDelivered: "Entregar",
    signOut: "Salir",
    orders: "Pedidos",
    home: "Inicio",
    allOrders: "Ver todos los pedidos",
    urgents: "Urgentes",
    dropHere: "Suelta aquí para mover",
    dragHint: "Arrastra para cambiar estado",
  },
  en: {
    dashboard: "Orders dashboard",
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    delivered: "Delivered",
    update: "Refresh",
    retry: "Retry",
    noOrders: "No orders in this column",
    elapsed: "",
    minutes: "min ago",
    now: "Now",
    table: "Table",
    new: "New!",
    toPreparing: "Start",
    toReady: "Mark ready",
    toDelivered: "Deliver",
    signOut: "Sign out",
    orders: "Orders",
    home: "Home",
    allOrders: "View all orders",
    urgents: "Urgent",
    dropHere: "Drop here to move",
    dragHint: "Drag to change status",
  },
} as const;

type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof (typeof staffDictionary)["es"]) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "es" ? "en" : "es"));
  };

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      t: (key: keyof (typeof staffDictionary)["es"]) =>
        staffDictionary[language][key],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return ctx;
}
