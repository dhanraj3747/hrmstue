"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { formatWorkedMinutes } from "@/lib/payroll-calc";
import { formatDate } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface Rec {
  id: number;
  employeeId: number;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  breakMinutes: number;
  workedMinutes: number;
  status: string;
  employee?: { id: number; name: string; employeeId: string };
}

const timeOnly = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<Rec[]>([]);
  const [allEmployees, setAllEmployees] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const [att, emp] = await Promise.all([
        fetch("/api/attendance", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ records: [] })),
        fetch("/api/employees", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ employees: [] })),
      ]);
      setRecords(att.records ?? []);
      setAllEmployees((emp.employees ?? []).map((e: { id: number; name: string }) => ({ id: e.id, name: e.name })));
      setLoading(false);
    };
    loadData();
    // Poll so live logins / work hours update automatically.
    const t = setInterval(loadData, 15000);
    return () => clearInterval(t);
  }, []);

  // Every employee appears here (new employees included), even before they clock in.
  const employees = useMemo(() => {
    const map = new Map<number, string>();
    for (const e of allEmployees) map.set(e.id, e.name);
    for (const r of records) if (r.employee) map.set(r.employee.id, r.employee.name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records, allEmployees]);

  const filtered = employeeId ? records.filter((r) => String(r.employeeId) === employeeId) : records;

  const totals = useMemo(() => {
    const now = new Date();
    let today = 0, week = 0, month = 0;
    const weekStart = new Date(now); const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day); weekStart.setHours(0, 0, 0, 0);
    for (const r of filtered) {
      const d = new Date(r.date);
      if (d.toDateString() === now.toDateString()) today += r.workedMinutes;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) month += r.workedMinutes;
      if (d >= weekStart) week += r.workedMinutes;
    }
    return { today, week, month };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
        <p className="text-sm text-gray-500">Login / logout / break / worked-hours history for all candidates. Payroll uses these hours automatically.</p>
      </div>

      <div className="max-w-xs">
        <Select
          label="Filter by employee"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          options={[{ value: "", label: "All employees" }, ...employees.map((e) => ({ value: String(e.id), label: e.name }))]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4"><p className="text-sm text-gray-500">Today Work</p><p className="mt-1 text-2xl font-bold text-brand-red">{formatWorkedMinutes(totals.today)}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">This Week</p><p className="mt-1 text-2xl font-bold text-emerald-600">{formatWorkedMinutes(totals.week)}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">This Month</p><p className="mt-1 text-2xl font-bold text-orange-600">{formatWorkedMinutes(totals.month)}</p></Card>
      </div>

      <Table headers={["Date", "Employee", "Login", "Logout", "Work Hrs", "Break Hrs", "Status"]}>
        {loading ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : filtered.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No attendance records yet.</td></tr>
        ) : (
          filtered.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/80">
              <td className="whitespace-nowrap px-4 py-3">{formatDate(r.date)}</td>
              <td className="px-4 py-3 font-medium">{r.employee?.name ?? `#${r.employeeId}`}</td>
              <td className="px-4 py-3">{timeOnly(r.loginAt)}</td>
              <td className="px-4 py-3">{timeOnly(r.logoutAt)}</td>
              <td className="px-4 py-3">{formatWorkedMinutes(r.workedMinutes)}</td>
              <td className="px-4 py-3">{formatWorkedMinutes(r.breakMinutes)}</td>
              <td className="px-4 py-3"><Badge tone={r.status === "Complete" ? "green" : "orange"}>{r.status === "Active" ? "Working" : r.status === "Break" ? "On Break" : r.status}</Badge></td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}
