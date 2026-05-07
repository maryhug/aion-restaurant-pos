import type {
  AdminOrder,
  CashClosing,
  Employee,
  Expense,
  InventoryMove,
  InventoryProduct,
  Reservation,
  ServiceExpense,
  TableItem,
  Tenant,
  TrendPoint,
} from "@/features/admin/types";

export const adminTenantMock: Tenant = {
  id: "tenant-ilcafeto",
  restaurantId: "rest-ilcafeto",
  restaurantName: "Il Cafeto",
  restaurantLogo: "/brands/il-cafeto-logo.png",
  activeBranchId: "branch-centro",
  branches: [
    { id: "branch-centro", name: "Sede Centro", city: "Medellin" },
    { id: "branch-norte", name: "Sede Norte", city: "Medellin" },
  ],
  branding: {
    primary: "#6b0024",
    secondary: "#8b2b4a",
    accent: "#b4003f",
    background: "#ffffff",
    defaultMode: "light",
  },
  settings: {
    currency: "COP",
    timezone: "America/Bogota",
    taxRate: 19,
    tipSuggestion: 10,
    enabledPayments: ["cash", "card", "transfer"],
    cancellationPolicy: "Hasta 2 horas antes sin costo",
    reservationToleranceMin: 15,
    maxReservationDurationMin: 120,
    shifts: [
      { name: "Mañana", start: "08:00", end: "15:00" },
      { name: "Noche", start: "15:00", end: "23:00" },
    ],
    notifications: {
      lowStock: true,
      cashDiff: true,
      payrollReminders: true,
      upcomingReservations: true,
    },
  },
  featureFlags: {
    multiBranch: true,
    payroll: true,
    chatbot: true,
  },
};

export const salesByDayMock: TrendPoint[] = [
  { label: "Lun", value: 820000 },
  { label: "Mar", value: 1100000 },
  { label: "Mie", value: 980000 },
  { label: "Jue", value: 1260000 },
  { label: "Vie", value: 1640000 },
  { label: "Sab", value: 2120000 },
  { label: "Dom", value: 1450000 },
];

export const salesByMonthMock: TrendPoint[] = [
  { label: "Ene", value: 28900000 },
  { label: "Feb", value: 30500000 },
  { label: "Mar", value: 33200000 },
  { label: "Abr", value: 34100000 },
  { label: "May", value: 35800000 },
];

export const ordersMock: AdminOrder[] = Array.from({ length: 24 }).map(
  (_, i) => ({
    id: `ORD-${String(2000 + i)}`,
    tenantId: "tenant-ilcafeto",
    branchId: i % 2 === 0 ? "branch-centro" : "branch-norte",
    customer: ["Laura", "Camilo", "Daniela", "Andres"][i % 4],
    waiter: ["Sofia", "Miguel", "Pablo"][i % 3],
    tableOrType: i % 3 === 0 ? "Mesa 5" : i % 3 === 1 ? "Domicilio" : "Recoger",
    status: (
      ["pending", "preparing", "ready", "delivered", "cancelled"] as const
    )[i % 5],
    paymentMethod: (["cash", "card", "transfer", "wallet"] as const)[i % 4],
    channel: (["salon", "reserva", "domicilio", "recoger"] as const)[i % 4],
    date: new Date(Date.now() - i * 3600000).toISOString(),
    total: 45000 + i * 3200,
    items: [
      { name: "Latte Avellana", qty: 1, price: 13500 },
      { name: "Croissant Jamon", qty: 1, price: 16000 },
    ],
  }),
);

export const inventoryProductsMock: InventoryProduct[] = [
  {
    id: "P1",
    name: "Cafe premium",
    category: "Bebidas",
    stock: 8,
    minStock: 12,
    unit: "kg",
    unitCost: 76000,
    supplier: "Cafes SA",
    purchaseDate: "2026-05-01",
    state: "low",
  },
  {
    id: "P2",
    name: "Leche entera",
    category: "Lacteos",
    stock: 40,
    minStock: 15,
    unit: "L",
    unitCost: 4200,
    supplier: "Lacteos Andinos",
    purchaseDate: "2026-05-05",
    state: "ok",
  },
  {
    id: "P3",
    name: "Pan brioche",
    category: "Panaderia",
    stock: 120,
    minStock: 30,
    unit: "und",
    unitCost: 1800,
    supplier: "Pan del Barrio",
    purchaseDate: "2026-05-06",
    state: "overstock",
  },
];

