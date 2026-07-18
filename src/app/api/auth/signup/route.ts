import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const role = body.role === "admin" ? "admin" : "candidate";

  const errors: Record<string, string> = {};
  if (!firstName) errors.firstName = "First name is required.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        firstName,
        lastName,
        role,
        crmAccess: role === "candidate",
      },
    });
    return NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, crmAccess: user.crmAccess },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ errors: { email: "An account with this email already exists." } }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
