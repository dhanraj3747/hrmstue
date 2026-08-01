"use client";

import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

interface Emp { id: number; name: string; email: string }

// CSV columns (order used for both export and import).
const COLS = [
  "name", "phone", "email", "itType", "qualification", "languages",
  "location", "remarks", "status", "process", "shortlisted",
  "interviewDate", "doj", "joiningStatus",
] as const;

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// Minimal CSV parser that handles quoted fields, commas and newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c === "\r") {
      // ignore
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export default function AdminEmployeeCrmPage({ params }: { params: { id: string } }) {
  const empId = params.id;
  const [emp, setEmp] = useState<Emp | null>(null);
  const [rows, setRows] = useState<DbCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (email: string) => {
    const res = await fetch(`/api/candidates?owner=${encodeURIComponent(email)}`);
    if (res.ok) setRows((await res.json()).candidates ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees/${empId}`);
        if (res.ok) {
          const e = (await res.json()).employee;
          setEmp({ id: e.id, name: e.name, email: e.email });
          await load(e.email);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [empId, load]);

  function exportCsv() {
    const header = COLS.join(",");
    const lines = rows.map((r) => COLS.map((c) => {
      let v: unknown = r[c as keyof DbCandidate];
      if (c === "languages") v = Array.isArray(r.languages) ? r.languages.join("|") : "";
      if ((c === "interviewDate" || c === "doj") && v) v = String(v).slice(0, 10);
      return csvEscape(v == null ? "" : String(v));
    }).join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-${emp?.name ?? "employee"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File) {
    if (!emp) return;
    setImporting(true);
    setImportMsg("");
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length < 2) { setImportMsg("CSV appears to be empty."); return; }
      const header = parsed[0].map((h) => h.trim());
      const idx = (name: string) => header.indexOf(name);
      let ok = 0, fail = 0;
      for (const r of parsed.slice(1)) {
        const get = (name: string) => { const i = idx(name); return i >= 0 ? (r[i] ?? "").trim() : ""; };
        const name = get("name");
        if (!name) { fail++; continue; }
        const body = {
          name,
          phone: get("phone"),
          email: get("email"),
          itType: get("itType") || "Non-IT",
          qualification: get("qualification"),
          languages: get("languages") ? get("languages").split("|").map((s) => s.trim()).filter(Boolean) : [],
          location: get("location"),
          remarks: get("remarks"),
          status: get("status") || "New Lead",
          process: get("process"),
          shortlisted: get("shortlisted") || "No",
          interviewDate: get("interviewDate") || undefined,
          doj: get("doj") || undefined,
          joiningStatus: get("joiningStatus"),
          owner: emp.email,
          ownerName: emp.name,
        };
        const res = await fetch("/api/candidates", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (res.ok) ok++; else fail++;
      }
      setImportMsg(`Imported ${ok} candidate${ok === 1 ? "" : "s"}${fail ? `, ${fail} skipped` : ""}.`);
      await load(emp.email);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/crm-access" className="inline-flex items-center gap-1 text-sm text-brand-red hover:underline">
          <ArrowLeft size={14} /> Back to CRM Access
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{emp ? `${emp.name}'s CRM` : "Employee CRM"}</h2>
            <p className="text-sm text-gray-500">{emp?.email} · {rows.length} candidates</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
            <Button variant="secondary" disabled={importing || !emp} onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> {importing ? "Importing..." : "Import CSV"}
            </Button>
            <Button variant="secondary" disabled={!emp || rows.length === 0} onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </div>
        {importMsg && <p className="mt-2 text-sm text-emerald-600">{importMsg}</p>}
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <Table headers={["ID", "Name", "Phone", "Email", "Qualification", "Location", "Status", "Process / Company", "Shortlisted", "Interview", "DOJ", "Joining Status", "Added On"]}>
          {loading ? (
            <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={13} className="px-4 py-8 text-center text-gray-400">No candidates in this employee&rsquo;s CRM yet. Use Import CSV to add some.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-2.5 text-gray-500">{r.id}</td>
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5">{r.phone || "-"}</td>
                <td className="px-4 py-2.5">{r.email || "-"}</td>
                <td className="px-4 py-2.5">{r.qualification || "-"}</td>
                <td className="px-4 py-2.5">{r.location || "-"}</td>
                <td className="px-4 py-2.5">{r.status}</td>
                <td className="px-4 py-2.5">{r.process || "-"}</td>
                <td className="px-4 py-2.5">{r.shortlisted}</td>
                <td className="whitespace-nowrap px-4 py-2.5">{r.interviewDate ? formatDate(r.interviewDate) : "-"}</td>
                <td className="whitespace-nowrap px-4 py-2.5">{r.doj ? formatDate(r.doj) : "-"}</td>
                <td className="px-4 py-2.5">{r.joiningStatus || "-"}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">{formatDate(r.addedAt)}</td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}

