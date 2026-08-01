import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
function pid(id: string) { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; }

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const str = (v: unknown) => (v === undefined ? undefined : v === null || v === "" ? null : String(v));
  const data: Record<string, unknown> = {
    ...(body.role !== undefined ? { role: String(body.role) } : {}),
    ...(body.company !== undefined ? { company: str(body.company) } : {}),
    ...(body.vendorId !== undefined ? { vendorId: body.vendorId ? Number(body.vendorId) : null } : {}),
    ...(body.process !== undefined ? { process: str(body.process) } : {}),
    ...(body.skills !== undefined ? { skills: str(body.skills) } : {}),
    ...(body.languages !== undefined ? { languages: str(body.languages) } : {}),
    ...(body.salary !== undefined ? { salary: str(body.salary) } : {}),
    ...(body.ctc !== undefined ? { ctc: str(body.ctc) } : {}),
    ...(body.takeHome !== undefined ? { takeHome: str(body.takeHome) } : {}),
    ...(body.vendorPayment !== undefined ? { vendorPayment: str(body.vendorPayment) } : {}),
    ...(body.location !== undefined ? { location: str(body.location) } : {}),
    ...(body.jd !== undefined ? { jd: str(body.jd) } : {}),
    ...(body.clauseDays !== undefined ? { clauseDays: Number(body.clauseDays) || 45 } : {}),
    ...(body.status !== undefined ? { status: String(body.status) } : {}),
  };
  try {
    const job = await prisma.jobOpening.update({ where: { id }, data: data as unknown as Prisma.JobOpeningUncheckedUpdateInput });
    return NextResponse.json({ job });
  } catch {
    // vendorPayment column may not exist yet (migration not run). Retry without it.
    try {
      delete data.vendorPayment;
      const job = await prisma.jobOpening.update({ where: { id }, data: data as unknown as Prisma.JobOpeningUncheckedUpdateInput });
      return NextResponse.json({ job });
    } catch { return NextResponse.json({ error: "Failed to update job." }, { status: 500 }); }
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  try { await prisma.jobOpening.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Failed to delete job." }, { status: 500 }); }
}
