import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
function pid(id: string) { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; }

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const set = (k: string, v: unknown) => (v === undefined ? {} : { [k]: v });
  try {
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...set("name", body.name !== undefined ? String(body.name) : undefined),
        ...set("phone", body.phone !== undefined ? (body.phone ? String(body.phone) : null) : undefined),
        ...set("email", body.email !== undefined ? (body.email ? String(body.email) : null) : undefined),
        ...set("itType", body.itType !== undefined ? (body.itType ? String(body.itType) : null) : undefined),
        ...set("qualification", body.qualification !== undefined ? (body.qualification ? String(body.qualification) : null) : undefined),
        ...set("languages", body.languages !== undefined ? (Array.isArray(body.languages) ? body.languages : []) : undefined),
        ...set("location", body.location !== undefined ? (body.location ? String(body.location) : null) : undefined),
        ...set("remarks", body.remarks !== undefined ? (body.remarks ? String(body.remarks) : null) : undefined),
        ...set("status", body.status !== undefined ? String(body.status) : undefined),
        ...set("process", body.process !== undefined ? (body.process ? String(body.process) : null) : undefined),
        ...set("shortlisted", body.shortlisted !== undefined ? String(body.shortlisted) : undefined),
        ...set("interviewDate", body.interviewDate !== undefined ? (body.interviewDate ? new Date(String(body.interviewDate)) : null) : undefined),
        ...set("doj", body.doj !== undefined ? (body.doj ? new Date(String(body.doj)) : null) : undefined),
        ...set("joiningStatus", body.joiningStatus !== undefined ? (body.joiningStatus ? String(body.joiningStatus) : null) : undefined),
      } as unknown as Prisma.CandidateUncheckedUpdateInput,
    });
    return NextResponse.json({ candidate });
  } catch { return NextResponse.json({ error: "Failed to update candidate." }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  try { await prisma.candidate.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Failed to delete." }, { status: 500 }); }
}
