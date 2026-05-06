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
import {
  isStrongPassword,
  isValidEmail,
  isValidName,
  normalizeEmail,
} from "@/lib/auth/validators";
import { mapAuthDbError } from "@/lib/auth/prisma-error";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const name = (body.name ?? "").trim();
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben completarse." },
        { status: 400 },
      );
    }

    if (!isValidName(name)) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden." },
        { status: 400 },
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role: UserRole = "customer";

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    const accessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      role,
      restaurantId: null,
    });
    const refreshToken = await signRefreshToken({
      id: user.id,
      email: user.email,
      role,
      restaurantId: null,
    });

    const response = NextResponse.json(
      {
        message: "Cuenta creada con éxito.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurantId: null,
        },
        accessToken,
        refreshToken,
      },
      { status: 201 },
    );
    response.cookies.set(accessCookieConfig(accessToken));
    response.cookies.set(refreshCookieConfig(refreshToken));
    return response;
  } catch (error: unknown) {
    console.error("Error en registro:", error);
    const mapped = mapAuthDbError(error);
    return NextResponse.json(
      { error: mapped.error, details: mapped.details },
      { status: mapped.status },
    );
  }
}
