"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { examples, onlyDigits } from "@/lib/validators";
import { useEffect, useState } from "react";

interface Job {
  id: number;
  role: string;
  company: string | null;
  vendorId: number | null;
  process: string | null;
  skills: string | null;
  languages: string | null;
  salary: string | null;
  ctc: string | null;
  takeHome: string | null;
  vendorPayment: string | null;
  location: string | null;
  jd: string | null;
  clauseDays: number;
  status: string;
}
interface Vendor { id: number; company: string }

const emptyForm = {
  role: "", company: "", vendorId: "", process: "Voice", skills: "", languages: "",
  salary: "", ctc: "", takeHome: "", vendorPayment: "", location: "", jd: "", clauseDays: "45",
};

export default function AdminJobOpeningsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadVendors = async () => {
    const v = await fetch("/api/vendors", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ vendors: [] }));
    setVendors(v.vendors ?? []);
  };

  async function load() {
    setLoading(true);
    try {
      const [j] = await Promise.all([
        fetch("/api/job-openings", { cache: "no-store" }).then((r) => r.json()),
        loadVendors(),
      ]);
      setJobs(j.jobs ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // Always pull the latest vendors when opening the form, so newly added vendors appear.
  function openCreate() { setEditId(null); setForm(emptyForm); setSaveError(""); loadVendors(); setOpen(true); }
  function openEdit(job: Job) {
    setSaveError("");
    loadVendors();
    setEditId(job.id);
    setForm({
      role: job.role, company: job.company ?? "", vendorId: job.vendorId ? String(job.vendorId) : "",
      process: job.process ?? "Voice", skills: job.skills ?? "", languages: job.languages ?? "",
      salary: job.salary ?? "", ctc: job.ctc ?? "", takeHome: job.takeHome ?? "", vendorPayment: job.vendorPayment ?? "",
      location: job.location ?? "", jd: job.jd ?? "", clauseDays: String(job.clauseDays ?? 45),
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const company = form.company || vendors.find((v) => String(v.id) === form.vendorId)?.company || "";
      const payload = { ...form, company, clauseDays: Number(form.clauseDays), vendorId: form.vendorId || null };
      const url = editId ? `/api/job-openings/${editId}` : "/api/job-openings";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.errors?.role ?? d.error ?? "Failed to save job. Please try again.");
        return;
      }
      setOpen(false);
      await load();
    } catch {
      setSaveError("Network error while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/job-openings/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Openings Management</h2>
          <p className="text-sm text-gray-500">Create jobs with CTC, take-home, clause days per company. These appear in the candidate portal.</p>
        </div>
        <Button onClick={openCreate}>+ Create Job</Button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card><p className="text-gray-400">No job openings yet. Click Create Job.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{job.role}</h3>
                  <p className="text-sm text-brand-red">{job.company}</p>
                </div>
                <Badge tone="red">{job.process}</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-500">{job.location}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>Salary: ₹{job.salary}</p>
                <p>CTC: {job.ctc}</p>
                <p>Take-home: ₹{job.takeHome}</p>
                {job.vendorPayment && <p className="font-medium text-purple-700">Vendor Payment: ₹{job.vendorPayment} <span className="text-xs font-normal text-gray-400">(admin only)</span></p>}
                <p className="text-xs text-gray-400">Clause {job.clauseDays} days</p>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">{job.jd}</p>
              <div className="mt-3 flex gap-3">
                <button className="text-sm font-semibold text-brand-red hover:underline" onClick={() => openEdit(job)}>Edit</button>
                <button className="text-sm font-semibold text-red-600 hover:underline" onClick={() => remove(job.id)}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Job Opening" : "Create Job Opening"} wide>
        <form className="grid max-h-[70vh] gap-3 overflow-y-auto sm:grid-cols-2" onSubmit={submit}>
          <Input label="Job Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
          <Select label="Company / Vendor" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            options={[{ value: "", label: "-- select or type below --" }, ...vendors.map((v) => ({ value: String(v.id), label: v.company }))]} />
          <Input label="Company (free text)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="If not a saved vendor" />
          <Select label="Process" value={form.process} onChange={(e) => setForm({ ...form, process: e.target.value })}
            options={[{ value: "Voice", label: "Voice" }, { value: "Non-Voice", label: "Non-Voice" }]} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <Input label="Languages" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          <Input label="Salary Range" value={form.salary} maxLength={20} onChange={(e) => setForm({ ...form, salary: e.target.value.replace(/[^0-9\s-]/g, "").slice(0,20) })} hint={examples.salaryRange} />
          <Input label="CTC (monthly)" inputMode="numeric" maxLength={8} value={form.ctc} onChange={(e) => setForm({ ...form, ctc: onlyDigits(e.target.value, 8) })} hint={examples.monthlyCtc} />
          <Input label="Take-home Salary" inputMode="numeric" maxLength={8} value={form.takeHome} onChange={(e) => setForm({ ...form, takeHome: onlyDigits(e.target.value, 8) })} hint={examples.takeHome} />
          <Input label="Vendor Payment (internal)" inputMode="numeric" maxLength={10} value={form.vendorPayment} onChange={(e) => setForm({ ...form, vendorPayment: onlyDigits(e.target.value, 10) })} hint="Admin-only — not shown to candidates" />
          <Input label="Clause Days" inputMode="numeric" maxLength={3} value={form.clauseDays} onChange={(e) => { let d = onlyDigits(e.target.value, 3); if (d && Number(d) > 365) d = "365"; setForm({ ...form, clauseDays: d }); }} hint={examples.clauseDays} />
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-semibold">Job Description</label>
            <textarea className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-red" rows={3}
              value={form.jd} onChange={(e) => setForm({ ...form, jd: e.target.value })} />
          </div>
          {saveError && <p className="sm:col-span-2 text-sm text-red-500">{saveError}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : editId ? "Save Changes" : "Create Job"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
