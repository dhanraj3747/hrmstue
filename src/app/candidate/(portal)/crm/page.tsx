"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useUserLabel } from "@/hooks/useAuth";
import { CRM_STATUSES, LANGUAGES, LOCATIONS } from "@/lib/mock-data";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { examples, onlyDigits, onlyLetters } from "@/lib/validators";
import { useCallback, useEffect, useMemo, useState } from "react";

const IT_OPTIONS = ["IT", "Non-IT"];
const SHORTLIST_OPTIONS = ["Yes", "No", "Pending"];

// UI row (all-strings, non-null) mapped from the DB candidate record.
interface Row {
  id: number;
  name: string;
  phone: string;
  email: string;
  itType: string;
  qualification: string;
  languages: string[];
  location: string;
  remarks: string;
  status: string;
  process: string;
  shortlisted: string;
  interviewDate: string;
  doj: string;
  joiningStatus: string;
  addedAt: string;
}

interface DbCandidate {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  itType: string | null;
  qualification: string | null;
  languages: string[] | null;
  location: string | null;
  remarks: string | null;
  status: string;
  process: string | null;
  shortlisted: string;
  interviewDate: string | null;
  doj: string | null;
  joiningStatus: string | null;
  addedAt: string;
}

const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function toRow(c: DbCandidate): Row {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    itType: c.itType ?? "Non-IT",
    qualification: c.qualification ?? "",
    languages: Array.isArray(c.languages) ? c.languages : [],
    location: c.location ?? "",
    remarks: c.remarks ?? "",
    status: c.status,
    process: c.process ?? "-",
    shortlisted: c.shortlisted,
    interviewDate: dateInput(c.interviewDate),
    doj: dateInput(c.doj),
    joiningStatus: c.joiningStatus ?? "",
    addedAt: c.addedAt,
  };
}

const emptyForm = {
  name: "",
  phone: "",
  itType: "Non-IT",
  email: "",
  qualification: "",
  languages: ["English"] as string[],
  location: "Bangalore",
  remarks: "",
  status: "New Lead",
  process: "",
  shortlisted: "No" as string,
  interviewDate: "",
  doj: "",
  joiningStatus: "",
};

function isToday(value: string | undefined): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
function isThisMonth(value: string | undefined): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

