"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { InvoiceReminders } from "@/components/dashboard/InvoiceReminders";
import { CrmSnapshot } from "@/components/dashboard/CrmSnapshot";
import { HRPerformance } from "@/components/dashboard/HRPerformance";
import { formatWorkedMinutes } from "@/lib/payroll-calc";
import type { Employee } from "@/types/employee";
import { useEffect, useMemo, useState } from "react";

interface Rec { employeeId: number; date: string; workedMinutes: number; breakMinutes: number; status: string }

export default function AdminDashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);

  useEffect(() => {
    (async () => {
      const [e, a] = await Promise.all([
        fetch("/api/employees").then((r) => r.json()).catch(() => ({ employees: [] })),
        fetch("/api/attendance").then((r) => r.json()).catch(() => ({ records: [] })),
      ]);
      setEmployees(e.employees ?? []);
      setRecords(a.records ?? []);
    })();
  }, []);

  // Today's worked/break minutes per employee (real data).
  const today = useMemo(() => {
    const now = new Date();
    const map: Record<number, { work: number; break: number; active: boolean }> = {};
    for (const r of records) {
      const d = new Date(r.date);
      if (d.toDateString() !== now.toDateString()) continue;
      if (!map[r.employeeId]) map[r.employeeId] = { work: 0, break: 0, active: false };
      map[r.employeeId].work += r.workedMinutes;
      map[r.employeeId].break += r.breakMinutes;
      if (r.status === "Active") map[r.employeeId].active = true;
    }
    return map;
  }, [records]);

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const crmCount = employees.filter((e) => e.crmEnabled).length;
  const workingToday = Object.keys(today).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-sm text-gray-500">Live activity tracking for all employees and candidates.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="!p-4"><p className="text-sm text-gray-500">Total Employees</p><p className="mt-1 text-3xl font-bold text-brand-red">{employees.length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">Active</p><p className="mt-1 text-3xl font-bold text-emerald-600">{activeCount}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">CRM Enabled</p><p className="mt-1 text-3xl font-bold text-blue-600">{crmCount}</p></Card>
        <Card className="!p-4"><p className="text-sm text-gray-500">Worked Today</p><p className="mt-1 text-3xl font-bold text-orange-500">{workingToday}</p></Card>
      </div>

      <CrmSnapshot title="CRM Activity" />

      <InvoiceReminders />

      <HRPerformance />

      <div>
        <h3 className="mb-3 text-base font-semibold">Live Employee Status</h3>
        <Table headers={["Name", "Designation", "Status", "Work Hrs (today)", "Break Hrs (today)", "CRM"]}>
          {employees.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No employees yet.</td></tr>
          ) : (
            employees.map((e) => {
              const t = today[e.id];
              return (
                <tr key={e.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.email}</p>
                  </td>
                  <td className="px-4 py-3">{e.designation || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={t ? (t.active ? "orange" : "green") : "gray"}>{t ? (t.active ? "Working" : "Logged Out") : "No activity"}</Badge>
                  </td>
                  <td className="px-4 py-3">{t ? formatWorkedMinutes(t.work) : "0h 00m"}</td>
                  <td className="px-4 py-3">{t ? formatWorkedMinutes(t.break) : "0h 00m"}</td>
                  <td className="px-4 py-3"><Badge tone={e.crmEnabled ? "green" : "red"}>{e.crmEnabled ? "Enabled" : "Disabled"}</Badge></td>
                </tr>
              );
            })
          )}
        </Table>
      </div>
    </div>
  );
}
