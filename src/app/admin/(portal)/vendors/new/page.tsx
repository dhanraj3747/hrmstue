"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function NewVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company: "",
    contactPerson: "",
    contactEmail: "",
    phone: "",
    website: "",
    location: "",
    agreementDate: "",
    clauseDays: "45",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clauseDays: Number(form.clauseDays) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.errors?.company ?? d.error ?? "Failed to save vendor.");
        return;
      }
      router.push("/admin/vendors");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/vendors" className="text-sm text-brand-red hover:underline">
          Back to vendors
        </Link>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Add New Vendor</h2>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input label="Vendor Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <Input label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Agreement Date" type="date" value={form.agreementDate} onChange={(e) => setForm({ ...form, agreementDate: e.target.value })} />
          <Input label="Clause Days" type="number" value={form.clauseDays} onChange={(e) => setForm({ ...form, clauseDays: e.target.value })} placeholder="45" />
          {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save Vendor"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
