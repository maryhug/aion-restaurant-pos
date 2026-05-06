import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  accessCookieConfig,
  refreshCookieConfig,
  signAccessToken,
  signRefreshToken,
  type UserRole,
} from "@/lib/auth/jwt";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validators";
import { mapAuthDbError } from "@/lib/auth/prisma-error";
import { supabaseRaw } from "@/lib/db/supabase";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 },
      );
    }

    // "Deshasheo": comparar password en texto vs hash almacenado
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 },
      );
    }

    const role = user.role as UserRole;
    let restaurantId: string | null = null;

    // Intentamos resolver tenant por membresía del usuario.
    try {
      const { data: memberships } = (await supabaseRaw
        .from("user_restaurants")
        .select("restaurant_id")
        .eq("user_id", user.id)
        .limit(1)) as {
        data: Array<{ restaurant_id: string }> | null;
      };
      restaurantId = memberships?.[0]?.restaurant_id ?? null;
    } catch {
      restaurantId = null;
    }

    const accessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      role,
      restaurantId,
    });
    const refreshToken = await signRefreshToken({
      id: user.id,
      email: user.email,
      role,
      restaurantId,
    });

    const response = NextResponse.json(
      {
        message: "Inicio de sesión exitoso.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId,
        },
        accessToken,
        refreshToken,
      },
      { status: 200 },
    );
    response.cookies.set(accessCookieConfig(accessToken));
    response.cookies.set(refreshCookieConfig(refreshToken));
    return response;
  } catch (error: unknown) {
    console.error("Error en login:", error);
    const mapped = mapAuthDbError(error);
    return NextResponse.json(
      { error: mapped.error, details: mapped.details },
      { status: mapped.status },
    );
  }
}
