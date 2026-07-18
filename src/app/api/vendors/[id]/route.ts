import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
function pid(id: string) { const n = Number(id); return Number.isInteger(n) && n > 0 ? n : null; }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const vendor = await prisma.vendor.findUnique({ where: { id }, include: { documents: true } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  return NextResponse.json({ vendor });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  try {
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(body.company !== undefined ? { company: String(body.company) } : {}),
        ...(body.contactPerson !== undefined ? { contactPerson: body.contactPerson ? String(body.contactPerson) : null } : {}),
        ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail ? String(body.contactEmail) : null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone ? String(body.phone) : null } : {}),
        ...(body.website !== undefined ? { website: body.website ? String(body.website) : null } : {}),
        ...(body.agreementDate !== undefined ? { agreementDate: body.agreementDate ? new Date(String(body.agreementDate)) : null } : {}),
        ...(body.location !== undefined ? { location: body.location ? String(body.location) : null } : {}),
        ...(body.clauseDays !== undefined ? { clauseDays: Number(body.clauseDays) || 45 } : {}),
      },
      include: { documents: true },
    });
    return NextResponse.json({ vendor });
  } catch { return NextResponse.json({ error: "Failed to update vendor." }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = pid(params.id); if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  try { await prisma.vendor.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Failed to delete vendor." }, { status: 500 }); }
}
