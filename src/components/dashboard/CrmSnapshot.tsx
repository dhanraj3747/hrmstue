"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useState } from "react";

interface DbCandidate {
  addedAt: string;
  interviewDate: string | null;
  doj: string | null;
  status: string;
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

export function CrmSnapshot({ title = "CRM Summary" }: { title?: string }) {
  const [metrics, setMetrics] = useState({ calls: 0, scheduled: 0, selected: 0, joined: 0 });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/candidates");
      if (!res.ok) return;
      const data = await res.json();
      const rows = (data.candidates ?? []) as DbCandidate[];
      setMetrics({
        calls: rows.filter((r) => isToday(r.addedAt)).length,
        scheduled: rows.filter((r) => isToday(r.interviewDate)).length,
        selected: rows.filter((r) => r.status === "Selected").length,
        joined: rows.filter((r) => r.status === "Joined" && (isThisMonth(r.doj) || isThisMonth(r.addedAt))).length,
      });
    })();
  }, []);

  const cards = [
    { label: "Calls Today", value: metrics.calls, tone: "text-brand-red" },
    { label: "Scheduled Interviews", value: metrics.scheduled, tone: "text-orange-500" },
    { label: "Selected", value: metrics.selected, tone: "text-blue-600" },
    { label: "Joined (This Month)", value: metrics.joined, tone: "text-purple-600" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="!p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.tone}`}>{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
