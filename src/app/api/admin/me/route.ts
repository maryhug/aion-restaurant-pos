import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id, email } = auth.payload;

  const user = await prisma.users.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({
    id: user?.id ?? id,
    email: user?.email ?? email,
    name: user?.name ?? email.split("@")[0],
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = auth.payload;
  const body = await req.json();

  if (body.name) {
    await prisma.users.update({
      where: { id },
      data: { name: String(body.name) },
    });
  }
  return NextResponse.json({ ok: true });
}
