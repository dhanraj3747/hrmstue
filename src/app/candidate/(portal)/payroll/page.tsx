"use client";

import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { useUserLabel } from "@/hooks/useAuth";
import type { Payslip } from "@/types/payroll";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";


export default function CandidatePayrollPage() {
  const { name, email } = useUserLabel();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const empRes = await fetch(`/api/employees?q=${encodeURIComponent(email)}`);
        if (!empRes.ok) return;
        const empData = await empRes.json().catch(() => ({ employees: [] }));
        const match = (empData.employees ?? []).find(
          (e: { email: string; id: number }) => e.email.toLowerCase() === email.toLowerCase()
        );
        if (match) {
          const res = await fetch(`/api/payslip?employeeId=${match.id}&approved=1`);
          if (res.ok) setPayslips((await res.json()).payslips ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payslips</h2>
        <p className="text-sm text-gray-500">
          Download your approved payslips, <strong>{name}</strong>.
        </p>
      </div>

      <Table headers={["Month", "Status", "Payslip"]}>
        {loading ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
        ) : payslips.length === 0 ? (
          <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No payslips available yet. They appear here once your admin approves payroll.</td></tr>
        ) : (
          payslips.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-medium">{p.month}</td>
              <td className="px-4 py-3"><Badge tone="green">{p.status}</Badge></td>
              <td className="px-4 py-3">
                <a
                  href={`/payslip-print/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-red hover:underline"
                >
                  <Download size={14} /> Download PDF
                </a>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
}
