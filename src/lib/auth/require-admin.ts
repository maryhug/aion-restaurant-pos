import { NextRequest, NextResponse } from "next/server";
import {
  accessCookieName,
  refreshCookieName,
  verifyAccessToken,
  verifyRefreshToken,
  type AuthJwtPayload,
} from "@/lib/auth/jwt";

type AdminOk = { ok: true; payload: AuthJwtPayload & { restaurantId: string } };
type AdminFail = { ok: false; response: NextResponse };
export type AdminResult = AdminOk | AdminFail;

function deny(msg: string, status: number): AdminFail {
  return { ok: false, response: NextResponse.json({ error: msg }, { status }) };
}

function validate(payload: AuthJwtPayload): AdminOk | AdminFail {
  if (payload.role !== "admin") return deny("Acceso denegado.", 403);
  if (!payload.restaurantId) return deny("Sin restaurante asignado.", 403);
  return {
    ok: true,
    payload: payload as AuthJwtPayload & { restaurantId: string },
  };
}

export async function requireAdmin(req: NextRequest): Promise<AdminResult> {
  const access = req.cookies.get(accessCookieName())?.value;
  const refresh = req.cookies.get(refreshCookieName())?.value;

  if (!access && !refresh) return deny("No autorizado.", 401);

  if (access) {
    try {
      return validate(await verifyAccessToken(access));
    } catch {
      // expirado, intentar con refresh
    }
  }

  if (!refresh) return deny("No autorizado.", 401);

  try {
    return validate(await verifyRefreshToken(refresh));
  } catch {
    return deny("Token inválido.", 401);
  }
}
