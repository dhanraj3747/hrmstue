"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Employee } from "@/types/employee";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface DbCandidate {
  addedAt: string;
  interviewDate: string | null;
  doj: string | null;
  status: string;
  shortlisted: string;
  owner: string | null;
}

function isToday(v: string | null | undefined) {
  if (!v) return false;
  const d = new Date(v); if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
function isThisMonth(v: string | null | undefined) {
  if (!v) return false;
  const d = new Date(v); if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

function metricsFor(rows: DbCandidate[]) {
  return {
    calls: rows.filter((r) => isToday(r.addedAt)).length,
    scheduled: rows.filter((r) => isToday(r.interviewDate)).length,
    shortlisted: rows.filter((r) => r.shortlisted === "Yes" && isToday(r.addedAt)).length,
    selected: rows.filter((r) => r.status === "Selected").length,
    joined: rows.filter((r) => r.status === "Joined" && (isThisMonth(r.doj) || isThisMonth(r.addedAt))).length,
  };
}

export function HRPerformance() {
  const [hrs, setHrs] = useState<Employee[]>([]);
  const [candidates, setCandidates] = useState<DbCandidate[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [empRes, candRes] = await Promise.all([
        fetch("/api/employees").then((r) => r.json()).catch(() => ({ employees: [] })),
        fetch("/api/candidates").then((r) => r.json()).catch(() => ({ candidates: [] })),
      ]);
      setHrs((empRes.employees ?? []).filter((e: Employee) => e.crmEnabled));
      setCandidates((candRes.candidates ?? []) as DbCandidate[]);
    })();
  }, []);

  // Group candidates by owner email (lowercased) for per-HR attribution.
  const byOwner = useMemo(() => {
    const m = new Map<string, DbCandidate[]>();
    for (const c of candidates) {
      const key = (c.owner ?? "").toLowerCase();
      if (!key) continue;
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    }
    return m;
  }, [candidates]);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">HR Performance</h3>
      <Card className="!p-0">
        {hrs.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No HR recruiters with CRM access yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {hrs.map((hr) => {
              const rows = byOwner.get((hr.email ?? "").toLowerCase()) ?? [];
              const m = metricsFor(rows);
              return (
                <li key={hr.id}>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    onClick={() => setOpen(open === hr.id ? null : hr.id)}
                  >
                    <div className="flex items-center gap-2">
                      {open === hr.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium">{hr.name}</span>
                      <span className="text-xs text-gray-500">{hr.designation ?? hr.department ?? ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{rows.length} candidates</span>
                      <Badge tone="green">CRM</Badge>
                    </div>
                  </button>
                  {open === hr.id && (
                    <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-5">
                      <Metric label="Calls Today" value={m.calls} />
                      <Metric label="Scheduled" value={m.scheduled} />
                      <Metric label="Shortlisted" value={m.shortlisted} />
                      <Metric label="Selected" value={m.selected} />
                      <Metric label="Joined (Month)" value={m.joined} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="text-xs text-gray-400">Live per-HR activity from the database, attributed by the employee who added each candidate.</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
