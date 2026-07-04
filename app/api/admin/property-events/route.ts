import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPropertyEvents } from "@/lib/propertyEvents";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId")?.trim();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  try {
    const events = await getPropertyEvents(propertyId);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error reading property events:", error);
    return NextResponse.json(
      { error: "Failed to read property history", events: [] },
      { status: 500 }
    );
  }
}
