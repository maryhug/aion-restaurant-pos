import { NextResponse } from "next/server";
import { accessCookieName, refreshCookieName } from "@/lib/auth/jwt";

export async function POST() {
  const response = NextResponse.json(
    { message: "Sesión cerrada correctamente." },
    { status: 200 },
  );

  response.cookies.set({
    name: accessCookieName(),
    value: "",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: refreshCookieName(),
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
