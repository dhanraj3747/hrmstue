"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Payslip, PayslipLine } from "@/types/payroll";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function PayslipEditPage() {
  const params = useParams();
  const id = String(params.id);

  const [ps, setPs] = useState<Payslip | null>(null);
  const [earnings, setEarnings] = useState<PayslipLine[]>([]);
  const [deductions, setDeductions] = useState<PayslipLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payslip/${id}`);
      if (res.ok) {
        const d = await res.json();
        setPs(d.payslip);
        setEarnings(d.payslip.earnings ?? []);
        setDeductions(d.payslip.deductions ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  const gross = useMemo(() => earnings.reduce((s, l) => s + (Number(l.amount) || 0), 0), [earnings]);
  const totalDed = useMemo(() => deductions.reduce((s, l) => s + (Number(l.amount) || 0), 0), [deductions]);
  const net = Math.max(0, gross - totalDed);

  function setField<K extends keyof Payslip>(key: K, value: Payslip[K]) {
    setPs((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  function updateLine(list: "e" | "d", i: number, patch: Partial<PayslipLine>) {
    const setter = list === "e" ? setEarnings : setDeductions;
    setter((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    setSaved(false);
  }
  function addLine(list: "e" | "d") {
    const setter = list === "e" ? setEarnings : setDeductions;
    setter((prev) => [...prev, { label: "", amount: 0 }]);
  }
  function removeLine(list: "e" | "d", i: number) {
    const setter = list === "e" ? setEarnings : setDeductions;
    setter((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!ps) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/payslip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ps, earnings, deductions }),
      });
      if (res.ok) {
        const d = await res.json();
        setPs(d.payslip);
        setEarnings(d.payslip.earnings ?? []);
        setDeductions(d.payslip.deductions ?? []);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    await fetch(`/api/payslip/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Approved" }),
    });
    setField("status", "Approved");
  }

  if (loading) return <Card><p className="text-gray-400">Loading...</p></Card>;
  if (!ps) return (
    <Card>
      <p>Payslip not found.</p>
      <Link href="/admin/payroll" className="mt-3 inline-block text-brand-red">Back to payroll</Link>
    </Card>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/payroll" className="text-sm text-brand-red hover:underline">Back to payroll</Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Edit Payslip</h2>
        </div>
        <Badge tone={ps.status === "Approved" ? "green" : "gray"}>{ps.status}</Badge>
      </div>

      <Card className="space-y-4">
        <CardTitle>Employee Details (auto-filled)</CardTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Employee Name" value={ps.employeeName} onChange={(e) => setField("employeeName", e.target.value)} />
          <Input label="Employee Code" value={ps.employeeCode} readOnly />
          <Input label="Designation" value={ps.designation ?? ""} onChange={(e) => setField("designation", e.target.value)} />
          <Input label="Department" value={ps.department ?? ""} onChange={(e) => setField("department", e.target.value)} />
          <Input label="Date of Joining" type="date" value={ps.doj ? ps.doj.slice(0, 10) : ""} onChange={(e) => setField("doj", e.target.value)} />
          <Input label="Month" value={ps.month} readOnly />
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>Bank & Statutory (auto-filled from Employee)</CardTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Bank Name" value={ps.bankName ?? ""} onChange={(e) => setField("bankName", e.target.value)} />
          <Input label="Account Number" value={ps.accountNumber ?? ""} onChange={(e) => setField("accountNumber", e.target.value)} />
          <Input label="IFSC" value={ps.ifsc ?? ""} onChange={(e) => setField("ifsc", e.target.value)} />
          <Input label="PAN Number" value={ps.panNumber ?? ""} onChange={(e) => setField("panNumber", e.target.value)} />
          <Input label="Aadhaar Number" value={ps.aadhaarNumber ?? ""} onChange={(e) => setField("aadhaarNumber", e.target.value)} />
        </div>
      </Card>

      

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Earnings</CardTitle>
            <Button size="sm" variant="secondary" type="button" onClick={() => addLine("e")}>+ Add</Button>
          </div>
          {earnings.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input value={l.label} onChange={(e) => updateLine("e", i, { label: e.target.value })} placeholder="Label" />
              <Input type="number" value={String(l.amount)} onChange={(e) => updateLine("e", i, { amount: Number(e.target.value) })} placeholder="0" />
              <button type="button" className="text-red-500" onClick={() => removeLine("e", i)}>✕</button>
            </div>
          ))}
          <p className="text-right text-sm font-semibold">Gross: {inr(gross)}</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Deductions</CardTitle>
            <Button size="sm" variant="secondary" type="button" onClick={() => addLine("d")}>+ Add</Button>
          </div>
          {deductions.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input value={l.label} onChange={(e) => updateLine("d", i, { label: e.target.value })} placeholder="Label" />
              <Input type="number" value={String(l.amount)} onChange={(e) => updateLine("d", i, { amount: Number(e.target.value) })} placeholder="0" />
              <button type="button" className="text-red-500" onClick={() => removeLine("d", i)}>✕</button>
            </div>
          ))}
          <p className="text-right text-sm font-semibold">Total: {inr(totalDed)}</p>
        </Card>
      </div>

      <Card className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">Net Pay</span>
        <span className="text-lg font-bold text-brand-red">{inr(net)}</span>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Payslip"}</Button>
        <Button variant="success" onClick={approve} disabled={ps.status === "Approved"}>Approve</Button>
        <a href={`/payslip-print/${id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" type="button">Generate / Download PDF</Button>
        </a>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
      <p className="text-xs text-gray-400">Tip: Save your edits before downloading the PDF.</p>
    </div>
  );
}
