import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
export const SESSION_COOKIE = "bx_admin_session";

const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // mirror server session expiresIn (7d)
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data.message ?? "Login failed" },
      { status: res.status }
    );
  }
  // 2FA challenge passthrough (Task 19 server work): no session cookie yet, but pass 2fa challenge cookie.
  if (data.requiresTwoFactor) {
    const response = NextResponse.json({ requiresTwoFactor: true });
    const setCookieHeader = res.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }
    return response;
  }
  if (data.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Not an admin account" }, { status: 403 });
  }
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(SESSION_COOKIE, data.token, cookieOptions);
  return response;
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}
