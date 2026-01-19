import { NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: res.status });

  const token = (data as { session?: { access_token?: string } }).session
    ?.access_token;
  if (res.ok && token) {
    response.cookies.set({
      name: "access_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
  }

  return response;
}
