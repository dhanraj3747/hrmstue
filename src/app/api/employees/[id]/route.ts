import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { validateEmployee } from "@/lib/validation/employee";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// GET /api/employees/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  return NextResponse.json({ employee });
}

// PUT /api/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateEmployee(body, true);
  if (!result.ok || !result.data) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const { doj, ...rest } = result.data;

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        doj: doj ? new Date(doj) : null,
      },
    });
    return NextResponse.json({ employee });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
        return NextResponse.json(
          { errors: { [target.includes("email") ? "email" : "employeeId"]: `That ${target} already exists.` } },
          { status: 409 }
        );
      }
    }
    console.error("PUT /api/employees/[id]", err);
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}

// DELETE /api/employees/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id === null) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  try {
    const emp = await prisma.employee.findUnique({ where: { id } });
    await prisma.employee.delete({ where: { id } });
    // Also remove the employee's candidate-portal login account (never an admin).
    if (emp?.email) {
      await prisma.user.deleteMany({ where: { email: emp.email, role: "candidate" } });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    console.error("DELETE /api/employees/[id]", err);
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}
