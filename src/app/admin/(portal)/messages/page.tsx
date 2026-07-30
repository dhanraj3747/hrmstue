"use client";

import { MessageCenter } from "@/components/messages/MessageCenter";
import { AdminMessageMonitor } from "@/components/messages/AdminMessageMonitor";
import { useCurrentUser } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

interface Contact { email: string; name: string }

export default function AdminMessagesPage() {
  const user = useCurrentUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tab, setTab] = useState<"chats" | "monitor">("chats");

  const loadContacts = useCallback(async () => {
    // Admins can chat with all candidates (auto-refreshes so new signups appear).
    const d = await fetch("/api/users?role=candidate").then((r) => r.json()).catch(() => ({ users: [] }));
    setContacts((d.users ?? []).map((u: { email: string; firstName: string; lastName: string }) => ({ email: u.email, name: `${u.firstName} ${u.lastName}`.trim() || u.email })));
  }, []);

  useEffect(() => {
    loadContacts();
    const t = setInterval(loadContacts, 10000);
    return () => clearInterval(t);
  }, [loadContacts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <p className="text-sm text-gray-500">Chat with candidates. Select a candidate to view and reply.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setTab("chats")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "chats" ? "bg-brand-red text-white" : "bg-white text-gray-700 border border-gray-200"}`}>My Chats</button>
        <button onClick={() => setTab("monitor")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "monitor" ? "bg-brand-red text-white" : "bg-white text-gray-700 border border-gray-200"}`}>Monitor All Conversations</button>
      </div>
      {tab === "monitor" ? (
        <AdminMessageMonitor />
      ) : (
        user && (
          <MessageCenter
            meEmail={user.email}
            meName={`${user.firstName} ${user.lastName}`.trim() || user.email}
            meRole="admin"
            contacts={contacts}
          />
        )
      )}
    </div>
  );
}
