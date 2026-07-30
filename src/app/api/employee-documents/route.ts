import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employeeId");
  const where = employeeId ? { employeeId: Number(employeeId) } : {};
  const documents = await prisma.employeeDocument.findMany({ where, orderBy: { createdAt: "desc" }, include: { employee: true } });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const employeeId = Number(body.employeeId);
  const dataUrl = String(body.dataUrl || "");
  if (!employeeId || !dataUrl) return NextResponse.json({ errors: { file: "employeeId and file are required." } }, { status: 400 });
  try {
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        category: String(body.category || "Other"),
        fileName: String(body.fileName || "document"),
        fileType: body.fileType ? String(body.fileType) : null,
        dataUrl,
      },
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Failed to upload." }, { status: 500 }); }
}
