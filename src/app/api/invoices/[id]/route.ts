import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeInvoiceDate, computeInvoiceStatus } from "@/lib/invoice-status";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// GET /api/invoices/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ invoice: { ...invoice, status: computeInvoiceStatus(invoice.invoiceDate, invoice.raised) } });
}

// PATCH /api/invoices/[id]  — raise invoice (GREEN -> PURPLE) or un-raise
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.statusOverride !== undefined) {
    const so = body.statusOverride === null ? null : String(body.statusOverride);
    data.statusOverride = so;
    if (so === "PURPLE") { data.raised = true; data.raisedAt = new Date(); }
    if (so === "RED" || so === "GREEN") { data.raised = false; data.raisedAt = null; }
  }
  if (body.raised !== undefined) {
    data.raised = Boolean(body.raised);
    data.raisedAt = body.raised ? new Date() : null;
  }
  try {
    const invoice = await prisma.invoice.update({ where: { id }, data });
    const status = (invoice.statusOverride as "RED" | "GREEN" | "PURPLE" | null) ?? computeInvoiceStatus(invoice.invoiceDate, invoice.raised);
    return NextResponse.json({ invoice: { ...invoice, status } });
  } catch (err) {
    console.error("PATCH /api/invoices/[id]", err);
    return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
  }
}

// PUT /api/invoices/[id]  — edit clause days / invoice date / amount
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clauseDays = body.clauseDays !== undefined ? Number(body.clauseDays) : undefined;
  const doj = body.doj !== undefined ? (body.doj ? new Date(String(body.doj)) : null) : undefined;
  let invoiceDate: Date | null | undefined;
  if (body.invoiceDate !== undefined) {
    invoiceDate = body.invoiceDate ? new Date(String(body.invoiceDate)) : null;
  } else if (clauseDays !== undefined && doj !== undefined) {
    const iso = computeInvoiceDate(doj, clauseDays);
    invoiceDate = iso ? new Date(iso) : null;
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(clauseDays !== undefined ? { clauseDays } : {}),
        ...(doj !== undefined ? { doj } : {}),
        ...(invoiceDate !== undefined ? { invoiceDate } : {}),
        ...(body.amount !== undefined ? { amount: body.amount === "" ? null : Number(body.amount) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
      },
    });
    return NextResponse.json({ invoice: { ...invoice, status: computeInvoiceStatus(invoice.invoiceDate, invoice.raised) } });
  } catch (err) {
    console.error("PUT /api/invoices/[id]", err);
    return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
  }
}
