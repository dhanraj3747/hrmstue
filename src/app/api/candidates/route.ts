import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/candidates?owner=<email>&status=Selected
// - owner: restrict to one HR's candidates (candidate portal)
// - status: restrict to a pipeline status (admin Selected Candidates view)
// With no owner param, returns ALL candidates (admin can see every HR's CRM).
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  const status = req.nextUrl.searchParams.get("status");
  const where: Prisma.CandidateWhereInput = {};
  if (owner) where.owner = owner;
  if (status) where.status = status;
  const candidates = await prisma.candidate.findMany({ where, orderBy: { addedAt: "desc" } });
  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body.name) return NextResponse.json({ errors: { name: "Name is required." } }, { status: 400 });
  const candidate = await prisma.candidate.create({
    data: {
      name: String(body.name),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      itType: body.itType ? String(body.itType) : null,
      qualification: body.qualification ? String(body.qualification) : null,
      languages: Array.isArray(body.languages) ? body.languages : [],
      location: body.location ? String(body.location) : null,
      remarks: body.remarks ? String(body.remarks) : null,
      status: String(body.status || "New Lead"),
      process: body.process ? String(body.process) : null,
      shortlisted: String(body.shortlisted || "No"),
      interviewDate: body.interviewDate ? new Date(String(body.interviewDate)) : null,
      doj: body.doj ? new Date(String(body.doj)) : null,
      joiningStatus: body.joiningStatus ? String(body.joiningStatus) : null,
      owner: body.owner ? String(body.owner) : null,
      ownerName: body.ownerName ? String(body.ownerName) : null,
    } as unknown as Prisma.CandidateUncheckedCreateInput,
  });
  return NextResponse.json({ candidate }, { status: 201 });
}
