"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "@/lib/invoice-status";
import { formatDate } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";
import { useCallback, useEffect, useMemo, useState } from "react";

interface DbCandidate {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  process: string | null;
  location: string | null;
  remarks: string | null;
  interviewDate: string | null;
  doj: string | null;
  joiningStatus: string | null;
  owner: string | null;
  ownerName: string | null;
}

const statusTone: Record<InvoiceStatus, "red" | "green" | "purple"> = { RED: "red", GREEN: "green", PURPLE: "purple" };
const ownerLabel = (c: DbCandidate) => c.ownerName || c.owner || "Unassigned";

export default function SelectedCandidatesPage() {
  const [candidates, setCandidates] = useState<DbCandidate[]>([]);
  const [allEmployees, setAllEmployees] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DbCandidate | null>(null);
  const [invoices, setInvoices] = useState<Record<string, Invoice>>({});
  const [clause, setClause] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  // Filters
  const [fEmployee, setFEmployee] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fInvoice, setFInvoice] = useState("");
  const [fJoin, setFJoin] = useState("");
  const [fDoj, setFDoj] = useState(""); // Date of Joining

  const loadInvoices = useCallback(async () => {
    const res = await fetch("/api/invoices");
    if (res.ok) {
      const data = await res.json();
      const map: Record<string, Invoice> = {};
      for (const inv of data.invoices as Invoice[]) map[inv.candidateRef] = inv;
      setInvoices(map);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cand, emp, ven, job] = await Promise.all([
        fetch("/api/candidates?status=Selected").then((r) => r.json()).catch(() => ({ candidates: [] })),
        fetch("/api/employees").then((r) => r.json()).catch(() => ({ employees: [] })),
        fetch("/api/vendors").then((r) => r.json()).catch(() => ({ vendors: [] })),
        fetch("/api/job-openings").then((r) => r.json()).catch(() => ({ jobs: [] })),
      ]);
      setCandidates((cand.candidates as DbCandidate[]) ?? []);
      setAllEmployees(((emp.employees ?? []) as { name: string }[]).map((e) => e.name).filter(Boolean));
      const companies = new Set<string>();
      for (const v of (ven.vendors ?? []) as { company?: string }[]) if (v.company) companies.add(v.company);
      for (const j of (job.jobs ?? []) as { company?: string }[]) if (j.company) companies.add(j.company);
      setAllCompanies(Array.from(companies));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); loadAll(); }, [loadInvoices, loadAll]);

  function setJoin(c: DbCandidate, value: string) {
    setCandidates((prev) => prev.map((x) => (x.id === c.id ? { ...x, joiningStatus: value } : x)));
    fetch(`/api/candidates/${c.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ joiningStatus: value }),
    }).catch(() => {});
  }

  async function generate(c: DbCandidate, useToday = false) {
    const ref = String(c.id);
    setBusy(ref);
    try {
      const clauseDays = Number(clause[ref] ?? "45") || 45;
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateRef: ref, candidateName: c.name, company: c.process, role: c.process, doj: c.doj, clauseDays,
          ...(useToday ? { invoiceDate: new Date().toISOString().slice(0, 10) } : {}),
        }),
      });
      await loadInvoices();
    } finally { setBusy(null); }
  }

  async function setStatus(inv: Invoice, statusOverride: string) {
    setBusy(inv.candidateRef);
    try {
      await fetch(`/api/invoices/${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statusOverride }) });
      await loadInvoices();
    } finally { setBusy(null); }
  }

  // Employee options = every employee (so a new employee shows even with 0 selections),
  // plus any owner already present on a selected candidate.
  const employees = useMemo(() => {
    const set = new Set<string>(allEmployees);
    for (const c of candidates) set.add(ownerLabel(c));
    return Array.from(set).sort();
  }, [allEmployees, candidates]);

  // Company options = all vendors + job companies + any process on a selected candidate.
  const companies = useMemo(() => {
    const set = new Set<string>(allCompanies);
    for (const c of candidates) if (c.process) set.add(c.process);
    return Array.from(set).sort();
  }, [allCompanies, candidates]);

  const perEmployee = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of candidates) m.set(ownerLabel(c), (m.get(ownerLabel(c)) ?? 0) + 1);
    return m;
  }, [candidates]);

  const rows = candidates.filter((c) => {
    const inv = invoices[String(c.id)];
    const status = inv?.status ?? "RED";
    if (fEmployee && ownerLabel(c) !== fEmployee) return false;
    if (fCompany && c.process !== fCompany) return false;
    if (fInvoice && status !== fInvoice) return false;
    if (fJoin && (c.joiningStatus ?? "") !== fJoin) return false;
    if (fDoj && (!c.doj || c.doj.slice(0, 10) !== fDoj)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Selected Candidates</h2>
        <p className="text-sm text-gray-500">
          Candidates marked <span className="font-semibold">Selected</span> in an employee&rsquo;s CRM, with the employee who selected them.
          Invoice status: <span className="font-semibold text-red-600">Red</span> not generated,{" "}
          <span className="font-semibold text-emerald-600">Green</span> generated,{" "}
          <span className="font-semibold text-purple-600">Purple</span> ready to raise.
        </p>
      </div>

      {/* Employee chips — every employee is listed; click one to see their selections and count */}
      {employees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFEmployee("")} className={`rounded-full border px-3 py-1 text-sm ${fEmployee === "" ? "border-brand-red bg-brand-pink/40 text-brand-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            All employees ({candidates.length})
          </button>
          {employees.map((e) => (
            <button key={e} onClick={() => setFEmployee(e)} className={`rounded-full border px-3 py-1 text-sm ${fEmployee === e ? "border-brand-red bg-brand-pink/40 text-brand-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {e} ({perEmployee.get(e) ?? 0})
            </button>
          ))}
        </div>
      )}

      {/* Filters: Employee, Company, Invoice Status, Joining Status, Date of Joining */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-medium text-gray-500">Employee
          <select value={fEmployee} onChange={(e) => setFEmployee(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Company
          <select value={fCompany} onChange={(e) => setFCompany(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Invoice Status
          <select value={fInvoice} onChange={(e) => setFInvoice(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">All Invoice Status</option>
            <option value="RED">Not Generated</option>
            <option value="GREEN">Invoice Generated</option>
            <option value="PURPLE">Ready to Raise</option>
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Joining Status
          <select value={fJoin} onChange={(e) => setFJoin(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">All Joining Status</option>
            <option value="Joined">Joined</option>
            <option value="Not Joined">Not Joined</option>
            <option value="Yet to Join">Yet to Join</option>
            <option value="Joined but Discontinued">Joined but Discontinued</option>
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">Date of Joining
          <input type="date" value={fDoj} onChange={(e) => setFDoj(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </label>
      </div>

      <datalist id="sel-join-options">
        <option value="Joined" /><option value="Not Joined" /><option value="Yet to Join" /><option value="Joined but Discontinued" />
      </datalist>

      <Table headers={["Candidate", "Employee (Added By)", "Company / Process", "Joining Date", "Joining Status", "Invoice Date", "Invoice Status", "Actions"]}>
        {loading ? (
          <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No selected candidates match the filters. (A candidate appears here once an employee sets their CRM status to &ldquo;Selected&rdquo;.)</td></tr>
        ) : (
          rows.map((c) => {
            const ref = String(c.id);
            const inv = invoices[ref];
            const status = inv?.status ?? "RED";
            return (
              <tr key={c.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3"><p className="font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.email || c.phone}</p></td>
                <td className="px-4 py-3"><Badge tone="blue">{ownerLabel(c)}</Badge></td>
                <td className="px-4 py-3">{c.process || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.doj ? formatDate(c.doj) : "—"}</td>
                <td className="px-4 py-3">
                  <input list="sel-join-options" value={c.joiningStatus ?? ""} onChange={(e) => setJoin(c, e.target.value)} placeholder="Select or type" className="w-40 rounded-md border border-gray-200 px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{inv?.invoiceDate ? formatDate(inv.invoiceDate) : "—"}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[status]}>{INVOICE_STATUS_LABEL[status]}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetail(c)}>View Profile</Button>
                    {!inv ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={clause[ref] ?? "45"} onChange={(e) => setClause({ ...clause, [ref]: e.target.value })} className="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm" title="Clause days" />
                        <Button size="sm" variant="secondary" disabled={busy === ref} onClick={() => generate(c)}>Generate</Button>
                        <Button size="sm" variant="ghost" disabled={busy === ref} onClick={() => generate(c, true)} title="Set invoice date = today (test)">Today</Button>
                      </div>
                    ) : (
                      <select className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={status} disabled={busy === ref} onChange={(e) => setStatus(inv, e.target.value)}>
                        <option value="RED">Red - Not Generated</option>
                        <option value="GREEN">Green - Invoice Generated</option>
                        <option value="PURPLE">Purple - Ready to Raise</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </Table>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Candidate Profile" wide>
        {detail && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-gray-400">Candidate Details</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{detail.name}</p>
              <p className="text-sm text-gray-500">{detail.email} · {detail.phone}</p>
              {detail.remarks && <p className="mt-2 text-sm text-gray-600">{detail.remarks}</p>}
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Selected By (Employee)</p>
              <p className="mt-1 font-semibold">{ownerLabel(detail)}</p>
              {detail.owner && <p className="text-sm text-gray-500">{detail.owner}</p>}
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Company / Process</p>
              <p className="mt-1 font-semibold">{detail.process || "—"}</p>
              <p className="text-sm text-gray-500">{detail.location}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Interview Date</p>
              <p className="mt-1 font-semibold">{detail.interviewDate ? formatDate(detail.interviewDate) : "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">Joining Date</p>
              <p className="mt-1 font-semibold">{detail.doj ? formatDate(detail.doj) : "—"}</p>
              <Badge className="mt-2" tone="green">{detail.joiningStatus || "Selected"}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
