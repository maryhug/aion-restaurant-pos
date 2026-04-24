import { NextResponse } from "next/server";
import { getActiveStaffOrders } from "@/lib/db/staff-orders";

export async function GET() {
  try {
    const orders = await getActiveStaffOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error cargando pedidos activos:", error);
    return NextResponse.json(
      { error: "No fue posible cargar pedidos activos" },
      { status: 500 },
    );
  }
}
