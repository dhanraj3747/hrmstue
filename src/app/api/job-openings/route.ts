import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const jobs = await prisma.jobOpening.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ jobs });
}

// Create a persistent notification for every candidate when a job is posted.
async function notifyCandidates(job: { role: string; company: string | null; location: string | null; createdAt?: Date }) {
  try {
    const candidates = await prisma.user.findMany({ where: { role: "candidate" }, select: { email: true } });
    if (candidates.length === 0) return;
    const when = (job.createdAt ?? new Date()).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const parts = [job.role, job.company, job.location].filter(Boolean).join(" · ");
    const notif = (prisma as unknown as { notification: { createMany(args: unknown): Promise<{ count: number }> } }).notification;
    await notif.createMany({
      data: candidates.map((c) => ({
        email: c.email.toLowerCase(),
        title: "New Job Opening Available",
        body: `${parts} — posted ${when}`,
        href: "/candidate/job-openings",
        type: "job",
      })),
    });
  } catch (e) {
    // Notification table may not exist yet — don't block job creation.
    console.error("notifyCandidates", e);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const role = String(body.role || "").trim();
  if (!role) return NextResponse.json({ errors: { role: "Job role is required." } }, { status: 400 });
  const str = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));
  const data: Record<string, unknown> = {
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
  };
  try {
    const job = await prisma.jobOpening.create({ data: data as unknown as Prisma.JobOpeningUncheckedCreateInput });
    await notifyCandidates(job);
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    // The vendorPayment column may not exist yet (migration not run). Retry without it.
    try {
      delete data.vendorPayment;
      const job = await prisma.jobOpening.create({ data: data as unknown as Prisma.JobOpeningUncheckedCreateInput });
      await notifyCandidates(job);
      return NextResponse.json({ job }, { status: 201 });
    } catch (err2) {
      const e = (err2 ?? err) as { message?: string; code?: string };
      console.error("POST /api/job-openings failed:", e);
      // Surface the real Prisma error so production issues (e.g. missing table
      // P2021, unknown column P2022) are diagnosable instead of a generic message.
      return NextResponse.json(
        { error: "Failed to create job opening.", code: e?.code, detail: e?.message ?? String(e) },
        { status: 500 }
      );
    }
  }
}
