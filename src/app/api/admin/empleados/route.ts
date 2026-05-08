import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

async function resolvedBranchId(branchId: unknown, restaurantId: string) {
  if (!branchId || typeof branchId !== "string") return null;
  const b = await prisma.branches.findFirst({
    where: { id: branchId, restaurant_id: restaurantId },
    select: { id: true },
  });
  return b?.id ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;

  const employees = await prisma.employees.findMany({
    where: { restaurant_id: restaurantId },
    include: {
      payments: {
        orderBy: { payment_date: "desc" },
        take: 1,
        select: { payment_date: true },
      },
    },
    orderBy: { full_name: "asc" },
  });

  const mapped = employees.map((e) => ({
    id: e.id,
    name: e.full_name,
    document: e.document_number ?? "-",
    role: e.role_title,
    contractType:
      e.contract_type === "temporal"
        ? "fijo"
        : (e.contract_type ?? "indefinido"),
    salary: Number(e.salary ?? 0),
    status: e.status === "active" ? "activo" : "inactivo",
    joinedAt:
      e.hired_at instanceof Date
        ? e.hired_at.toISOString().split("T")[0]
        : e.hired_at
          ? String(e.hired_at)
          : "-",
    lastPaymentAt:
      e.payments[0]?.payment_date instanceof Date
        ? e.payments[0].payment_date.toISOString().split("T")[0]
        : e.payments[0]?.payment_date
          ? String(e.payments[0].payment_date)
          : undefined,
  }));

  const payroll = mapped.reduce((s, e) => s + e.salary, 0);
  const active = mapped.filter((e) => e.status === "activo").length;

  return NextResponse.json({
    employees: mapped,
    total: mapped.length,
    payroll,
    active,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const branchId = await resolvedBranchId(body.branchId, restaurantId);

  const emp = await prisma.employees.create({
    data: {
      restaurant_id: restaurantId,
      branch_id: branchId,
      full_name: String(body.fullName),
      document_number: body.documentNumber ? String(body.documentNumber) : null,
      role_title: String(body.roleTitle),
      contract_type: body.contractType ?? null,
      salary: body.salary != null ? Number(body.salary) : null,
      status: body.status ?? "active",
      hired_at: body.hiredAt ? new Date(body.hiredAt) : null,
    },
  });
  return NextResponse.json({ id: emp.id });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.employees.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const branchId = await resolvedBranchId(body.branchId, restaurantId);

  await prisma.employees.update({
    where: { id: body.id },
    data: {
      full_name: String(body.fullName),
      document_number: body.documentNumber ? String(body.documentNumber) : null,
      role_title: String(body.roleTitle),
      contract_type: body.contractType ?? null,
      salary: body.salary != null ? Number(body.salary) : null,
      status: body.status ?? "active",
      hired_at: body.hiredAt ? new Date(body.hiredAt) : null,
      ...(branchId ? { branch_id: branchId } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();

  const employee = await prisma.employees.findFirst({
    where: { id: body.employeeId, restaurant_id: restaurantId },
  });
  if (!employee)
    return NextResponse.json(
      { error: "Empleado no encontrado" },
      { status: 404 },
    );

  const gross = Number(body.grossAmount);
  const deductions = Number(body.deductionsAmount ?? 0);

  await prisma.employee_payments.create({
    data: {
      restaurant_id: restaurantId,
      branch_id: employee.branch_id,
      employee_id: employee.id,
      gross_amount: gross,
      deductions_amount: deductions,
      net_amount: gross - deductions,
      payment_date: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      payment_method: body.paymentMethod ?? null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { restaurantId } = auth.payload;
  const body = await req.json();
  const exists = await prisma.employees.findFirst({
    where: { id: body.id, restaurant_id: restaurantId },
  });
  if (!exists)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const newStatus = body.activate ? "active" : "inactive";
  await prisma.employees.update({
    where: { id: body.id },
    data: { status: newStatus },
  });
  return NextResponse.json({ ok: true });
}
