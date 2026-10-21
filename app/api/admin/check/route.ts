import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminSession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = isValidAdminSession(cookieStore.get("admin-auth")?.value);

  return NextResponse.json({ authenticated: isAuthenticated });
}
