import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { computeCycle } from "@/lib/payroll-calc";

export const dynamic = "force-dynamic";

// GET /api/payslip?payrollId=1  or  GET /api/payslip (list)
export async function GET(req: NextRequest) {
  const payrollId = req.nextUrl.searchParams.get("payrollId");
  if (payrollId) {
    const payslip = await prisma.payslip.findUnique({ where: { payrollId: Number(payrollId) } });
    return NextResponse.json({ payslip });
  }
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const approvedOnly = req.nextUrl.searchParams.get("approved") === "1";
  const where: Record<string, unknown> = {};
  if (employeeId) where.payroll = { employeeId: Number(employeeId) };
  if (approvedOnly) where.status = "Approved";
  const payslips = await prisma.payslip.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ payslips });
}

// POST /api/payslip { payrollId }  — create (or return existing) payslip,
// auto-filled from the payroll's employee: bank, PAN, Aadhaar, DOJ, etc.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payrollId = Number(body.payrollId);
  if (!payrollId) return NextResponse.json({ errors: { payrollId: "payrollId is required." } }, { status: 400 });

  const existing = await prisma.payslip.findUnique({ where: { payrollId } });
  if (existing) return NextResponse.json({ payslip: existing });

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: { employee: true },
  });
  if (!payroll || !payroll.employee) {
    return NextResponse.json({ error: "Payroll or employee not found." }, { status: 404 });
  }

  const emp = payroll.employee;
  const clauseDays = Number(body.clauseDays) || payroll.cycleDays || 30;
  const invoiceDate = emp.doj ? new Date(computeCycle(emp.doj, clauseDays).invoiceDate) : null;

  const earnings = [
    { label: "Basic", amount: payroll.basic },
    { label: "Allowances", amount: payroll.allowances },
  ];
  const deductions = [{ label: "Deductions", amount: payroll.deductions }];
  const grossPay = payroll.gross;
  const totalDeductions = payroll.deductions;
  const netPay = payroll.net;

  try {
    const payslip = await prisma.payslip.create({
      data: {
        payrollId,
        employeeName: emp.name,
        employeeCode: emp.employeeId,
        designation: emp.designation,
        department: emp.department,
        doj: emp.doj,
        bankName: emp.bankName,
        accountNumber: emp.accountNumber,
        ifsc: emp.ifsc,
        panNumber: emp.panNumber,
        aadhaarNumber: emp.aadhaarNumber,
        month: payroll.month,
        workedHours: payroll.workedHours,
        earnings: earnings as unknown as Prisma.InputJsonValue,
        deductions: deductions as unknown as Prisma.InputJsonValue,
        grossPay,
        totalDeductions,
        netPay,
        invoiceDate,
        clauseDays,
        status: "Draft",
      },
    });
    return NextResponse.json({ payslip }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payslip", err);
    return NextResponse.json({ error: "Failed to create payslip." }, { status: 500 });
  }
}
