import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await prisma.jobOpening.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const role = String(body.role || "").trim();
  if (!role) return NextResponse.json({ errors: { role: "Job role is required." } }, { status: 400 });
  const str = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));
  const job = await prisma.jobOpening.create({
    data: {
      role,
      company: str(body.company),
      vendorId: body.vendorId ? Number(body.vendorId) : null,
      process: str(body.process),
      skills: str(body.skills),
      languages: str(body.languages),
      salary: str(body.salary),
      ctc: str(body.ctc),
      takeHome: str(body.takeHome),
      vendorPayment: str(body.vendorPayment),
      location: str(body.location),
      jd: str(body.jd),
      clauseDays: Number(body.clauseDays) || 45,
      status: String(body.status || "Open"),
    } as unknown as Prisma.JobOpeningUncheckedCreateInput,
  });
  return NextResponse.json({ job }, { status: 201 });
}
