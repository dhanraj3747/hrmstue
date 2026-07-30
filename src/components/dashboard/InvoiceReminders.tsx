"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { INVOICE_STATUS_LABEL } from "@/lib/invoice-status";
import { formatDate } from "@/lib/utils";
import type { Invoice, InvoiceSummary } from "@/types/invoice";
import Link from "next/link";
import { useEffect, useState } from "react";

export function InvoiceReminders() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({ today: 0, upcoming: 0, overdue: 0, raised: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices ?? []);
          setSummary(data.summary ?? { today: 0, upcoming: 0, overdue: 0, raised: 0 });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actionable = invoices
    .filter((i) => !i.raised && i.invoiceDate)
    .sort((a, b) => (a.invoiceDate ?? "").localeCompare(b.invoiceDate ?? ""))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Invoice Reminders</h3>
        <Link href="/admin/selected-candidates" className="text-sm font-semibold text-brand-red hover:underline">
          Manage invoices
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/selected-candidates?invoice=today"><Card className="!p-4 transition hover:shadow-md">
          <p className="text-sm text-gray-500">Due Today</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{summary.today}</p>
        </Card></Link>
        <Link href="/admin/selected-candidates?invoice=overdue"><Card className="!p-4 transition hover:shadow-md">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{summary.overdue}</p>
        </Card></Link>
        <Link href="/admin/selected-candidates?invoice=upcoming"><Card className="!p-4 transition hover:shadow-md">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{summary.upcoming}</p>
        </Card></Link>
        <Link href="/admin/selected-candidates?invoice=raised"><Card className="!p-4 transition hover:shadow-md">
          <p className="text-sm text-gray-500">Raised</p>
          <p className="mt-1 text-3xl font-bold text-purple-600">{summary.raised}</p>
        </Card></Link>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold text-gray-700">Invoices to raise</p>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : actionable.length === 0 ? (
          <p className="text-sm text-gray-400">No pending invoices. Generate invoice dates from Selected Candidates.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {actionable.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{i.candidateName}</span>
                  <span className="text-gray-500"> · {i.company ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{i.invoiceDate ? formatDate(i.invoiceDate) : "—"}</span>
                  <Badge tone={i.status === "GREEN" ? "green" : i.status === "PURPLE" ? "purple" : "red"}>
                    {i.status ? INVOICE_STATUS_LABEL[i.status] : "—"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
