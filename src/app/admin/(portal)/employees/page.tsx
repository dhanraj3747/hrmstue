"use client";

import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { emptyEmployeeForm } from "@/lib/employee-form";
import { employeeErrors } from "@/lib/validators";
import { formatDate } from "@/lib/utils";
import type { Employee, EmployeeInput } from "@/types/employee";
import Link from "next/link";
import { useEffect, useState } from "react";

function statusTone(status: string): "green" | "gray" | "orange" | "blue" {
  switch (status) {
    case "Active":
      return "green";
    case "Inactive":
      return "gray";
    case "Notice Period":
      return "orange";
    default:
      return "blue";
  }
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeInput>(emptyEmployeeForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [pwEmail, setPwEmail] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [delEmp, setDelEmp] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [flash, setFlash] = useState("");

  async function confirmDelete() {
    if (!delEmp) return;
    setDeleting(true);
    setDelErr("");
    try {
      const res = await fetch(`/api/employees/${delEmp.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setDelErr(d.error ?? "Failed to delete."); return; }
      setDelEmp(null);
      await load(search);
    } finally {
      setDeleting(false);
    }
  }

  async function resetPassword(ev: React.FormEvent) {
    ev.preventDefault();
    setPwMsg("");
    if (pwValue.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    const res = await fetch("/api/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pwEmail, newPassword: pwValue }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setPwMsg(d.error ?? "Failed to update."); return; }
    setPwMsg("Password updated.");
    setPwValue("");
  }

  async function load(q = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setRows(data.employees ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = employeeErrors(form);
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Employee already exists (added earlier). If a login password was entered,
        // just set/create their credentials instead of failing on the duplicate.
        if (res.status === 409 && data.errors?.email && form.email) {
          if (loginPassword) {
            const pres = await fetch("/api/users/password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email, newPassword: loginPassword }),
            });
            if (pres.ok) {
              setOpen(false);
              setFlash(`Login credentials set for existing employee ${form.email}. They can now sign in.`);
              await load(search);
              return;
            }
          }
          setErrors({
            email:
              "This employee already exists. Enter a Login Password here to create their credentials, or use the Password button on their row.",
          });
          return;
        }
        setErrors(data.errors ?? { form: data.error ?? "Failed to save." });
        return;
      }
      const data = await res.json().catch(() => ({}));
      // Create the employee's login account (create-or-set) so they can sign into the
      // candidate portal. This is checked — a silent failure would leave them unable to log in.
      if (loginPassword && form.email) {
        try {
          const pres = await fetch("/api/users/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, newPassword: loginPassword }),
          });
          if (!pres.ok) {
            const d = await pres.json().catch(() => ({}));
            setFlash(`Employee saved, but the login could not be set up (${d.error ?? d.errors?.newPassword ?? "unknown error"}). Use the Password button on their row to set it.`);
          }
        } catch {
          setFlash("Employee saved, but the login could not be set up (network error). Use the Password button on their row to set it.");
        }
      }
      if (data.employee?.id) setCreatedId(data.employee.id);
      await load(search);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-500">Add and edit employee details.</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyEmployeeForm);
            setErrors({});
            setCreatedId(null);
            setLoginPassword("");
            setOpen(true);
          }}
        >
          + Add Employee
        </Button>
      </div>

      {flash && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <span>{flash}</span>
          <button className="text-emerald-700 hover:underline" onClick={() => setFlash("")}>Dismiss</button>
        </div>
      )}

      <div className="max-w-sm">
        <Input
          placeholder="Search by name, email, ID, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table headers={["Employee ID", "Name", "Department", "Designation", "Email", "DOJ", "CRM", "Status", "Actions"]}>
        {loading ? (
          <tr>
            <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
              Loading...
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
              No employees yet. Click Add Employee to create one.
            </td>
          </tr>
        ) : (
          rows.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.employeeId}</td>
              <td className="px-4 py-3 font-medium">{e.name}</td>
              <td className="px-4 py-3">{e.department || "-"}</td>
              <td className="px-4 py-3">{e.designation || "-"}</td>
              <td className="px-4 py-3">{e.email}</td>
              <td className="px-4 py-3">{e.doj ? formatDate(e.doj) : "-"}</td>
              <td className="px-4 py-3">
                <Badge tone={e.crmEnabled ? "green" : "gray"}>
                  {e.crmEnabled ? "Enabled" : "Off"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  <Link href={`/admin/employees/${e.id}`} className="text-sm font-semibold text-brand-red hover:underline">
                    Edit
                  </Link>
                  <Link href={`/admin/employees/${e.id}?view=1`} className="text-sm font-semibold text-gray-600 hover:underline">
                    View
                  </Link>
                  <button className="text-sm font-semibold text-gray-600 hover:underline" onClick={() => { setPwEmail(e.email); setPwValue(""); setPwMsg(""); }}>
                    Password
                  </button>
                  <button className="text-sm font-semibold text-red-600 hover:underline" onClick={() => { setDelEmp(e); setDelErr(""); }}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      <Modal open={open} onClose={() => { setOpen(false); setCreatedId(null); }} title={createdId ? "Employee Saved — Upload Documents" : "Add Employee"} wide>
        {createdId ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-emerald-600">Employee saved. Upload documents (Agreement, Offer Letter, Contract, etc.) — they also appear on the Documents page.</p>
            <DocumentManager
              title="Employee Documents"
              endpoint="/api/employee-documents"
              ownerKey="employeeId"
              ownerId={createdId}
              categories={["Agreement", "Offer Letter", "Contract", "Aadhaar", "PAN", "Other"]}
            />
            <div className="flex justify-end">
              <Button onClick={() => { setOpen(false); setCreatedId(null); }}>Done</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <EmployeeForm
              values={form}
              errors={errors}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            />
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Login Credentials</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="w-full space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">Login Email</label>
                  <input value={form.email} readOnly className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500" />
                  <p className="text-xs text-gray-400">Uses the email above.</p>
                </div>
                <PasswordInput label="Login Password" placeholder="At least 6 characters" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} minLength={6} />
              </div>
              <p className="text-xs text-gray-400">Set a password to create a candidate-portal login for this employee. Leave blank to skip.</p>
            </section>
            {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Employee"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!pwEmail} onClose={() => setPwEmail(null)} title="Set / Reset Login Password">
        <form className="space-y-3" onSubmit={resetPassword}>
          <Input label="Employee Email" value={pwEmail ?? ""} readOnly />
          <PasswordInput label="New Password" placeholder="At least 6 characters" value={pwValue} onChange={(e) => setPwValue(e.target.value)} required minLength={6} />
          {pwMsg && <p className={`text-sm ${pwMsg.includes("updated") ? "text-emerald-600" : "text-red-500"}`}>{pwMsg}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setPwEmail(null)}>Close</Button>
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!delEmp} onClose={() => setDelEmp(null)} title="Delete Employee">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{delEmp?.name}</strong> ({delEmp?.email})? This permanently removes the
            employee, their login account, attendance, payroll and documents. This cannot be undone.
          </p>
          {delErr && <p className="text-sm text-red-500">{delErr}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDelEmp(null)}>Cancel</Button>
            <Button type="button" variant="danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete Employee"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
