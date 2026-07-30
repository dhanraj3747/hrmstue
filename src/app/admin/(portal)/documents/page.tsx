"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { Employee } from "@/types/employee";
import { Download, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Doc {
  id: number;
  employeeId: number;
  category: string;
  fileName: string;
  fileType: string | null;
  dataUrl: string;
  createdAt: string;
  employee?: { id: number; name: string; employeeId: string };
}

const CATEGORIES = ["Agreement", "Offer Letter", "Contract", "Aadhaar", "PAN", "Other"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState("Agreement");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [d, e] = await Promise.all([
        fetch("/api/employee-documents").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
      ]);
      setDocs(d.documents ?? []);
      setEmployees(e.employees ?? []);
      if (!employeeId && (e.employees ?? []).length) setEmployeeId(String(e.employees[0].id));
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !employeeId) return;
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(String(reader.result));
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      await fetch("/api/employee-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(employeeId), category, fileName: file.name, fileType: file.type, dataUrl }),
      });
      setOpen(false);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/employee-documents/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Uploads</h2>
          <p className="text-sm text-gray-500">All employee documents. Uploads from Add/Edit Employee appear here automatically.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Upload Document</Button>
      </div>

      <Table headers={["Employee", "Type", "File", "Uploaded", "Actions"]}>
        {loading ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : docs.length === 0 ? (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No documents uploaded yet.</td></tr>
        ) : (
          docs.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-medium">{d.employee?.name ?? `#${d.employeeId}`}</td>
              <td className="px-4 py-3"><Badge tone="blue">{d.category}</Badge></td>
              <td className="px-4 py-3">{d.fileName}</td>
              <td className="px-4 py-3">{formatDate(d.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <a href={d.dataUrl} download={d.fileName} className="text-brand-red hover:underline" title="Download"><Download size={16} /></a>
                  <button onClick={() => remove(d.id)} className="text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document">
        <form className="space-y-3" onSubmit={upload}>
          <Select label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
            options={employees.map((emp) => ({ value: String(emp.id), label: `${emp.name} (${emp.employeeId})` }))} />
          <Select label="Document Type" value={category} onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <input ref={fileRef} type="file" className="block w-full text-sm text-gray-600" required />
          <Button type="submit" className="w-full" disabled={busy}><Upload size={15} /> {busy ? "Uploading..." : "Upload"}</Button>
        </form>
      </Modal>
    </div>
  );
}
