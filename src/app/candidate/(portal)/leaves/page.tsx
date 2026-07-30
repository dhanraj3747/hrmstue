"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { useUserLabel } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

interface Leave {
  id: number; fromDate: string; toDate: string; type: string; reason: string | null; status: string; reviewedBy: string | null;
}
const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Other"];

function tone(status: string): "orange" | "green" | "red" | "gray" {
  return status === "Pending" ? "orange" : status === "Approved" ? "green" : status === "Rejected" ? "red" : "gray";
}

export default function LeavesPage() {
  const { name, email } = useUserLabel();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", type: "Casual", reason: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!email) return;
    const res = await fetch(`/api/leaves?me=${encodeURIComponent(email)}`);
    if (res.ok) {
      const d = await res.json();
      setLeaves(d.leaves ?? []);
      setSummary(d.summary ?? { pending: 0, approved: 0, rejected: 0, total: 0 });
    }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email, name }),
      });
      setOpen(false);
      setForm({ fromDate: "", toDate: "", type: "Casual", reason: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Leaves</h2>
          <p className="text-sm text-gray-500">Request leave and track approval status.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Request Leave</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4"><p className="text-sm text-gray-500">Pending</p><p className="mt-1 text-3xl font-bold text-orange-500">{summary.pending}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">Approved</p><p className="mt-1 text-3xl font-bold text-emerald-600">{summary.approved}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">Rejected</p><p className="mt-1 text-3xl font-bold text-red-600">{summary.rejected}</p></Card>
      </div>

      <Table headers={["From", "To", "Type", "Reason", "Status", "Reviewed By"]}>
        {leaves.length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No leave requests yet.</td></tr>
        ) : (
          leaves.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.fromDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.toDate)}</td>
              <td className="px-4 py-3">{l.type}</td>
              <td className="px-4 py-3">{l.reason || "-"}</td>
              <td className="px-4 py-3"><Badge tone={tone(l.status)}>{l.status}</Badge></td>
              <td className="px-4 py-3">{l.reviewedBy || "-"}</td>
            </tr>
          ))
        )}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title="Request Leave">
        <form className="space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="From" type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
            <Input label="To" type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
          </div>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={LEAVE_TYPES.map((t) => ({ value: t, label: t }))} />
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Button>
        </form>
      </Modal>
    </div>
  );
}