export default function CRMPage() {
  const { label, name, email } = useUserLabel();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [joinFilter, setJoinFilter] = useState("");
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [crmAllowed, setCrmAllowed] = useState<boolean | null>(null); // null = checking
  const pageSize = 25;

  // Enforce admin's CRM Access toggle (live from the DB, not the cached login).
  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const res = await fetch(`/api/employees?q=${encodeURIComponent(email)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({ employees: [] }));
        const me = (data.employees ?? []).find((e: { email: string; crmEnabled: boolean }) => e.email.toLowerCase() === email.toLowerCase());
        // If there is an employee record, honour its crmEnabled flag; otherwise allow.
        setCrmAllowed(me ? Boolean(me.crmEnabled) : true);
      } catch { setCrmAllowed(true); }
    })();
  }, [email]);

  // Company / process suggestions come from real vendors + job openings (no test data).
  useEffect(() => {
    (async () => {
      const [ven, job] = await Promise.all([
        fetch("/api/vendors").then((r) => r.json()).catch(() => ({ vendors: [] })),
        fetch("/api/job-openings").then((r) => r.json()).catch(() => ({ jobs: [] })),
      ]);
      const set = new Set<string>();
      for (const v of (ven.vendors ?? []) as { company?: string }[]) if (v.company) set.add(v.company);
      for (const j of (job.jobs ?? []) as { company?: string; role?: string; process?: string }[]) {
        if (j.company) set.add(j.company);
      }
      setCompanyOptions(Array.from(set).sort());
    })();
  }, []);

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates?owner=${encodeURIComponent(email)}`);
      const data = await res.json();
      setRows((data.candidates as DbCandidate[]).map(toRow));
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return rows
      .filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.phone.includes(query) ||
          r.email.toLowerCase().includes(query) ||
          r.location.toLowerCase().includes(query) ||
          r.process.toLowerCase().includes(query)
      )
      .filter((r) => (joinFilter ? r.joiningStatus === joinFilter : true));
  }, [q, rows, joinFilter]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const callsToday = rows.filter((r) => isToday(r.addedAt)).length;
  const shortlistedToday = rows.filter((r) => r.shortlisted === "Yes" && isToday(r.addedAt)).length;
  const scheduledInterviews = rows.filter((r) => isToday(r.interviewDate)).length;
  const joinedThisMonth = rows.filter((r) => r.status === "Joined" && (isThisMonth(r.doj) || isThisMonth(r.addedAt))).length;

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, process: form.process || "-", owner: email, ownerName: name }),
    });
    if (res.ok) {
      const data = await res.json();
      setRows((prev) => [toRow(data.candidate), ...prev]);
    }
    setForm(emptyForm);
    setAddOpen(false);
  }

  function openEdit(r: Row) {
    setEditRow(r);
    setForm({
      name: r.name,
      phone: r.phone,
      itType: r.itType,
      email: r.email,
      qualification: r.qualification,
      languages: r.languages,
      location: r.location,
      remarks: r.remarks,
      status: r.status,
      process: r.process,
      shortlisted: r.shortlisted,
      interviewDate: r.interviewDate,
      doj: r.doj,
      joiningStatus: r.joiningStatus,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    const id = editRow.id;
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...form } : x)));
    setEditRow(null);
    await fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  }

  function updateField(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    fetch(`/api/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }

  async function remove(id: number) {
    setRows((prev) => prev.filter((x) => x.id !== id));
    await fetch(`/api/candidates/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const cards = [
    { label: "Calls Today", value: callsToday, tone: "text-brand-red" },
    { label: "Shortlisted Today", value: shortlistedToday, tone: "text-emerald-600" },
    { label: "Scheduled Interviews", value: scheduledInterviews, tone: "text-orange-500" },
    { label: "Joined This Month", value: joinedThisMonth, tone: "text-purple-600" },
  ];

  if (crmAllowed === false) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">CRM</h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800">
          Your CRM access has been disabled by the admin. Please contact your administrator if you believe this is a mistake.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM</h2>
          <p className="text-sm text-gray-500">Your candidate pipeline, {label}.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setAddOpen(true); }}>
          <Plus size={16} /> Add Candidate
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} className="!p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.tone}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search name, phone, email, location..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <select value={joinFilter} onChange={(e) => setJoinFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <option value="">All Joining Statuses</option>
          <option value="Joined">Joined</option>
          <option value="Not Joined">Not Joined</option>
          <option value="Yet to Join">Yet to Join</option>
          <option value="Joined but Discontinued">Joined but Discontinued</option>
        </select>
      </div>

      <datalist id="joinstatus-options">
        <option value="Joined" />
        <option value="Not Joined" />
        <option value="Yet to Join" />
        <option value="Joined but Discontinued" />
      </datalist>
      <datalist id="company-options">
        {companyOptions.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-[#E8F0FE] text-gray-800">
              {["ID", "Name", "Phone", "IT / Non-IT", "Email", "Qualification", "Languages", "Location", "Remarks", "Status", "Process / Company", "Shortlisted", "Interview Date", "Date of Joining", "Joining Status", "Added On", "Actions"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={17} className="px-3 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={17} className="px-3 py-8 text-center text-gray-400">No candidates yet. Click &ldquo;Add Candidate&rdquo; to start.</td></tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50/40">
                  <td className="px-3 py-2.5 text-gray-500">{r.id}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{r.name}</td>
                  <td className="px-3 py-2.5">{r.phone}</td>
                  <td className="px-3 py-2.5">
                    <select className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={r.itType} onChange={(e) => updateField(r.id, { itType: e.target.value })}>
                      {IT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">{r.email}</td>
                  <td className="px-3 py-2.5">{r.qualification || "-"}</td>
                  <td className="max-w-[140px] truncate px-3 py-2.5">{r.languages.join(", ")}</td>
                  <td className="px-3 py-2.5">{r.location}</td>
                  <td className="max-w-[140px] truncate px-3 py-2.5 text-gray-500">{r.remarks || "-"}</td>
                  <td className="px-3 py-2.5">
                    <select className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={r.status} onChange={(e) => updateField(r.id, { status: e.target.value })}>
                      {CRM_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <input list="company-options" className="w-44 rounded-md border border-gray-200 px-2 py-1 text-sm" placeholder="Select or type company" value={r.process === "-" ? "" : r.process} onChange={(e) => updateField(r.id, { process: e.target.value })} />
                  </td>
                  <td className="px-3 py-2.5">
                    <select className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={r.shortlisted} onChange={(e) => updateField(r.id, { shortlisted: e.target.value })}>
                      {SHORTLIST_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <input type="date" className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={r.interviewDate} onChange={(e) => updateField(r.id, { interviewDate: e.target.value })} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <input type="date" className="rounded-md border border-gray-200 px-2 py-1 text-sm" value={r.doj} onChange={(e) => updateField(r.id, { doj: e.target.value })} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <input list="joinstatus-options" className="w-40 rounded-md border border-gray-200 px-2 py-1 text-sm" placeholder="Select or type" value={r.joiningStatus} onChange={(e) => updateField(r.id, { joiningStatus: e.target.value })} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-600">
                    {new Date(r.addedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(r)} title="Edit"><Pencil size={15} /></button>
                      <button className="rounded p-1 text-red-500 hover:bg-red-50" onClick={() => remove(r.id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{filtered.length} candidates</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span>Page {page} / {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal open={addOpen || !!editRow} onClose={() => { setAddOpen(false); setEditRow(null); }} title={editRow ? "Edit Candidate" : "Add Candidate"} wide>
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={editRow ? saveEdit : addCandidate}>
          <Input label="Name" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: onlyLetters(e.target.value, 100) })} hint={examples.name} required />
          <Input label="Phone" value={form.phone} inputMode="numeric" maxLength={10} onChange={(e) => setForm({ ...form, phone: onlyDigits(e.target.value, 10) })} hint={examples.phone} required />
          <Select label="IT / Non-IT" value={form.itType} onChange={(e) => setForm({ ...form, itType: e.target.value })} options={IT_OPTIONS.map((o) => ({ value: o, label: o }))} />
          <Input label="Email" type="email" value={form.email} maxLength={120} onChange={(e) => setForm({ ...form, email: e.target.value.slice(0, 120) })} hint={examples.email} />
          <Input label="Qualification" value={form.qualification} maxLength={100} onChange={(e) => setForm({ ...form, qualification: e.target.value.slice(0, 100) })} hint="e.g. B.Com, BE" />
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Languages Known</label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 p-2">
              {LANGUAGES.map((lang) => {
                const checked = form.languages.includes(lang);
                return (
                  <label key={lang} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${checked ? "border-brand-red bg-brand-pink/40 text-brand-red" : "border-gray-200 text-gray-600"}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() =>
                        setForm({
                          ...form,
                          languages: checked ? form.languages.filter((l) => l !== lang) : [...form.languages, lang],
                        })
                      }
                    />
                    {lang}
                  </label>
                );
              })}
            </div>
          </div>
          <Select label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} options={LOCATIONS.map((o) => ({ value: o, label: o }))} />
          <Input label="Remarks" value={form.remarks} maxLength={300} onChange={(e) => setForm({ ...form, remarks: e.target.value.slice(0, 300) })} hint="Max 300 characters" />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={CRM_STATUSES.map((o) => ({ value: o, label: o }))} />
          <div className="w-full space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">Process / Company</label>
            <input list="company-options" value={form.process} onChange={(e) => setForm({ ...form, process: e.target.value })} placeholder="Select or type company" className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-red" />
          </div>
          <Select label="Shortlisted" value={form.shortlisted} onChange={(e) => setForm({ ...form, shortlisted: e.target.value })} options={SHORTLIST_OPTIONS.map((o) => ({ value: o, label: o }))} />
          <Input label="Interview Date" type="date" value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} />
          <Input label="Date of Joining" type="date" value={form.doj} onChange={(e) => setForm({ ...form, doj: e.target.value })} />
          <div className="w-full space-y-1.5"><label className="block text-sm font-semibold text-gray-800">Joining Status</label><input list="joinstatus-options" value={form.joiningStatus} onChange={(e) => setForm({ ...form, joiningStatus: e.target.value })} placeholder="Joined / Not Joined / Yet to Join / Other" className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-red" /></div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">{editRow ? "Save Changes" : "Add Candidate"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
