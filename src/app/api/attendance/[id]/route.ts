import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function pid(id: string) { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; }

// PUT /api/attendance/[id]  — update a live session (worked/break minutes, status, logout).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if (body.logoutAt !== undefined) data.logoutAt = body.logoutAt ? new Date(String(body.logoutAt)) : null;
  if (body.workedMinutes !== undefined) data.workedMinutes = Math.max(0, Number(body.workedMinutes) || 0);
  if (body.breakMinutes !== undefined) data.breakMinutes = Math.max(0, Number(body.breakMinutes) || 0);
  if (body.status !== undefined) data.status = String(body.status);

  try {
    const record = await prisma.attendance.update({ where: { id }, data });
    return NextResponse.json({ record });
  } catch (err) {
    console.error("PUT /api/attendance/[id]", err);
    return NextResponse.json({ error: "Failed to update attendance." }, { status: 500 });
  }
}
