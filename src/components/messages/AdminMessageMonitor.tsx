"use client";

import { Card } from "@/components/ui/Card";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Msg { id: number; fromEmail: string; fromName: string; toEmail: string; body: string; createdAt: string }

export function AdminMessageMonitor() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/messages?all=1");
      if (res.ok) { const d = await res.json(); setMessages(d.messages ?? []); setNames(d.names ?? {}); }
    })();
  }, []);

  const nameOf = (email: string) => names[email.toLowerCase()] || email;

  // Group into conversations by unordered email pair.
  const conversations = useMemo(() => {
    const map = new Map<string, { key: string; a: string; b: string; last: string; at: string; count: number }>();
    for (const m of messages) {
      const [x, y] = [m.fromEmail.toLowerCase(), m.toEmail.toLowerCase()].sort();
      const key = `${x}|${y}`;
      const prev = map.get(key);
      map.set(key, { key, a: x, b: y, last: m.body, at: m.createdAt, count: (prev?.count ?? 0) + 1 });
    }
    return Array.from(map.values()).sort((p, r) => (r.at || "").localeCompare(p.at || ""));
  }, [messages]);

  const filteredConvos = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return conversations;
    return conversations.filter((c) => {
      if (nameOf(c.a).toLowerCase().includes(term) || nameOf(c.b).toLowerCase().includes(term) || c.a.includes(term) || c.b.includes(term)) return true;
      // match message text within this conversation
      return messages.some((m) => {
        const [x, y] = [m.fromEmail.toLowerCase(), m.toEmail.toLowerCase()].sort();
        return `${x}|${y}` === c.key && m.body.toLowerCase().includes(term);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, conversations, messages, names]);

  const thread = useMemo(() => {
    if (!selected) return [];
    return messages.filter((m) => {
      const [x, y] = [m.fromEmail.toLowerCase(), m.toEmail.toLowerCase()].sort();
      return `${x}|${y}` === selected;
    });
  }, [selected, messages]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or messages..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-red" />
          </div>
        </div>
        <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-auto">
          {filteredConvos.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-gray-400">No conversations found.</li>
          ) : (
            filteredConvos.map((c) => (
              <li key={c.key}>
                <button onClick={() => setSelected(c.key)} className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${selected === c.key ? "bg-brand-pink/30" : ""}`}>
                  <p className="truncate text-sm font-medium text-gray-900">{nameOf(c.a)} ↔ {nameOf(c.b)}</p>
                  <p className="truncate text-xs text-gray-500">{c.last}</p>
                  <p className="text-[10px] text-gray-400">{c.count} message{c.count > 1 ? "s" : ""}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <Card className="flex min-h-[60vh] flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a conversation to read the full chat history.</div>
        ) : (
          <div className="flex-1 space-y-2 overflow-auto p-1">
            {thread.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <p className="mb-0.5 text-xs font-semibold text-gray-700">{nameOf(m.fromEmail)} <span className="font-normal text-gray-400">→ {nameOf(m.toEmail)}</span></p>
                <p className="text-gray-800">{m.body}</p>
                <p className="mt-1 text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
