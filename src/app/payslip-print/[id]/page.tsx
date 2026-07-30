"use client";

import type { Payslip, PayslipLine } from "@/types/payroll";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const num = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

function numberToWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number): string => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? a[x % 10] : ""));
  const three = (x: number): string => (x >= 100 ? a[Math.floor(x / 100)] + "Hundred" + (x % 100 ? two(x % 100) : "") : two(x));
  let out = "";
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lk = Math.floor(n / 100000); n %= 100000;
  const th = Math.floor(n / 1000); n %= 1000;
  if (cr) out += three(cr) + "Crore";
  if (lk) out += three(lk) + "Lakh";
  if (th) out += three(th) + "Thousand";
  if (n) out += three(n);
  return out;
}

const LABEL = { fontSize: 10.5, color: "#9a9a9a", marginBottom: 3 } as const;
const VALUE = { fontSize: 13, color: "#111" } as const;
const RULE = { borderTop: "1px solid #e6e6e6" } as const;

function GridRow({ cells }: { cells: [string, React.ReactNode][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, padding: "12px 0", ...RULE }}>
      {cells.map(([label, value], i) => (
        <div key={i}>
          <div style={LABEL}>{label}</div>
          <div style={VALUE}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function PayslipPrintPage() {
  const params = useParams();
  const id = String(params.id);
  const [ps, setPs] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/payslip/${id}`);
      if (res.ok) setPs((await res.json()).payslip);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (ps) { const t = setTimeout(() => window.print(), 500); return () => clearTimeout(t); }
  }, [ps]);

  if (loading) return <div style={{ padding: 40, fontFamily: "Arial" }}>Loading...</div>;
  if (!ps) return <div style={{ padding: 40, fontFamily: "Arial" }}>Payslip not found.</div>;

  const earnings: PayslipLine[] = Array.isArray(ps.earnings) ? ps.earnings : [];
  const deductions: PayslipLine[] = Array.isArray(ps.deductions) ? ps.deductions : [];
  const days = ps.workedHours > 0 ? Math.round(ps.workedHours / 8) : 0;
  const monthLabel = (() => {
    const [y, m] = ps.month.split("-").map(Number);
    if (!y || !m) return ps.month;
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  })();

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "34px 44px", fontFamily: "Arial, sans-serif", color: "#111" }}>
      <style>{`@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="no-print" style={{ marginBottom: 14, textAlign: "right" }}>
        <button onClick={() => window.print()} style={{ background: "#111", color: "#fff", border: 0, padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
          Download / Print PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 0.3 }}>
            PAYSLIP <span style={{ fontWeight: 400, color: "#7a7a7a" }}>{monthLabel}</span>
          </p>
          <p style={{ margin: "16px 0 6px", fontSize: 14, fontWeight: 700 }}>REDFOXA CAREERLINK PVT LTD</p>
          <p style={{ margin: 0, fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            #282/290, Ward No. 35, 1st Floor,<br />Devarayapatna Main Road,<br />Tumkur, Karnataka - 572104
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpeg" alt="RedFoxa Careerlink" style={{ height: 118, width: "auto", objectFit: "contain" }} />
      </div>

      {/* Employee name */}
      <p style={{ margin: "20px 0 0", fontSize: 14, fontWeight: 700 }}>{ps.employeeName}</p>

      {/* Employee details grid */}
      <div style={{ marginTop: 10 }}>
        <GridRow cells={[["Employee Number", ps.employeeCode], ["Date Joined", fmt(ps.doj)], ["Department", ps.department || "N/A"], ["Sub Department", ps.subDepartment || "N/A"]]} />
        <GridRow cells={[["Designation", ps.designation || "N/A"], ["Payment Mode", "Bank Transfer"], ["Bank Name", ps.bankName || "N/A"], ["IFSC Code", ps.ifsc || "N/A"]]} />
        <GridRow cells={[["Account Number", ps.accountNumber || "N/A"], ["UAN", "N/A"], ["PF Number", "N/A"], ["PAN Number", ps.panNumber || "N/A"]]} />
      </div>

      {/* Salary details */}
      <p style={{ margin: "24px 0 0", fontSize: 13, letterSpacing: 0.4 }}>SALARY DETAILS</p>
      <div style={{ ...RULE, margin: "10px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, paddingBottom: 12 }}>
        <div><div style={LABEL}>Actual Payable Days</div><div style={VALUE}>{days.toFixed(1)}</div></div>
        <div><div style={LABEL}>Total Working Days</div><div style={VALUE}>{days.toFixed(1)}</div></div>
        <div><div style={LABEL}>Loss Of Pay Days</div><div style={VALUE}>0.00</div></div>
        <div><div style={LABEL}>Days Payable</div><div style={VALUE}>{days}</div></div>
      </div>
      <div style={RULE} />

      {/* Earnings / Deductions */}
      <div style={{ display: "flex", gap: 44, marginTop: 22 }}>
        <table style={{ flex: 1, borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            <tr><td colSpan={2} style={{ paddingBottom: 8, fontWeight: 700 }}>EARNINGS</td></tr>
            {earnings.map((l, i) => (
              <tr key={i}><td style={{ padding: "5px 0" }}>{l.label}</td><td style={{ padding: "5px 0", textAlign: "right" }}>{num(l.amount)}</td></tr>
            ))}
            <tr><td style={{ padding: "7px 0", fontWeight: 700 }}>Total Earnings (A)</td><td style={{ padding: "7px 0", textAlign: "right", fontWeight: 700 }}>{num(ps.grossPay)}</td></tr>
          </tbody>
        </table>
        <table style={{ flex: 1, borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            <tr><td colSpan={2} style={{ paddingBottom: 8, fontWeight: 700 }}>TAXES &amp; DEDUCTIONS</td></tr>
            {deductions.map((l, i) => (
              <tr key={i}><td style={{ padding: "5px 0" }}>{l.label}</td><td style={{ padding: "5px 0", textAlign: "right" }}>{num(l.amount)}</td></tr>
            ))}
            <tr><td style={{ padding: "7px 0", fontWeight: 700 }}>Total Taxes &amp; Deductions (B)</td><td style={{ padding: "7px 0", textAlign: "right", fontWeight: 700 }}>{num(ps.totalDeductions)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Net box (light grey) */}
      <div style={{ background: "#f5f5f6", padding: "16px 20px", marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 12 }}>
          <span>Net Salary Payable ( A - B )</span>
          <span>{num(ps.netPay)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#8a8a8a" }}>Net Salary in words</span>
          <span style={{ fontWeight: 700 }}>{numberToWords(ps.netPay)} Rupees only</span>
        </div>
      </div>

      <p style={{ marginTop: 18, fontSize: 11.5 }}>
        <strong>**Note :</strong> <em style={{ color: "#555" }}>All amounts displayed in this payslip are in <strong>INR</strong></em>
      </p>
      <p style={{ marginTop: 22, fontSize: 10.5, fontStyle: "italic", color: "#999" }}>
        *This is a computer generated statement, does not require signature.
      </p>
    </div>
  );
}
