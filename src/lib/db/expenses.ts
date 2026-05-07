import prisma from "@/lib/prisma";
import type { Expense } from "@/types/database";

export type ExpenseCategory =
  | "ingredientes"
  | "servicios"
  | "nomina"
  | "equipos"
  | "otros";

export interface ExpenseFormData {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface ExpenseFormErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
}

function toExpense(row: {
  id: string;
  description: string;
  amount: { toNumber(): number } | number;
  category: string;
  date: Date | string;
  restaurant_id: string;
  user_id: string | null;
  created_at: Date | string;
}): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: typeof row.amount === "number" ? row.amount : row.amount.toNumber(),
    category: row.category as Expense["category"],
    date:
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date),
    restaurant_id: row.restaurant_id,
    user_id: row.user_id,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

/**
 * Registrar gasto
 */
export async function createExpense(
  formData: ExpenseFormData,
  restaurantId: string,
  userId?: string,
): Promise<Expense> {
  const row = await prisma.expenses.create({
    data: {
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      date: new Date(formData.date),
      restaurant_id: restaurantId,
      user_id: userId ?? null,
    },
  });

  return toExpense(row);
}

/**
 * Obtener gastos por mes
 */
export async function getExpensesByMonth(
  year: number,
  month: number,
  restaurantId: string,
): Promise<Expense[]> {
  const from = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  const to = new Date(year, month, 0); // último día del mes

  const rows = await prisma.expenses.findMany({
    where: {
      restaurant_id: restaurantId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "desc" },
  });

  return rows.map(toExpense);
}

/**
 * Calcular ganancia mensual: ventas - costos - gastos
 */
export async function getMonthlyProfit(
  year: number,
  month: number,
  restaurantId: string,
): Promise<{
  totalSales: number;
  totalCosts: number;
  totalExpenses: number;
  profit: number;
}> {
  const from = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  const toExclusive = new Date(
    month === 12 ? year + 1 : year,
    month === 12 ? 0 : month,
    1,
  );

  const [sales, expenses, orders] = await Promise.all([
    prisma.sales.findMany({
      where: {
        restaurant_id: restaurantId,
        created_at: { gte: from, lt: toExclusive },
      },
      select: { total: true },
    }),
    prisma.expenses.findMany({
      where: {
        restaurant_id: restaurantId,
        date: { gte: from, lt: toExclusive },
      },
      select: { amount: true },
    }),
    prisma.orders.findMany({
      where: {
        created_at: { gte: from, lt: toExclusive },
        tables: { restaurant_id: restaurantId },
      },
      select: { id: true },
    }),
  ]);

  const totalSales = sales.reduce((s, r) => s + Number(r.total), 0);
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);

  const orderIds = orders.map((o) => o.id);
  let totalCosts = 0;

  if (orderIds.length > 0) {
    const orderItems = await prisma.order_items.findMany({
      where: { order_id: { in: orderIds } },
      select: { quantity: true, menu_items: { select: { cost_price: true } } },
    });

    totalCosts = orderItems.reduce(
      (s, item) =>
        s + (Number(item.menu_items.cost_price) || 0) * item.quantity,
      0,
    );
  }

  return {
    totalSales,
    totalCosts,
    totalExpenses,
    profit: totalSales - totalCosts - totalExpenses,
  };
}
