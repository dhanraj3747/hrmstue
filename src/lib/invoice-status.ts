// Invoice status logic for the reminder system.
//   RED    -> invoice date not yet reached (or not generated)
//   GREEN  -> invoice date reached / generated today (ready to raise)
//   PURPLE -> invoice has been raised

export type InvoiceStatus = "RED" | "GREEN" | "PURPLE";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  RED: "Not Generated",
  GREEN: "Invoice Generated",
  PURPLE: "Ready to Raise",
};

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** DOJ + clauseDays => invoice date (ISO yyyy-mm-dd). */
export function computeInvoiceDate(doj: Date | string | null, clauseDays: number): string | null {
  if (!doj) return null;
  const d = new Date(doj);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + (Number(clauseDays) || 0));
  return d.toISOString().slice(0, 10);
}

export function computeInvoiceStatus(
  invoiceDate: Date | string | null,
  raised: boolean,
  today: Date = new Date()
): InvoiceStatus {
  if (raised) return "PURPLE";
  if (!invoiceDate) return "RED";
  const inv = new Date(invoiceDate);
  if (Number.isNaN(inv.getTime())) return "RED";
  return dayStart(today) >= dayStart(inv) ? "GREEN" : "RED";
}

/** Bucket for dashboard widgets. */
export type InvoiceBucket = "today" | "upcoming" | "overdue" | "raised";

export function invoiceBucket(
  invoiceDate: Date | string | null,
  raised: boolean,
  today: Date = new Date()
): InvoiceBucket {
  if (raised) return "raised";
  if (!invoiceDate) return "upcoming";
  const inv = dayStart(new Date(invoiceDate));
  const t = dayStart(today);
  if (inv === t) return "today";
  return inv < t ? "overdue" : "upcoming";
}
