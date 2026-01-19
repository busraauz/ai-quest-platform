import { NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST() {
  const res = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
  });

  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );

  response.cookies.delete("access_token");

  return response;
}
