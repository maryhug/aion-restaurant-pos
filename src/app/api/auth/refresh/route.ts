import { NextRequest, NextResponse } from "next/server";
import {
  accessCookieConfig,
  refreshCookieConfig,
  refreshCookieName,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const cookieRefreshToken = req.cookies.get(refreshCookieName())?.value;
    const body = (await req.json().catch(() => ({}))) as {
      refreshToken?: string;
    };
    const refreshToken = body.refreshToken ?? cookieRefreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token requerido." },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    const nextAccessToken = await signAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    });
    const nextRefreshToken = await signRefreshToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    });

    const response = NextResponse.json(
      {
        message: "Tokens renovados.",
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      },
      { status: 200 },
    );
    response.cookies.set(accessCookieConfig(nextAccessToken));
    response.cookies.set(refreshCookieConfig(nextRefreshToken));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Refresh token inválido o expirado." },
      { status: 401 },
    );
  }
}
