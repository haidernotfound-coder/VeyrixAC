import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createAdminSession, setAdminSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (typeof password !== "string" || !checkAdminPassword(password)) {
      return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
    }
    const token = await createAdminSession();
    await setAdminSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