export const serviceExpensesMock: ServiceExpense[] = [
  {
    id: "S1",
    service: "Energia",
    category: "Servicios",
    period: "2026-05",
    value: 680000,
    paidAt: "2026-05-03",
    status: "paid",
    note: "Factura mensual",
  },
  {
    id: "S2",
    service: "Internet",
    category: "Servicios",
    period: "2026-05",
    value: 220000,
    paidAt: "2026-05-02",
    status: "paid",
  },
  {
    id: "S3",
    service: "Mantenimiento",
    category: "Operativo",
    period: "2026-05",
    value: 350000,
    paidAt: "2026-05-07",
    status: "pending",
  },
];

export const inventoryMovesMock: InventoryMove[] = [
  {
    id: "M1",
    date: "2026-05-07",
    product: "Cafe premium",
    type: "entrada",
    quantity: 10,
    reason: "Compra semanal",
    responsible: "Laura",
  },
  {
    id: "M2",
    date: "2026-05-07",
    product: "Leche entera",
    type: "consumo",
    quantity: 14,
    reason: "Produccion diaria",
    responsible: "Miguel",
  },
  {
    id: "M3",
    date: "2026-05-06",
    product: "Pan brioche",
    type: "perdida",
    quantity: 8,
    reason: "Vencimiento",
    responsible: "Sofia",
  },
];

export const expensesMock: Expense[] = [
  {
    id: "E1",
    description: "Compra de frutas",
    category: "Insumos",
    amount: 420000,
    date: "2026-05-06",
    paymentMethod: "transfer",
    responsible: "Sofia",
    status: "paid",
  },
  {
    id: "E2",
    description: "Reparacion molino",
    category: "Mantenimiento",
    amount: 780000,
    date: "2026-05-05",
    paymentMethod: "card",
    responsible: "Andres",
    status: "paid",
  },
  {
    id: "E3",
    description: "Publicidad local",
    category: "Marketing",
    amount: 300000,
    date: "2026-05-04",
    paymentMethod: "cash",
    responsible: "Laura",
    status: "pending",
  },
];

export const cashClosingsMock: CashClosing[] = [
  {
    id: "C1",
    date: "2026-05-06",
    shift: "Noche",
    cashier: "Sofia Diaz",
    openTime: "15:00",
    closeTime: "22:58",
    branch: "Sede Centro",
    baseFund: 200000,
    cashSales: 1380000,
    cardSales: 2050000,
    transferSales: 420000,
    otherIncome: 50000,
    withdrawals: 180000,
    cashExpenses: 120000,
    countedCash: 1320000,
    note: "Sin novedades",
  },
];

export const employeesMock: Employee[] = [
  {
    id: "U1",
    name: "Sofia Diaz",
    document: "1020045566",
    role: "Mesera",
    contractType: "indefinido",
    salary: 1850000,
    status: "activo",
    joinedAt: "2024-02-12",
    lastPaymentAt: "2026-04-30",
  },
  {
    id: "U2",
    name: "Miguel Rojas",
    document: "1019982233",
    role: "Barista",
    contractType: "fijo",
    salary: 2100000,
    status: "activo",
    joinedAt: "2023-11-10",
    lastPaymentAt: "2026-04-30",
  },
  {
    id: "U3",
    name: "Laura Campo",
    document: "43888771",
    role: "Administrador",
    contractType: "prestacion",
    salary: 3200000,
    status: "activo",
    joinedAt: "2022-08-05",
  },
];

export const tablesMock: TableItem[] = [
  { id: "T1", number: 1, capacity: 2, status: "libre", zone: "Terraza" },
  { id: "T2", number: 2, capacity: 4, status: "ocupada", zone: "Salon A" },
  { id: "T3", number: 3, capacity: 4, status: "reservada", zone: "Salon A" },
  { id: "T4", number: 4, capacity: 6, status: "limpieza", zone: "Salon B" },
];

export const reservationsMock: Reservation[] = [
  {
    id: "R1",
    customer: "Carlos Mejia",
    date: "2026-05-08",
    time: "19:00",
    people: 4,
    table: "Mesa 3",
    status: "confirmada",
    notes: "Cumpleaños",
  },
  {
    id: "R2",
    customer: "Natalia Ruiz",
    date: "2026-05-08",
    time: "20:30",
    people: 2,
    table: "Mesa 1",
    status: "pendiente",
  },
];
