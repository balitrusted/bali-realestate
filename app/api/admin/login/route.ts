import { NextResponse } from "next/server";
import { ADMIN_SESSION_TTL_SECONDS, checkAuth, createAdminSessionToken } from "@/lib/auth";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
} from "@/lib/adminLoginRateLimit";

// Ensure this route runs as serverless on Vercel (avoids 405 for POST)
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function POST(request: Request) {
  const rateLimit = checkAdminLoginRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    if (!process.env.ADMIN_PASSWORD?.trim()) {
      return NextResponse.json(
        { error: "Admin authentication is not configured" },
        { status: 503 }
      );
    }
    const { password } = body;

    if (!password) {
      recordAdminLoginFailure(request);
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const isValid = checkAuth(password);

    if (isValid) {
      const token = createAdminSessionToken();
      if (!token) {
        return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
      }
      clearAdminLoginFailures(request);
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin-auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ADMIN_SESSION_TTL_SECONDS,
        path: "/",
      });
      return response;
    }

    recordAdminLoginFailure(request);
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
