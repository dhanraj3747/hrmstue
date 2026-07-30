import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyOtp } from "@/lib/otp-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/otp/verify { email, otp, newPassword }
// Verifies the OTP and resets the ADMIN account password.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const otp = String(body.otp || "").trim();
  const newPassword = String(body.newPassword || "");

  if (!email || !otp) return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

  const result = verifyOtp(email, otp);
  if (result === "expired") return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
  if (result === "locked") return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 429 });
  if (result === "invalid") return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No admin account found with this email." }, { status: 404 });
  }

  await prisma.user.update({ where: { email }, data: { passwordHash: hashPassword(newPassword) } });
  return NextResponse.json({ ok: true });
}
