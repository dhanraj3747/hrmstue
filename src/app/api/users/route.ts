import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/users?role=candidate  -> safe user list for messaging contacts
export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const where = role ? { role } : {};
  const users = await prisma.user.findMany({
    where,
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role,
    })),
  });
}
