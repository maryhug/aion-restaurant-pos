export type UserRole = "customer" | "staff" | "admin";
export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "maintenance";
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type PaymentMethod = "cash" | "card" | "transfer" | "wallet";
export type UserLevel = "explorer" | "adventurer" | "gourmet" | "master";
export type ThemeMode = "light" | "dark" | "system";
export type OrderType = "salon" | "reserva" | "domicilio" | "recoger";
export type PaymentStatus = "pending" | "paid" | "refunded" | "partial";
export type EmployeeStatus = "active" | "inactive" | "suspended";
export type ContractType = "fijo" | "indefinido" | "prestacion" | "temporal";
export type ReservationSource =
  | "walk_in"
  | "web"
  | "phone"
  | "whatsapp"
  | "app";
export type CashShiftStatus = "open" | "closed" | "cancelled";
export type CashClosureStatus = "cuadrado" | "sobrante" | "faltante";
export type CashMovementType =
  | "opening"
  | "sale_cash"
  | "other_income"
  | "withdrawal"
  | "expense"
  | "adjustment"
  | "closing";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string | null;
  role: UserRole;
  created_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserRestaurant {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: "admin" | "staff";
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  number: number;
  capacity: number;
  status: TableStatus;
  zone: string | null;
  notes: string | null;
  qr_code: string | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  available: boolean;
  cost_price: number | null;
  stock: number;
  min_stock: number;
  is_secret: boolean;
  image_url: string | null;
}

export interface Reservation {
  id: string;
  user_id: string;
  table_id: string;
  restaurant_id: string | null;
  branch_id: string | null;
  date: string;
  time: string;
  party_size: number;
  status: ReservationStatus;
  source: ReservationSource | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  reservation_id: string | null;
  table_id: string | null;
  restaurant_id: string | null;
  branch_id: string | null;
  cash_shift_id: string | null;
  assigned_employee_id: string | null;
  placed_by_user_id: string | null;
  status: OrderStatus;
  order_type: OrderType | null;
  payment_status: PaymentStatus | null;
  payment_method_v2: PaymentMethod | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  total: number;
  paid_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: "ingredientes" | "servicios" | "nomina" | "equipos" | "otros";
  date: string;
  restaurant_id: string;
  branch_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  currency: string;
  timezone: string;
  tax_rate: number | null;
  tip_suggested_pct: number | null;
  cancellation_policy: string | null;
  reservation_tolerance_min: number | null;
  reservation_max_minutes: number | null;
  default_order_type: string | null;
  enabled_payment_methods: Record<string, unknown> | null;
  shift_config: Record<string, unknown> | null;
  invoice_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantBranding {
  id: string;
  restaurant_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  default_theme_mode: ThemeMode;
  use_aion_defaults: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantIntegration {
  id: string;
  restaurant_id: string;
  payment_gateway: string | null;
  whatsapp_number: string | null;
  smtp_from: string | null;
  smtp_host: string | null;
  thermal_printer: Record<string, unknown> | null;
  api_keys: Record<string, unknown> | null;
  webhooks: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantFeatureFlags {
  id: string;
  restaurant_id: string;
  enable_multi_branch: boolean;
  enable_cash_closure: boolean;
  enable_payroll: boolean;
  enable_admin_chatbot: boolean;
  flags: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  user_id: string | null;
  full_name: string;
  document_number: string | null;
  role_title: string;
  contract_type: ContractType | null;
  salary: number | null;
  status: EmployeeStatus;
  hired_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeePayment {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  employee_id: string;
  period_start: string | null;
  period_end: string | null;
  gross_amount: number;
  deductions_amount: number | null;
  net_amount: number;
  payment_date: string | null;
  payment_method: string | null;
  note: string | null;
  created_at: string;
}

export interface CashRegister {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CashShift {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  cash_register_id: string;
  opened_by_employee_id: string | null;
  closed_by_employee_id: string | null;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  expected_cash: number | null;
  counted_cash: number | null;
  difference: number | null;
  status: CashShiftStatus;
  note: string | null;
  created_at: string;
}

export interface CashMovement {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  cash_shift_id: string;
  cash_register_id: string;
  created_by_employee_id: string | null;
  movement_type: CashMovementType;
  amount: number;
  category: string | null;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

export interface CashClosure {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  cash_shift_id: string;
  closed_by_employee_id: string | null;
  total_sales_cash: number;
  total_sales_card: number;
  total_sales_transfer: number;
  total_other_income: number;
  total_withdrawals: number;
  total_cash_expenses: number;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  status: CashClosureStatus;
  note: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  actor_user_id: string | null;
  actor_employee_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      restaurants: {
        Row: Restaurant;
        Insert: Omit<Restaurant, "id" | "created_at">;
        Update: Partial<Omit<Restaurant, "id" | "created_at">>;
      };
      branches: {
        Row: Branch;
        Insert: Omit<Branch, "id" | "created_at">;
        Update: Partial<Omit<Branch, "id" | "created_at">>;
      };
      user_restaurants: {
        Row: UserRestaurant;
        Insert: Omit<UserRestaurant, "id" | "created_at">;
        Update: Partial<Omit<UserRestaurant, "id" | "created_at">>;
      };
      tables: {
        Row: Table;
        Insert: Omit<Table, "id">;
        Update: Partial<Omit<Table, "id">>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, "id">;
        Update: Partial<Omit<MenuItem, "id">>;
      };
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, "id" | "created_at">;
        Update: Partial<Omit<Reservation, "id" | "created_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at">;
        Update: Partial<Omit<Order, "id" | "created_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id">;
        Update: Partial<Omit<OrderItem, "id">>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at">;
        Update: Partial<Omit<Expense, "id" | "created_at">>;
      };
      restaurant_settings: {
        Row: RestaurantSettings;
        Insert: Omit<RestaurantSettings, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<RestaurantSettings, "id" | "created_at" | "updated_at">
        >;
      };
      restaurant_branding: {
        Row: RestaurantBranding;
        Insert: Omit<RestaurantBranding, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<RestaurantBranding, "id" | "created_at" | "updated_at">
        >;
      };
      restaurant_integrations: {
        Row: RestaurantIntegration;
        Insert: Omit<RestaurantIntegration, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<RestaurantIntegration, "id" | "created_at" | "updated_at">
        >;
      };
      restaurant_feature_flags: {
        Row: RestaurantFeatureFlags;
        Insert: Omit<
          RestaurantFeatureFlags,
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<RestaurantFeatureFlags, "id" | "created_at" | "updated_at">
        >;
      };
      employees: {
        Row: Employee;
        Insert: Omit<Employee, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Employee, "id" | "created_at" | "updated_at">>;
      };
      employee_payments: {
        Row: EmployeePayment;
        Insert: Omit<EmployeePayment, "id" | "created_at">;
        Update: Partial<Omit<EmployeePayment, "id" | "created_at">>;
      };
      cash_registers: {
        Row: CashRegister;
        Insert: Omit<CashRegister, "id" | "created_at">;
        Update: Partial<Omit<CashRegister, "id" | "created_at">>;
      };
      cash_shifts: {
        Row: CashShift;
        Insert: Omit<CashShift, "id" | "created_at">;
        Update: Partial<Omit<CashShift, "id" | "created_at">>;
      };
      cash_movements: {
        Row: CashMovement;
        Insert: Omit<CashMovement, "id" | "created_at">;
        Update: Partial<Omit<CashMovement, "id" | "created_at">>;
      };
      cash_closures: {
        Row: CashClosure;
        Insert: Omit<CashClosure, "id" | "created_at">;
        Update: Partial<Omit<CashClosure, "id" | "created_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
