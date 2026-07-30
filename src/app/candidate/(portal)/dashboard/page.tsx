"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CrmSnapshot } from "@/components/dashboard/CrmSnapshot";
import { useUserLabel } from "@/hooks/useAuth";
import { formatWorkedMinutes } from "@/lib/payroll-calc";
import { daysAway, holidays } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Attendance } from "@/types/payroll";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="!p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function CandidateDashboardPage() {
  const { name, email } = useUserLabel();
  const [stats, setStats] = useState({ todayWork: 0, todayBreak: 0, weekWork: 0, monthWork: 0 });
  const [weekly, setWeekly] = useState<{ day: string; work: number; break: number }[]>(
    DAY_LABELS.map((d) => ({ day: d, work: 0, break: 0 }))
  );
  const [leaveSummary, setLeaveSummary] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (!email) return;
    (async () => {
      // Resolve employee by email
      const empRes = await fetch(`/api/employees?q=${encodeURIComponent(email)}`);
      if (empRes.ok) {
        const empData = await empRes.json().catch(() => ({ employees: [] }));
        const emp = (empData.employees ?? []).find((e: { email: string; id: number }) => e.email.toLowerCase() === email.toLowerCase());
        if (emp) {
          const attRes = await fetch(`/api/attendance?employeeId=${emp.id}`);
          if (attRes.ok) {
            const records: Attendance[] = (await attRes.json()).records ?? [];
            const now = new Date();
            const weekStart = startOfWeek(now);
            let todayWork = 0, todayBreak = 0, weekWork = 0, monthWork = 0;
            const wk = DAY_LABELS.map((d) => ({ day: d, work: 0, break: 0 }));
            for (const r of records) {
              const d = new Date(r.date);
              if (sameDay(d, now)) { todayWork += r.workedMinutes; todayBreak += r.breakMinutes; }
              if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) monthWork += r.workedMinutes;
              if (d >= weekStart) {
                weekWork += r.workedMinutes;
                const idx = (d.getDay() + 6) % 7;
                wk[idx].work += Math.round((r.workedMinutes / 60) * 10) / 10;
                wk[idx].break += Math.round((r.breakMinutes / 60) * 10) / 10;
              }
            }
            setStats({ todayWork, todayBreak, weekWork, monthWork });
            setWeekly(wk);
          }
        }
      }
      // Leave summary
      const lvRes = await fetch(`/api/leaves?me=${encodeURIComponent(email)}`);
      if (lvRes.ok) {
        const d = await lvRes.json();
        setLeaveSummary(d.summary ?? { pending: 0, approved: 0, rejected: 0 });
      }
    })();
  }, [email]);

  const upcoming = holidays
    .map((h) => ({ ...h, away: daysAway(h.date, new Date()) }))
    .filter((h) => h.away >= 0)
    .sort((a, b) => a.away - b.away)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {name}!</h2>
        <p className="text-sm text-gray-500">Here&apos;s your work summary for today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today Work" value={formatWorkedMinutes(stats.todayWork)} color="text-brand-red" />
        <StatCard label="Today Break" value={formatWorkedMinutes(stats.todayBreak)} color="text-blue-600" />
        <StatCard label="This Week" value={formatWorkedMinutes(stats.weekWork)} color="text-emerald-600" />
        <StatCard label="This Month" value={formatWorkedMinutes(stats.monthWork)} color="text-orange-600" />
      </div>

      <CrmSnapshot title="My CRM Summary" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Weekly Work &amp; Breaks</h3>
          <div className="h-64 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="work" name="Work Hrs" fill="#A31D31" radius={[4, 4, 0, 0]} />
                <Bar dataKey="break" name="Break Hrs" fill="#60A5FA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">Leave Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-3">
              <span className="text-sm text-gray-700">Pending</span>
              <Badge tone="orange">{leaveSummary.pending}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-3">
              <span className="text-sm text-gray-700">Approved</span>
              <Badge tone="green">{leaveSummary.approved}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-3">
              <span className="text-sm text-gray-700">Rejected</span>
              <Badge tone="red">{leaveSummary.rejected}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Upcoming Holidays</h3>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {upcoming.map((h) => (
            <div key={h.id} className="min-w-[180px] rounded-xl border border-gray-100 bg-gradient-to-br from-white to-brand-pink/30 p-4">
              <p className="font-semibold text-gray-900">{h.name}</p>
              <p className="mt-1 text-sm text-gray-500">{formatDate(h.date)}</p>
              <p className="mt-2 text-xs font-medium text-brand-red">{h.away} days away</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
