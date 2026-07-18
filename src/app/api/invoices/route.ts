import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  computeInvoiceDate,
  computeInvoiceStatus,
  invoiceBucket,
} from "@/lib/invoice-status";

export const dynamic = "force-dynamic";

// GET /api/invoices  — list all invoices with computed status + summary buckets
export async function GET() {
  const rows = await prisma.invoice.findMany({ orderBy: { invoiceDate: "asc" } });
  const today = new Date();

  const invoices = rows.map((inv) => ({
    ...inv,
    status: (inv.statusOverride as "RED" | "GREEN" | "PURPLE" | null) ?? computeInvoiceStatus(inv.invoiceDate, inv.raised, today),
  }));

  const summary = { today: 0, upcoming: 0, overdue: 0, raised: 0 };
  for (const inv of rows) summary[invoiceBucket(inv.invoiceDate, inv.raised, today)]++;

  return NextResponse.json({ invoices, summary });
}

// POST /api/invoices  — create or update invoice for a candidate (by candidateRef)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const candidateRef = String(body.candidateRef || "").trim();
  if (!candidateRef) return NextResponse.json({ errors: { candidateRef: "candidateRef is required." } }, { status: 400 });

  const clauseDays = Number(body.clauseDays) || 45;
  const doj = body.doj ? new Date(String(body.doj)) : null;
  // Explicit invoiceDate wins; otherwise derive from DOJ + clauseDays.
  const invIso = body.invoiceDate
    ? String(body.invoiceDate)
    : computeInvoiceDate(doj, clauseDays);
  const invoiceDate = invIso ? new Date(invIso) : null;

  const data = {
    candidateRef,
    candidateName: String(body.candidateName || "Candidate"),
    company: body.company ? String(body.company) : null,
    role: body.role ? String(body.role) : null,
    doj,
    clauseDays,
    invoiceDate,
    amount: body.amount !== undefined && body.amount !== "" ? Number(body.amount) : null,
    notes: body.notes ? String(body.notes) : null,
  };

  try {
    const invoice = await prisma.invoice.upsert({
      where: { candidateRef },
      update: data,
      create: data,
    });
    return NextResponse.json({
      invoice: { ...invoice, status: computeInvoiceStatus(invoice.invoiceDate, invoice.raised) },
    });
  } catch (err) {
    console.error("POST /api/invoices", err);
    return NextResponse.json({ error: "Failed to save invoice." }, { status: 500 });
  }
}
