"use client";

import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Leave {
  id: number; name: string; email: string; fromDate: string; toDate: string; type: string; reason: string | null; status: string;
}
function tone(status: string): "orange" | "green" | "red" | "gray" {
  return status === "Pending" ? "orange" : status === "Approved" ? "green" : status === "Rejected" ? "red" : "gray";
}

export default function AdminLeavesPage() {
  const [rows, setRows] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/leaves");
      if (res.ok) setRows((await res.json()).leaves ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: string) {
    await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
        <p className="text-sm text-gray-500">Approve or reject leave requests from candidates.</p>
      </div>

      <Table headers={["Employee", "From", "To", "Type", "Reason", "Status", "Actions"]}>
        {loading ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leave requests yet.</td></tr>
        ) : (
          rows.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3">
                <p className="font-medium">{l.name}</p>
                <p className="text-xs text-gray-500">{l.email}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.fromDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.toDate)}</td>
              <td className="px-4 py-3">{l.type}</td>
              <td className="px-4 py-3">{l.reason || "-"}</td>
              <td className="px-4 py-3"><Badge tone={tone(l.status)}>{l.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {l.status !== "Approved" && (
                    <button className="text-sm font-semibold text-emerald-600 hover:underline" onClick={() => setStatus(l.id, "Approved")}>Approve</button>
                  )}
                  {l.status !== "Rejected" && (
                    <button className="text-sm font-semibold text-red-600 hover:underline" onClick={() => setStatus(l.id, "Rejected")}>Reject</button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}
