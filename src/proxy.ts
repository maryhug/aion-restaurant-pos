import { NextRequest, NextResponse } from "next/server";
import {
  accessCookieConfig,
  accessCookieName,
  refreshCookieName,
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  type UserRole,
} from "@/lib/auth/jwt";

function canAccess(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/aion/admin")) {
    return role === "admin";
  }
  if (pathname.startsWith("/aion/staff")) {
    return role === "staff" || role === "admin";
  }
  return true;
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/aion/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const accessToken = req.cookies.get(accessCookieName())?.value;
  const refreshToken = req.cookies.get(refreshCookieName())?.value;

  if (!accessToken && !refreshToken) {
    return redirectToLogin(req);
  }

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      if (!canAccess(pathname, payload.role)) {
        return NextResponse.redirect(new URL("/aion", req.url));
      }
      return NextResponse.next();
    } catch {
      // Access token expirado o inválido: intentamos con refresh token.
    }
  }

  if (!refreshToken) {
    return redirectToLogin(req);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    if (!canAccess(pathname, payload.role)) {
      return NextResponse.redirect(new URL("/aion", req.url));
    }

    const nextAccessToken = await signAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    });

    const response = NextResponse.next();
    response.cookies.set(accessCookieConfig(nextAccessToken));
    return response;
  } catch {
    return redirectToLogin(req);
  }
}

export const config = {
  matcher: ["/aion/admin/:path*", "/aion/staff/:path*"],
};
