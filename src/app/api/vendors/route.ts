import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: "desc" }, include: { documents: true } });
  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const company = String(body.company || "").trim();
  if (!company) return NextResponse.json({ errors: { company: "Vendor company is required." } }, { status: 400 });
  try {
    const vendor = await prisma.vendor.create({
      data: {
        company,
        contactPerson: body.contactPerson ? String(body.contactPerson) : null,
        contactEmail: body.contactEmail ? String(body.contactEmail) : null,
        phone: body.phone ? String(body.phone) : null,
        website: body.website ? String(body.website) : null,
        location: body.location ? String(body.location) : null,
        agreementDate: body.agreementDate ? new Date(String(body.agreementDate)) : null,
        clauseDays: Number(body.clauseDays) || 45,
        contacts: body.contacts && typeof body.contacts === "object" ? (body.contacts as Prisma.InputJsonValue) : undefined,
      } as unknown as Prisma.VendorUncheckedCreateInput,
      include: { documents: true },
    });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Failed to create vendor." }, { status: 500 }); }
}
