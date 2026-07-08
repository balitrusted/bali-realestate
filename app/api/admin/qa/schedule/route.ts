import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  acceptBankProposal,
  getScheduleOverview,
  skipBankProposal,
} from "@/lib/qaScheduler";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const overview = await getScheduleOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("admin qa schedule GET:", error);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "").trim();
    const bankKey = String(body.bankKey || "").trim();

    if (!bankKey) {
      return NextResponse.json({ error: "bankKey required" }, { status: 400 });
    }

    if (action === "skip") {
      const overview = await skipBankProposal(bankKey);
      return NextResponse.json({ success: true, overview });
    }

    if (action === "accept") {
      const result = await acceptBankProposal(bankKey);
      return NextResponse.json({
        success: true,
        question: result.question,
        overview: result.overview,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("admin qa schedule POST:", error);
    const msg = error instanceof Error ? error.message : "Failed to update schedule";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
