"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { selectedCandidates } from "@/lib/mock-data";
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "@/lib/invoice-status";
import { formatDate } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";
import { useEffect, useState } from "react";

type Selected = (typeof selectedCandidates)[number];

const statusTone: Record<InvoiceStatus, "red" | "green" | "purple"> = {
  RED: "red",
  GREEN: "green",
  PURPLE: "purple",
};

export default function SelectedCandidatesPage() {
  const [detail, setDetail] = useState<Selected | null>(null);
  const [invoices, setInvoices] = useState<Record<string, Invoice>>({});
  const [clause, setClause] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function loadInvoices() {
    const res = await fetch("/api/invoices");
    if (res.ok) {
      const data = await res.json();
      const map: Record<string, Invoice> = {};
      for (const inv of data.invoices as Invoice[]) map[inv.candidateRef] = inv;
      setInvoices(map);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function generate(s: Selected, useToday = false) {
    setBusy(s.id);
    try {
      const clauseDays = Number(clause[s.id] ?? "45") || 45;
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateRef: s.id,
          candidateName: s.student,
          company: s.company,
          role: s.role,
          doj: s.joiningDate,
          clauseDays,
          ...(useToday ? { invoiceDate: new Date().toISOString().slice(0, 10) } : {}),
        }),
      });
      await loadInvoices();
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(inv: Invoice, statusOverride: string) {
    setBusy(inv.candidateRef);
    try {
      await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusOverride }),
      });
      await loadInvoices();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Selected Candidates</h2>
        <p className="text-sm text-gray-500">
          Candidates marked Selected in CRM. Track invoice status: <span className="font-semibold text-red-600">Red</span> not generated,{" "}
          <span className="font-semibold text-emerald-600">Green</span> invoice generated,{" "}
          <span className="font-semibold text-purple-600">Purple</span> ready to raise.
        </p>
      </div>

      <Table
        headers={["Student", "Company", "Role", "Joining Date", "Invoice Date", "Invoice Status", "Actions"]}
      >
        {selectedCandidates.map((s) => {
          const inv = invoices[s.id];
          const status = inv?.status ?? "RED";
          return (
            <tr key={s.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3">
                <p className="font-medium">{s.student}</p>
                <p className="text-xs text-gray-500">{s.email}</p>
              </td>
              <td className="px-4 py-3">{s.company}</td>
              <td className="px-4 py-3">{s.role}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.joiningDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{inv?.invoiceDate ? formatDate(inv.invoiceDate) : "—"}</td>
              <td className="px-4 py-3">
                <Badge tone={statusTone[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDetail(s)}>View Profile</Button>
                  {!inv ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={clause[s.id] ?? "45"}
                        onChange={(e) => setClause({ ...clause, [s.id]: e.target.value })}
                        className="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm"
                        title="Clause days"
                      />
                      <Button size="sm" variant="secondary" disabled={busy === s.id} onClick={() => generate(s)}>Generate</Button>
                      <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => generate(s, true)} title="Set invoice date = today (test)">Today</Button>
                    </div>
                  ) : (
                    <select
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm"
                      value={status}
                      disabled={busy === s.id}
                      onChange={(e) => setStatus(inv, e.target.value)}
                    >
                      <option value="RED">Red - Not Generated</option>
                      <option value="GREEN">Green - Invoice Generated</option>
                      <option value="PURPLE">Purple - Ready to Raise</option>
                    </select>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Selected Candidate Profile" wide>
        {detail && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-gray-400">Student Details</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{detail.student}</p>
              <p className="text-sm text-gray-500">{detail.email} · {detail.phone}</p>
              <p className="mt-2 text-sm text-gray-600">{detail.profile}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Company</p>
              <p className="mt-1 font-semibold">{detail.company}</p>
              <p className="text-sm text-gray-500">{detail.location}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Role</p>
              <p className="mt-1 font-semibold">{detail.role}</p>
              <Badge className="mt-2" tone="green">Selected</Badge>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Interview Date</p>
              <p className="mt-1 font-semibold">{formatDate(detail.interviewDate)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Joining Date</p>
              <p className="mt-1 font-semibold">{formatDate(detail.joiningDate)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
