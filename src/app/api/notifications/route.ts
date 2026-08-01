import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Typed accessor for the Notification model (keeps compiling even if the local
// Prisma client hasn't been regenerated yet; works at runtime after migrate).
interface NotificationRow { id: number; email: string; title: string; body: string | null; href: string | null; type: string; readAt: Date | null; createdAt: Date }
interface NotificationDelegate {
  findMany(args: unknown): Promise<NotificationRow[]>;
  createMany(args: unknown): Promise<{ count: number }>;
  updateMany(args: unknown): Promise<{ count: number }>;
}
const notif = (prisma as unknown as { notification: NotificationDelegate }).notification;

// GET /api/notifications?email=<email>  → { notifications, unread }
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ notifications: [], unread: 0 });
  try {
    const notifications = await notif.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    return NextResponse.json({ notifications, unread });
  } catch {
    // Table may not exist yet (migration not run) — fail soft.
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

// POST /api/notifications  { emails: string[], title, body?, href?, type? }
export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const emails = Array.isArray(b.emails) ? (b.emails as string[]) : b.email ? [String(b.email)] : [];
  const title = String(b.title || "").trim();
  if (emails.length === 0 || !title) return NextResponse.json({ error: "emails and title are required." }, { status: 400 });
  try {
    await notif.createMany({
      data: emails.map((e) => ({
        email: String(e).toLowerCase(),
        title,
        body: b.body ? String(b.body) : null,
        href: b.href ? String(b.href) : null,
        type: b.type ? String(b.type) : "general",
      })),
    });
    return NextResponse.json({ ok: true, count: emails.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create notifications." }, { status: 500 });
  }
}

// PATCH /api/notifications  { email }  → mark all of that user's notifications read
export async function PATCH(req: NextRequest) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required." }, { status: 400 });
  try {
    await notif.updateMany({ where: { email, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
