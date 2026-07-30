"use client";

import { MessageCenter } from "@/components/messages/MessageCenter";
import { useCurrentUser } from "@/hooks/useAuth";
import { useCallback, useEffect, useState } from "react";

interface Contact { email: string; name: string }
interface ApiUser { email: string; firstName: string; lastName: string; role: string }
interface ApiEmployee { email: string; name: string; crmEnabled: boolean }

export default function CandidateMessagesPage() {
  const user = useCurrentUser();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadContacts = useCallback(async () => {
    // Everyone registered in the system can be messaged: admins, HR recruiters
    // and other candidates (including newly signed-up users).
    const [u, e] = await Promise.all([
      fetch("/api/users").then((r) => r.json()).catch(() => ({ users: [] })),
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ employees: [] })),
    ]);
    const map = new Map<string, Contact>();
    for (const emp of (e.employees ?? []) as ApiEmployee[]) {
      if (!emp.email || !emp.crmEnabled) continue;
      map.set(emp.email.toLowerCase(), { email: emp.email, name: `${emp.name} ` });
    }
    for (const usr of (u.users ?? []) as ApiUser[]) {
      if (!usr.email) continue;
      const full = `${usr.firstName} ${usr.lastName}`.trim() || usr.email;
      const existing = map.get(usr.email.toLowerCase());
      const label = usr.role === "admin" ? `${full} (Admin)` : existing ? existing.name : full;
      map.set(usr.email.toLowerCase(), { email: usr.email, name: label });
    }
    setContacts(Array.from(map.values()));
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
        <p className="text-sm text-gray-500">Chat with the admin team, recruiters and other candidates.</p>
      </div>
      {user && (
        <MessageCenter
          meEmail={user.email}
          meName={`${user.firstName} ${user.lastName}`.trim() || user.email}
          meRole="candidate"
          contacts={contacts}
        />
      )}
    </div>
  );
}
