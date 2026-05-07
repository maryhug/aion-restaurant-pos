export type DatePreset = "today" | "week" | "month" | "year" | "custom";

export type OrderStatusAdmin =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "transfer" | "wallet";
export type OrderChannel = "salon" | "reserva" | "domicilio" | "recoger";

export type TenantBranding = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  defaultMode: "light" | "dark";
  logoUrl?: string;
  faviconUrl?: string;
};

export type TenantSettings = {
  currency: "COP" | "USD" | "EUR";
  timezone: string;
  taxRate: number;
  tipSuggestion: number;
  enabledPayments: PaymentMethod[];
  cancellationPolicy: string;
  reservationToleranceMin: number;
  maxReservationDurationMin: number;
  shifts: Array<{ name: string; start: string; end: string }>;
  notifications: {
    lowStock: boolean;
    cashDiff: boolean;
    payrollReminders: boolean;
    upcomingReservations: boolean;
  };
};

export type Branch = { id: string; name: string; city: string };

export type Tenant = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  branches: Branch[];
  activeBranchId: string;
  branding: TenantBranding;
  settings: TenantSettings;
  featureFlags: {
    multiBranch: boolean;
    payroll: boolean;
    chatbot: boolean;
  };
};

export type DashboardKpi = { title: string; value: string; subtitle?: string };
export type TrendPoint = { label: string; value: number };
export type PiePoint = { label: string; value: number };

export type AdminOrder = {
  id: string;
  tenantId: string;
  branchId: string;
  customer: string;
  waiter: string;
  tableOrType: string;
  status: OrderStatusAdmin;
  paymentMethod: PaymentMethod;
  channel: OrderChannel;
  date: string;
  total: number;
  items: Array<{ name: string; qty: number; price: number }>;
};

export type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  unitCost: number;
  supplier: string;
  purchaseDate: string;
  state: "ok" | "low" | "critical" | "expired" | "overstock";
};

export type ServiceExpense = {
  id: string;
  service: string;
  category: string;
  period: string;
  value: number;
  paidAt: string;
  status: "paid" | "pending";
  note?: string;
};

export type InventoryMove = {
  id: string;
  date: string;
  product: string;
  type: "entrada" | "salida" | "ajuste" | "perdida" | "consumo";
  quantity: number;
  reason: string;
  responsible: string;
};

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  responsible: string;
  status: "paid" | "pending";
  note?: string;
};

export type CashClosing = {
  id: string;
  date: string;
  shift: string;
  cashier: string;
  openTime: string;
  closeTime: string;
  branch: string;
  baseFund: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  otherIncome: number;
  withdrawals: number;
  cashExpenses: number;
  countedCash: number;
  note?: string;
};

export type Employee = {
  id: string;
  name: string;
  document: string;
  role: string;
  contractType: "fijo" | "indefinido" | "prestacion";
  salary: number;
  status: "activo" | "inactivo";
  joinedAt: string;
  lastPaymentAt?: string;
};

export type TableItem = {
  id: string;
  number: number;
  capacity: number;
  status: "libre" | "ocupada" | "reservada" | "limpieza";
  zone: string;
};

export type Reservation = {
  id: string;
  customer: string;
  date: string;
  time: string;
  people: number;
  table: string;
  status: "confirmada" | "pendiente" | "cancelada";
  notes?: string;
};
