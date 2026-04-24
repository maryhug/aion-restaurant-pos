import { NextResponse } from "next/server";
import { advanceStaffOrderStatus } from "@/lib/db/staff-orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    await advanceStaffOrderStatus(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error actualizando estado de pedido:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar el estado" },
      { status: 500 },
    );
  }
}
