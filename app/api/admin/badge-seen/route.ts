import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markNotifyRequestsSeen } from "@/lib/adminBadgeState";

export const dynamic = "force-dynamic";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

/** Mark a section as “seen” (e.g. notify list opened) so nav badge can clear. */
export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const section = body?.section as string | undefined;
    if (section === "notify") {
      await markNotifyRequestsSeen();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (e) {
    console.error("badge-seen:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
