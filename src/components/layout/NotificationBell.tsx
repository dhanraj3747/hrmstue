"use client";

import type { AuthUser } from "@/lib/auth";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Note { key: string; text: string; href: string }

export function NotificationBell({ user }: { user: AuthUser }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const list: Note[] = [];
    try {
      const res = await fetch(`/api/messages?me=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const partners = (await res.json()).partners ?? [];
        for (const p of partners) {
          if (p.unread > 0) list.push({ key: `msg-${p.email}`, text: `${p.unread} new message${p.unread > 1 ? "s" : ""} from ${p.name}`, href: user.role === "admin" ? "/admin/messages" : "/candidate/messages" });
        }
      }
    } catch {}
    if (user.role === "admin") {
      try {
        const res = await fetch("/api/leaves");
        if (res.ok) {
          const summary = (await res.json()).summary ?? { pending: 0 };
          if (summary.pending > 0) list.push({ key: "leaves", text: `${summary.pending} pending leave request${summary.pending > 1 ? "s" : ""}`, href: "/admin/leaves" });
        }
      } catch {}
    }
    if (user.role === "candidate") {
      try {
        const res = await fetch("/api/job-openings");
        if (res.ok) {
          const jobs = (await res.json()).jobs ?? [];
          const seen = Number(localStorage.getItem("hrms_jobs_seen") || "0");
          const fresh = jobs.length - seen;
          if (fresh > 0) list.push({ key: "jobs", text: `${fresh} new job opening${fresh > 1 ? "s" : ""}`, href: "/candidate/job-openings" });
        }
      } catch {}
    }
    setNotes(list);
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

  const count = notes.reduce((sum, n) => sum + (parseInt(n.text) || 1), 0);

  return (
    <div className="relative" ref={ref}>
      <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100" onClick={() => setOpen((v) => !v)}>
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
            notes.map((n) => (
              <Link key={n.key} href={n.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                {n.text}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
