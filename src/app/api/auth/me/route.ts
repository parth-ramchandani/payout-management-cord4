import { NextResponse } from "next/server";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

