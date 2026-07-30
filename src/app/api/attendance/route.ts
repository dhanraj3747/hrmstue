import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeWorkedMinutes, minutesToHours } from "@/lib/payroll-calc";

export const dynamic = "force-dynamic";

// GET /api/attendance?employeeId=1&start=2026-02-01&end=2026-02-28
// Returns records plus a worked-hours summary for the range.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const employeeId = sp.get("employeeId");
  const start = sp.get("start");
  const end = sp.get("end");

  const where: Record<string, unknown> = {};
  if (employeeId) where.employeeId = Number(employeeId);
  if (start || end) {
    where.date = {
      ...(start ? { gte: new Date(start) } : {}),
      ...(end ? { lte: new Date(end + "T23:59:59") } : {}),
    };
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    include: { employee: true },
  });

  const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.workedMinutes || 0), 0);
  const totalBreakMinutes = records.reduce((sum, r) => sum + (r.breakMinutes || 0), 0);

  return NextResponse.json({
    records,
    summary: {
      totalWorkedMinutes,
      totalBreakMinutes,
      totalWorkedHours: minutesToHours(totalWorkedMinutes),
      days: records.length,
    },
  });
}

// POST /api/attendance — record a completed work session.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const employeeId = Number(body.employeeId);
  if (!employeeId) {
    return NextResponse.json({ errors: { employeeId: "employeeId is required." } }, { status: 400 });
  }

  const loginAt = body.loginAt ? new Date(String(body.loginAt)) : null;
  const logoutAt = body.logoutAt ? new Date(String(body.logoutAt)) : null;
  const breakMinutes = Math.max(0, Number(body.breakMinutes) || 0);

  // Prefer an explicitly supplied workedMinutes (from the live timer),
  // otherwise derive it from login/logout minus break.
  const workedMinutes =
    body.workedMinutes !== undefined
      ? Math.max(0, Number(body.workedMinutes) || 0)
      : computeWorkedMinutes(loginAt, logoutAt, breakMinutes);

  const date = body.date ? new Date(String(body.date)) : new Date();

  // Enforce ONE attendance record per employee per calendar day.
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const existing = await prisma.attendance.findFirst({
    where: { employeeId, date: { gte: dayStart, lte: dayEnd } },
  });
  if (existing) {
    return NextResponse.json({ error: "Attendance already recorded for today. Only one login is allowed per day." }, { status: 409 });
  }

  try {
    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date,
        loginAt,
        logoutAt,
        breakMinutes,
        workedMinutes,
        status: String(body.status || "Present"),
      },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("POST /api/attendance", err);
    return NextResponse.json({ error: "Failed to save attendance." }, { status: 500 });
  }
}
