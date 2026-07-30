import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOtp } from "@/lib/otp-store";
import { sendOtpEmail, OTP_DELIVERY_EMAIL } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auth/otp/request { email }
// Generates a one-time code for resetting an ADMIN account and delivers it to
// the trusted HR mailbox (hr@redfoxacareerlink.com).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Enter your admin email." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No admin account found with this email." }, { status: 404 });
  }

  const otp = generateOtp(email);
  const devOtp = await sendOtpEmail(email, otp);

  return NextResponse.json({
    ok: true,
    sentTo: OTP_DELIVERY_EMAIL,
    // Only present in non-production so the code is testable before SMTP is wired.
    ...(devOtp ? { devOtp } : {}),
  });
}
