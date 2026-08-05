"use client";

import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Contact { email: string; name: string }
interface Msg { id: number; fromEmail: string; fromName: string; toEmail: string; body: string; createdAt: string }
interface Partner { email: string; name: string; lastMessage: string; at: string; unread: number }

export function MessageCenter({
  meEmail,
  meName,
  meRole,
  contacts,
}: {
  meEmail: string;
  meName: string;
  meRole: "admin" | "candidate";
  contacts: Contact[];
}) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadPartners = useCallback(async () => {
    if (!meEmail) return;
    const res = await fetch(`/api/messages?me=${encodeURIComponent(meEmail)}`);
    if (res.ok) setPartners((await res.json()).partners ?? []);
  }, [meEmail]);

  const loadThread = useCallback(async (withEmail: string) => {
    const res = await fetch(`/api/messages?me=${encodeURIComponent(meEmail)}&with=${encodeURIComponent(withEmail)}`);
    if (res.ok) setMessages((await res.json()).messages ?? []);
  }, [meEmail]);

  useEffect(() => {
    loadPartners();
    const t = setInterval(loadPartners, 10000); // dynamic — keep the list fresh
    return () => clearInterval(t);
  }, [loadPartners]);

  useEffect(() => {
    if (!selected) return;
    loadThread(selected.email);
    const t = setInterval(() => loadThread(selected.email), 5000);
    return () => clearInterval(t);
  }, [selected, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Merge contacts + conversation partners (unique by email, excluding myself).
  const list: Contact[] = (() => {
    const map = new Map<string, Contact>();
    // Conversation partners first, then known contacts override with their proper names.
    for (const p of partners) if (p.email.toLowerCase() !== meEmail.toLowerCase()) map.set(p.email.toLowerCase(), { email: p.email, name: p.name });
    for (const c of contacts) if (c.email && c.email.toLowerCase() !== meEmail.toLowerCase()) map.set(c.email.toLowerCase(), c);
    return Array.from(map.values());
  })();

  async function send() {
    if (!selected || !text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail: meEmail, fromName: meName, fromRole: meRole, toEmail: selected.email, body: text.trim() }),
      });
      setText("");
      await loadThread(selected.email);
      await loadPartners();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Contacts */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">Conversations</div>
        <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-auto">
          {list.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-gray-400">No contacts yet.</li>
          ) : (
            list.map((c) => {
              const p = partners.find((x) => x.email.toLowerCase() === c.email.toLowerCase());
              const active = selected?.email.toLowerCase() === c.email.toLowerCase();
              return (
                <li key={c.email}>
                  <button
                    onClick={() => setSelected(c)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${active ? "bg-brand-pink/30" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="truncate text-xs text-gray-500">{p?.lastMessage ?? "Start a conversation"}</p>
                    </div>
                    {p && p.unread > 0 && (
                      <span className="ml-2 rounded-full bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">{p.unread}</span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Thread */}
      <div className="flex min-h-[60vh] flex-col rounded-xl border border-gray-200 bg-white">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">Select a conversation to start chatting.</div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-4">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400">No messages yet. Say hello!</p>
              ) : (
                messages.map((m) => {
                  const mine = m.fromEmail.toLowerCase() === meEmail.toLowerCase();
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand-red text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p>{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
                          {new Date(m.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-gray-100 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-red"
              />
              <Button onClick={send} disabled={sending || !text.trim()}><Send size={16} /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
