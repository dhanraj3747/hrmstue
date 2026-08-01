"use client";

import type { AuthUser } from "@/lib/auth";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Note { key: string; text: string; href: string }

export function NotificationBell({ user }: { user: AuthUser }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const list: Note[] = [];
    let unreadCount = 0;

    // Persistent DB notifications (e.g. new job openings for candidates).
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        for (const n of data.notifications ?? []) {
          list.push({ key: `n-${n.id}`, text: n.body || n.title, href: n.href || "#" });
        }
        unreadCount += Number(data.unread || 0);
      }
    } catch {}

    // Unread chat messages.
    try {
      const res = await fetch(`/api/messages?me=${encodeURIComponent(user.email)}`, { cache: "no-store" });
      if (res.ok) {
        const partners = (await res.json()).partners ?? [];
        for (const p of partners) {
          if (p.unread > 0) {
            list.push({ key: `msg-${p.email}`, text: `${p.unread} new message${p.unread > 1 ? "s" : ""} from ${p.name}`, href: user.role === "admin" ? "/admin/messages" : "/candidate/messages" });
            unreadCount += p.unread;
          }
        }
      }
    } catch {}

    // Pending leave requests (admin only).
    if (user.role === "admin") {
      try {
        const res = await fetch("/api/leaves", { cache: "no-store" });
        if (res.ok) {
          const summary = (await res.json()).summary ?? { pending: 0 };
          if (summary.pending > 0) { list.push({ key: "leaves", text: `${summary.pending} pending leave request${summary.pending > 1 ? "s" : ""}`, href: "/admin/leaves" }); unreadCount += summary.pending; }
        }
      } catch {}
    }

    setNotes(list);
    setCount(unreadCount);
  }, [user.email, user.role]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    // Opening the panel marks persistent notifications as read (unread count clears, history stays).
    if (next && count > 0) {
      try { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email }) }); } catch {}
      setCount(0);
      load();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100" onClick={toggle}>
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-72 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">Notifications</p>
          {notes.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-400">No new notifications.</p>
          ) : (
            <div className="max-h-80 overflow-auto">
              {notes.map((n) => (
                <Link key={n.key} href={n.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  {n.text}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
