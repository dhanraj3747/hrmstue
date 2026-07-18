"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import Link from "next/link";
import { useEffect, useState } from "react";

interface VendorDoc { id: number }
interface VendorRow {
  id: number;
  company: string;
  contactPerson: string | null;
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  agreementDate: string | null;
  clauseDays: number;
  documents: VendorDoc[];
}

export default function VendorsPage() {
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<VendorRow | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) setRows((await res.json()).vendors ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-sm text-gray-500">Company, contact, website, location, clause days & documents.</p>
        </div>
        <Link href="/admin/vendors/new"><Button>+ Add Vendor</Button></Link>
      </div>

      <Table headers={["Company", "Contact Person", "Website", "Location", "Clause Days", "Docs", "Actions"]}>
        {loading ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vendors yet. Click Add Vendor.</td></tr>
        ) : (
          rows.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-medium">{v.company}</td>
              <td className="px-4 py-3">{v.contactPerson || "-"}</td>
              <td className="px-4 py-3">
                {v.website ? <a href={v.website} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Visit</a> : "-"}
              </td>
              <td className="px-4 py-3">{v.location || "-"}</td>
              <td className="px-4 py-3"><Badge tone="blue">{v.clauseDays} days</Badge></td>
              <td className="px-4 py-3"><Badge tone="orange">{v.documents.length}</Badge></td>
              <td className="px-4 py-3">
                <button className="text-sm font-semibold text-brand-red hover:underline" onClick={() => setDetail(v)}>View / Docs</button>
              </td>
            </tr>
          ))
        )}
      </Table>

      <Modal open={!!detail} onClose={() => { setDetail(null); load(); }} title={detail?.company || "Vendor"} wide>
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-semibold">Contact Person:</span> {detail.contactPerson || "-"}</p>
              <p><span className="font-semibold">Contact Email:</span> {detail.contactEmail || "-"}</p>
              <p><span className="font-semibold">Phone:</span> {detail.phone || "-"}</p>
              <p><span className="font-semibold">Website:</span> {detail.website || "-"}</p>
              <p><span className="font-semibold">Location:</span> {detail.location || "-"}</p>
              <p><span className="font-semibold">Agreement Date:</span> {detail.agreementDate ? new Date(detail.agreementDate).toLocaleDateString("en-GB") : "-"}</p>
              <p><span className="font-semibold">Clause Days:</span> {detail.clauseDays}</p>
            </div>
            <DocumentManager
              title="Vendor Documents (Agreement, etc.)"
              endpoint="/api/vendor-documents"
              ownerKey="vendorId"
              ownerId={detail.id}
              categories={["Agreement", "Contract", "Other"]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
