import { NextResponse } from "next/server";
import { advanceStaffOrderStatus } from "@/lib/db/staff-orders";
import { getServerSession } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session?.restaurantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await advanceStaffOrderStatus(id, session.restaurantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error actualizando estado de pedido:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar el estado" },
      { status: 500 },
    );
  }
}
