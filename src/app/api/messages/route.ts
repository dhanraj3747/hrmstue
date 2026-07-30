import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/messages?me=a@b.com&with=c@d.com  -> conversation
// GET /api/messages?me=a@b.com               -> list conversation partners (latest first)
export async function GET(req: NextRequest) {
  const me = (req.nextUrl.searchParams.get("me") || "").toLowerCase();
  const withEmail = (req.nextUrl.searchParams.get("with") || "").toLowerCase();
  if (req.nextUrl.searchParams.get("all") === "1") {
    const messages = await prisma.message.findMany({ orderBy: { createdAt: "asc" } });
    const emails = Array.from(new Set(messages.flatMap((m) => [m.fromEmail, m.toEmail])));
    const names: Record<string, string> = {};
    if (emails.length) {
      const [users, employees] = await Promise.all([
        prisma.user.findMany({ where: { email: { in: emails } } }),
        prisma.employee.findMany({ where: { email: { in: emails } } }),
      ]);
      for (const e of employees) if (e.email) names[e.email.toLowerCase()] = e.name;
      for (const u of users) { const f = `${u.firstName} ${u.lastName}`.trim(); if (f) names[u.email.toLowerCase()] = f; }
    }
    return NextResponse.json({ messages, names });
  }
  if (!me) return NextResponse.json({ error: "me is required." }, { status: 400 });

  if (withEmail) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromEmail: me, toEmail: withEmail },
          { fromEmail: withEmail, toEmail: me },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    // Mark incoming as read.
    await prisma.message.updateMany({
      where: { fromEmail: withEmail, toEmail: me, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ messages });
  }

  const all = await prisma.message.findMany({
    where: { OR: [{ fromEmail: me }, { toEmail: me }] },
    orderBy: { createdAt: "desc" },
  });
  const partners: Record<string, { email: string; name: string; lastMessage: string; at: string; unread: number }> = {};
  for (const m of all) {
    const other = m.fromEmail === me ? m.toEmail : m.fromEmail;
    const otherName = m.fromEmail === me ? m.toEmail : m.fromName;
    if (!partners[other]) {
      partners[other] = { email: other, name: otherName, lastMessage: m.body, at: m.createdAt as unknown as string, unread: 0 };
    }
    if (m.toEmail === me && !m.readAt) partners[other].unread++;
  }

  // Resolve display names from the user / employee tables so we never show a raw email.
  const emails = Object.keys(partners);
  if (emails.length > 0) {
    const [users, employees] = await Promise.all([
      prisma.user.findMany({ where: { email: { in: emails } } }),
      prisma.employee.findMany({ where: { email: { in: emails } } }),
    ]);
    const nameByEmail = new Map<string, string>();
    for (const e of employees) if (e.email) nameByEmail.set(e.email.toLowerCase(), e.name);
    for (const u of users) {
      const full = `${u.firstName} ${u.lastName}`.trim();
      if (full) nameByEmail.set(u.email.toLowerCase(), full);
    }
    for (const email of emails) {
      const resolved = nameByEmail.get(email.toLowerCase());
      if (resolved) partners[email].name = resolved;
    }
  }

  return NextResponse.json({ partners: Object.values(partners) });
}

// POST /api/messages  -> send a message
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const fromEmail = String(body.fromEmail || "").trim().toLowerCase();
  const toEmail = String(body.toEmail || "").trim().toLowerCase();
  const text = String(body.body || "").trim();
  if (!fromEmail || !toEmail || !text) {
    return NextResponse.json({ error: "fromEmail, toEmail and body are required." }, { status: 400 });
  }
  const message = await prisma.message.create({
    data: {
      fromEmail,
      fromName: String(body.fromName || fromEmail),
      fromRole: body.fromRole === "admin" ? "admin" : "candidate",
      toEmail,
      body: text,
    },
  });
  return NextResponse.json({ message }, { status: 201 });
}
