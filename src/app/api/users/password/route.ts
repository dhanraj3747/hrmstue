import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/users/password { email, newPassword }
// Admin-initiated password set/reset (admin can change candidate passwords and their own).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const newPassword = String(body.newPassword || "");
  if (!email) return NextResponse.json({ errors: { email: "Email is required." } }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ errors: { newPassword: "Password must be at least 6 characters." } }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "No account found with this email." }, { status: 404 });

  await prisma.user.update({ where: { email }, data: { passwordHash: hashPassword(newPassword) } });
  return NextResponse.json({ ok: true });
}
