import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
function pid(id: string) { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; }

// PATCH /api/leaves/[id]  -> approve / reject
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const status = String(body.status || "");
  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    return NextResponse.json({ errors: { status: "Invalid status." } }, { status: 400 });
  }
  try {
    const leave = await prisma.leave.update({
      where: { id },
      data: { status, reviewedBy: body.reviewedBy ? String(body.reviewedBy) : "Admin" },
    });
    return NextResponse.json({ leave });
  } catch { return NextResponse.json({ error: "Failed to update leave." }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  try { await prisma.leave.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Failed to delete." }, { status: 500 }); }
}
