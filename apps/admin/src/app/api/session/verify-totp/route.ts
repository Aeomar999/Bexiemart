import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../route";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const incomingCookies = req.headers.get("cookie") || "";

  const res = await fetch(`${API_URL}/auth/two-factor/verify-totp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: incomingCookies,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message ?? "Invalid verification code" },
      { status: res.status }
    );
  }

  if (data.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Not an admin account" }, { status: 403 });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(SESSION_COOKIE, data.token, cookieOptions);
  return response;
}
