import type { EmployeeInput } from "@/types/employee";

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const AADHAAR_RE = /^\d{12}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  data?: EmployeeInput;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function optStr(v: unknown): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

/**
 * Validate and normalize an employee payload.
 * `partial` allows missing required fields (used for PUT/updates).
 */
export function validateEmployee(
  body: Record<string, unknown>,
  partial = false
): ValidationResult {
  const errors: Record<string, string> = {};

  const name = str(body.name);
  const employeeId = str(body.employeeId);
  const email = str(body.email);

  if (!partial || body.name !== undefined) {
    if (!name) errors.name = "Employee name is required.";
  }
  if (!partial || body.employeeId !== undefined) {
    if (!employeeId) errors.employeeId = "Employee ID is required.";
  }
  if (!partial || body.email !== undefined) {
    if (!email) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  }

  const phone = optStr(body.phone);
  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = "Phone must be 10 digits.";
  }

  const pan = optStr(body.panNumber);
  if (pan && !PAN_RE.test(pan.toUpperCase())) {
    errors.panNumber = "PAN must be like ABCDE1234F.";
  }

  const ifsc = optStr(body.ifsc);
  if (ifsc && !IFSC_RE.test(ifsc.toUpperCase())) {
    errors.ifsc = "IFSC must be like SBIN0001234.";
  }

  const aadhaar = optStr(body.aadhaarNumber);
  if (aadhaar && !AADHAAR_RE.test(aadhaar.replace(/\s/g, ""))) {
    errors.aadhaarNumber = "Aadhaar must be 12 digits.";
  }

  const accountNumber = optStr(body.accountNumber);
  if (accountNumber && !/^\d{6,18}$/.test(accountNumber)) {
    errors.accountNumber = "Account number must be 6-18 digits.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const data: EmployeeInput = {
    employeeId,
    name,
    email,
    department: optStr(body.department),
    designation: optStr(body.designation),
    phone,
    qualification: optStr(body.qualification),
    doj: optStr(body.doj),
    status: optStr(body.status) ?? "Active",
    accountHolder: optStr(body.accountHolder),
    bankName: optStr(body.bankName),
    accountNumber,
    ifsc: ifsc ? ifsc.toUpperCase() : null,
    branch: optStr(body.branch),
    panNumber: pan ? pan.toUpperCase() : null,
    aadhaarNumber: aadhaar ? aadhaar.replace(/\s/g, "") : null,
    crmEnabled: Boolean(body.crmEnabled),
    monthlyCtc: body.monthlyCtc === undefined || body.monthlyCtc === null || body.monthlyCtc === "" ? null : Number(body.monthlyCtc),
    takeHome: body.takeHome === undefined || body.takeHome === null || body.takeHome === "" ? null : Number(body.takeHome),
  };

  return { ok: true, errors: {}, data };
}
