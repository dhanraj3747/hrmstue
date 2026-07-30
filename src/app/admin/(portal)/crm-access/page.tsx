"use client";

import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import type { Employee } from "@/types/employee";
import { useEffect, useState } from "react";

export default function CRMAccessPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) setRows((await res.json()).employees ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function toggle(emp: Employee) {
    // optimistic
    setRows((prev) => prev.map((x) => (x.id === emp.id ? { ...x, crmEnabled: !x.crmEnabled } : x)));
    await fetch(`/api/employees/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emp, crmEnabled: !emp.crmEnabled }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">CRM Access Control</h2>
        <p className="text-sm text-gray-500">Employees with CRM enabled can use the Recruitment Tracker. This list is live from Employees.</p>
      </div>

      <Table headers={["Employee ID", "Name", "Email", "Designation", "CRM Access"]}>
        {loading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No employees yet.</td></tr>
        ) : (
          rows.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.employeeId}</td>
              <td className="px-4 py-3 font-medium">{e.name}</td>
              <td className="px-4 py-3">{e.email}</td>
              <td className="px-4 py-3">{e.designation || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggle(e)} className={`relative h-6 w-11 rounded-full transition ${e.crmEnabled ? "bg-brand-red" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${e.crmEnabled ? "left-5" : "left-0.5"}`} />
                  </button>
                  <Badge tone={e.crmEnabled ? "green" : "gray"}>{e.crmEnabled ? "Enabled" : "Disabled"}</Badge>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}
