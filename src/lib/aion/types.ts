export type AionCategoryId =
  | "todos"
  | "adiciones"
  | "bebidas"
  | "cafés"
  | "carnes"
  | "cervezas"
  | "cócteles"
  | "ensaladas"
  | "entradas"
  | "postres"
  | "sangría"
  | "smoothies"
  | "sándwiches"
  | "vino";

export interface AionDish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Exclude<AionCategoryId, "todos">;
  prepMinutes: number;
  available: boolean;
  tags: string[];
  imageHint?: string;
  ingredientes?: string;
  sabor?: string;
  perfil?: string;
  recomendado_con?: string;
}

export type OrderState = "pendiente" | "preparando" | "listo";

export interface AionOrderLine {
  dishId: string;
  name: string;
  quantity: number;
  /** Display-only, cocina. */
  emoji?: string;
}

export interface AionStaffOrder {
  id: string;
  tableLabel: string;
  customerName: string;
  state: OrderState;
  waitLabel: string;
  urgent: boolean;
  items: AionOrderLine[];
}

export interface AionKpi {
  id: string;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: "dollar" | "cart" | "chart" | "users";
}
