"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { alnumSpace, examples, onlyDigits } from "@/lib/validators";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Filter = (v: string) => string;

// A labelled group of repeatable inputs with its own "+" add icon.
function MultiField({
  label, values, setValues, placeholder, hint, type = "text", inputMode, maxLength, filter, disabled,
}: {
  label: string;
  values: string[];
  setValues: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "email";
  maxLength?: number;
  filter?: Filter;
  disabled?: boolean;
}) {
  const update = (i: number, val: string) => setValues(values.map((v, idx) => (idx === i ? (filter ? filter(val) : val) : v)));
  const add = () => setValues([...values, ""]);
  const remove = (i: number) => setValues(values.length > 1 ? values.filter((_, idx) => idx !== i) : [""]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {!disabled && (
          <button type="button" onClick={add} title={`Add ${label}`}
            className="inline-flex items-center gap-1 rounded-md border border-brand-red/30 px-2 py-1 text-xs font-medium text-brand-red hover:bg-brand-pink/30">
            <Plus size={13} /> Add
          </button>
        )}
      </div>
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type={type}
            inputMode={inputMode}
            value={v}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => update(i, e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-red disabled:bg-gray-50"
          />
          {!disabled && values.length > 1 && (
            <button type="button" onClick={() => remove(i)} title="Remove" className="shrink-0 rounded-md p-2 text-red-500 hover:bg-red-50">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ))}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function NewVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ company: "", website: "", agreementDate: "", clauseDays: "45" });
  const [persons, setPersons] = useState<string[]>([""]);
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [locations, setLocations] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const clean = (arr: string[]) => arr.map((x) => x.trim()).filter(Boolean);
      const contacts = {
        persons: clean(persons),
        phones: clean(phones),
        emails: clean(emails),
        locations: clean(locations),
      };
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          clauseDays: Number(form.clauseDays),
          contacts,
          // primary values (first of each) for the list view / back-compat
          contactPerson: contacts.persons[0] ?? "",
          contactEmail: contacts.emails[0] ?? "",
          phone: contacts.phones[0] ?? "",
          location: contacts.locations[0] ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.errors?.company ?? data.error ?? "Failed to save vendor."); return; }
      setCreatedId(data.vendor.id);
    } finally {
      setSaving(false);
    }
  }

  const disabled = !!createdId;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/vendors" className="text-sm text-brand-red hover:underline">Back to vendors</Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Add New Vendor</h2>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Vendor Company" value={form.company} maxLength={100} onChange={(e) => setForm({ ...form, company: alnumSpace(e.target.value, 100) })} hint="e.g. Infosys BPM" required disabled={disabled} />
            <Input label="Website" value={form.website} maxLength={150} onChange={(e) => setForm({ ...form, website: e.target.value.slice(0, 150) })} hint={examples.website} disabled={disabled} />
            <Input label="Agreement Date" type="date" value={form.agreementDate} onChange={(e) => setForm({ ...form, agreementDate: e.target.value })} disabled={disabled} />
            <Input label="Clause Days" inputMode="numeric" maxLength={3} value={form.clauseDays} onChange={(e) => setForm({ ...form, clauseDays: onlyDigits(e.target.value, 3) })} hint={examples.clauseDays} disabled={disabled} />
          </div>

          {/* Each field has its own + icon to add multiple values for a single vendor */}
          <div className="grid gap-5 sm:grid-cols-2">
            <MultiField label="Contact Person" values={persons} setValues={setPersons} placeholder="e.g. Darshan Kumar" hint={examples.name} maxLength={100} filter={(v) => v.slice(0, 100)} disabled={disabled} />
            <MultiField label="Phone" values={phones} setValues={setPhones} placeholder="e.g. 9876543210" inputMode="numeric" maxLength={10} filter={(v) => onlyDigits(v, 10)} hint={examples.phone} disabled={disabled} />
            <MultiField label="Email" values={emails} setValues={setEmails} placeholder="e.g. contact@vendor.com" type="email" inputMode="email" maxLength={120} filter={(v) => v.slice(0, 120)} hint={examples.email} disabled={disabled} />
            <MultiField label="Location" values={locations} setValues={setLocations} placeholder="e.g. Bangalore" maxLength={100} filter={(v) => alnumSpace(v, 100)} disabled={disabled} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {!disabled ? (
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save Vendor"}</Button>
          ) : (
            <p className="text-sm font-medium text-emerald-600">Vendor saved. You can now upload documents below.</p>
          )}
        </form>
      </Card>

      {createdId && (
        <>
          <DocumentManager title="Upload Vendor Documents (Agreement, Contract, etc.)" endpoint="/api/vendor-documents" ownerKey="vendorId" ownerId={createdId} categories={["Agreement", "Contract", "Other"]} />
          <div className="flex justify-end">
            <Button onClick={() => router.push("/admin/vendors")}>Done</Button>
          </div>
        </>
      )}
    </div>
  );
}
