"use client";

import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { emptyEmployeeForm, toFormValues } from "@/lib/employee-form";
import { employeeErrors } from "@/lib/validators";
import { formatDate } from "@/lib/utils";
import type { Employee, EmployeeInput } from "@/types/employee";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value || "-"}</p>
    </div>
  );
}

function EmployeeDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params.id);
  const viewMode = searchParams.get("view") === "1";

  const [emp, setEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeInput>(emptyEmployeeForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setEmp(data.employee);
        setForm(toFormValues(data.employee));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = employeeErrors(form);
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
    setSaving(true);
    setSaved(false);
    setErrors({});
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors(data.errors ?? { form: data.error ?? "Failed to save." });
        return;
      }
      const data = await res.json();
      setEmp(data.employee);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-gray-400">Loading...</p>
      </Card>
    );
  }

  if (notFound || !emp) {
    return (
      <Card>
        <p>Employee not found.</p>
        <Link href="/admin/employees" className="mt-3 inline-block text-brand-red">
          Back to employees
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/employees" className="text-sm text-brand-red hover:underline">
            Back to employees
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {viewMode ? "Employee Details" : "Edit Employee"}
          </h2>
        </div>
        {viewMode && (
          <Link href={`/admin/employees/${id}`}>
            <Button variant="secondary">Edit</Button>
          </Link>
        )}
      </div>

      {viewMode ? (
        <div className="space-y-4">
          <Card className="space-y-4">
            <CardTitle>Personal Details</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee Name" value={emp.name} />
              <Field label="Employee ID" value={emp.employeeId} />
              <Field label="Department" value={emp.department} />
              <Field label="Designation" value={emp.designation} />
              <Field label="Phone" value={emp.phone} />
              <Field label="Email" value={emp.email} />
              <Field label="Date of Joining" value={emp.doj ? formatDate(emp.doj) : "-"} />
              <Field label="Status" value={<Badge tone="green">{emp.status}</Badge>} />
            </div>
          </Card>
          <Card className="space-y-4">
            <CardTitle>Bank Details</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Account Holder" value={emp.accountHolder} />
              <Field label="Bank Name" value={emp.bankName} />
              <Field label="Account Number" value={emp.accountNumber} />
              <Field label="IFSC" value={emp.ifsc} />
              <Field label="PAN Number" value={emp.panNumber} />
              <Field label="Aadhaar Number" value={emp.aadhaarNumber} />
            </div>
          </Card>
          <Card className="space-y-4">
            <CardTitle>Salary</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Monthly Salary / CTC" value={emp.monthlyCtc != null ? `₹${emp.monthlyCtc.toLocaleString("en-IN")}` : "-"} />
              <Field label="Take Home Salary" value={emp.takeHome != null ? `₹${emp.takeHome.toLocaleString("en-IN")}` : "-"} />
            </div>
          </Card>
          <Card>
            <CardTitle>CRM Access</CardTitle>
            <div className="mt-3">
              <Badge tone={emp.crmEnabled ? "green" : "gray"}>
                {emp.crmEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <EmployeeForm
              values={form}
              errors={errors}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            />
            {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saved && <p className="text-sm text-emerald-600">Changes saved.</p>}
            </div>
          </form>
        </Card>
      )}

      <DocumentManager
        title="Employee Documents"
        endpoint="/api/employee-documents"
        ownerKey="employeeId"
        ownerId={emp.id}
        categories={["Agreement", "Offer Letter", "Contract", "Aadhaar", "PAN", "Other"]}
      />
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<Card><p className="text-gray-400">Loading...</p></Card>}>
      <EmployeeDetail />
    </Suspense>
  );
}
