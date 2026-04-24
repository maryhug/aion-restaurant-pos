import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export type UserRole = "customer" | "staff" | "admin";

export interface AuthJwtPayload extends JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const ACCESS_COOKIE_NAME = "aion_access_token";
const REFRESH_COOKIE_NAME = "aion_refresh_token";

function accessSecretKey(): Uint8Array {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("Falta JWT_SECRET en variables de entorno");
  }
  return new TextEncoder().encode(ACCESS_TOKEN_SECRET);
}

function refreshSecretKey(): Uint8Array {
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error("Falta JWT_REFRESH_SECRET en variables de entorno");
  }
  return new TextEncoder().encode(REFRESH_TOKEN_SECRET);
}

export async function signAccessToken(payload: AuthJwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(accessSecretKey());
}

export async function signRefreshToken(
  payload: Pick<AuthJwtPayload, "id" | "email" | "role">,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(refreshSecretKey());
}

export async function verifyAccessToken(token: string): Promise<AuthJwtPayload> {
  const verified = await jwtVerify<AuthJwtPayload>(token, accessSecretKey());
  return verified.payload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<AuthJwtPayload> {
  const verified = await jwtVerify<AuthJwtPayload>(token, refreshSecretKey());
  return verified.payload;
}

export function accessCookieConfig(token: string): ResponseCookie {
  const inProduction = process.env.NODE_ENV === "production";
  return {
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: inProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  };
}

export function refreshCookieConfig(token: string): ResponseCookie {
  const inProduction = process.env.NODE_ENV === "production";
  return {
    name: REFRESH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: inProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function accessCookieName(): string {
  return ACCESS_COOKIE_NAME;
}

export function refreshCookieName(): string {
  return REFRESH_COOKIE_NAME;
}
