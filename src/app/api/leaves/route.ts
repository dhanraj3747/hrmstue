import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/leaves            -> all leaves (admin)
// GET /api/leaves?me=email   -> that user's leaves + summary
export async function GET(req: NextRequest) {
  const me = (req.nextUrl.searchParams.get("me") || "").toLowerCase();
  const where = me ? { email: me } : {};
  const leaves = await prisma.leave.findMany({ where, orderBy: { createdAt: "desc" } });
  const summary = {
    pending: leaves.filter((l: { status: string }) => l.status === "Pending").length,
    approved: leaves.filter((l: { status: string }) => l.status === "Approved").length,
    rejected: leaves.filter((l: { status: string }) => l.status === "Rejected").length,
    total: leaves.length,
  };
  return NextResponse.json({ leaves, summary });
}

// POST /api/leaves  -> request a leave
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const from = body.fromDate ? new Date(String(body.fromDate)) : null;
  const to = body.toDate ? new Date(String(body.toDate)) : null;
  if (!email || !from || !to) {
    return NextResponse.json({ errors: { form: "Email, from and to dates are required." } }, { status: 400 });
  }

  const leave = await prisma.leave.create({
    data: {
      email,
      name: String(body.name || email),
      employeeId: body.employeeId ? Number(body.employeeId) : null,
      fromDate: from,
      toDate: to,
      type: String(body.type || "Casual"),
      reason: body.reason ? String(body.reason) : null,
      status: "Pending",
    },
  });
  return NextResponse.json({ leave }, { status: 201 });
}
