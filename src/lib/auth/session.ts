import { cookies } from "next/headers";
import {
  accessCookieName,
  type AuthJwtPayload,
  verifyAccessToken,
} from "@/lib/auth/jwt";

export async function getServerSession(): Promise<AuthJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(accessCookieName())?.value;
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireTenantSession(): Promise<AuthJwtPayload> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("No autenticado");
  }
  if (!session.restaurantId) {
    throw new Error("No hay tenant activo para este usuario");
  }
  return session;
}
