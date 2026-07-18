import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

interface Line { label: string; amount: number }

function normalizeLines(v: unknown): Line[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => ({ label: String((x as Line)?.label ?? ""), amount: Number((x as Line)?.amount) || 0 }))
    .filter((x) => x.label !== "");
}

// GET /api/payslip/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
  return NextResponse.json({ payslip });
}

// PUT /api/payslip/[id]  — edit payslip before generating PDF
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const earnings = normalizeLines(body.earnings);
  const deductions = normalizeLines(body.deductions);
  const grossPay = earnings.reduce((s, l) => s + l.amount, 0);
  const totalDeductions = deductions.reduce((s, l) => s + l.amount, 0);
  const netPay = Math.max(0, grossPay - totalDeductions);

  const opt = (v: unknown) => (v === undefined ? undefined : v === "" || v === null ? null : String(v));

  try {
    const payslip = await prisma.payslip.update({
      where: { id },
      data: {
        employeeName: body.employeeName !== undefined ? String(body.employeeName) : undefined,
        designation: opt(body.designation),
        department: opt(body.department),
        bankName: opt(body.bankName),
        accountNumber: opt(body.accountNumber),
        ifsc: opt(body.ifsc),
        panNumber: opt(body.panNumber),
        aadhaarNumber: opt(body.aadhaarNumber),
        doj: body.doj !== undefined ? (body.doj ? new Date(String(body.doj)) : null) : undefined,
        invoiceDate: body.invoiceDate !== undefined ? (body.invoiceDate ? new Date(String(body.invoiceDate)) : null) : undefined,
        clauseDays: body.clauseDays !== undefined ? (body.clauseDays === "" || body.clauseDays === null ? null : Number(body.clauseDays)) : undefined,
        earnings: earnings as unknown as Prisma.InputJsonValue,
        deductions: deductions as unknown as Prisma.InputJsonValue,
        grossPay,
        totalDeductions,
        netPay,
      },
    });
    return NextResponse.json({ payslip });
  } catch (err) {
    console.error("PUT /api/payslip/[id]", err);
    return NextResponse.json({ error: "Failed to update payslip." }, { status: 500 });
  }
}

// PATCH /api/payslip/[id]  — approve
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = String(body.status || "");
  if (!["Draft", "Approved"].includes(status)) {
    return NextResponse.json({ errors: { status: "Invalid status." } }, { status: 400 });
  }

  try {
    const payslip = await prisma.payslip.update({ where: { id }, data: { status } });
    return NextResponse.json({ payslip });
  } catch (err) {
    console.error("PATCH /api/payslip/[id]", err);
    return NextResponse.json({ error: "Failed to update payslip." }, { status: 500 });
  }
}
