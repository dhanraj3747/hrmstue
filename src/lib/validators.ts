// Shared form validation: patterns, live input filters, messages and examples.
// Used across every form so validation is consistent app-wide.

export const patterns = {
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  aadhaar: /^\d{12}$/,
  phone: /^\d{10}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  account: /^\d{9,18}$/,
  url: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/,
};

// ----- live input filters (limit what can be typed) -----
export const onlyDigits = (v: string, max?: number) => {
  const d = v.replace(/\D/g, "");
  return max ? d.slice(0, max) : d;
};
export const onlyLetters = (v: string, max?: number) => {
  const l = v.replace(/[^A-Za-z\s]/g, "");
  return max ? l.slice(0, max) : l;
};
export const alnumSpace = (v: string, max?: number) => {
  const a = v.replace(/[^A-Za-z0-9\s]/g, "");
  return max ? a.slice(0, max) : a;
};
export const upperAlnum = (v: string, max?: number) => {
  const a = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return max ? a.slice(0, max) : a;
};
export const clamp = (v: string, max: number) => v.slice(0, max);

// ----- example helper texts -----
export const examples = {
  name: "e.g. Darshan Kumar",
  phone: "e.g. 9876543210",
  email: "e.g. employee@gmail.com",
  pan: "Example: ABCDE1234F",
  aadhaar: "Example: 1234 5678 9012",
  ifsc: "Example: SBIN0001234",
  account: "Example: 123456789012",
  bankName: "e.g. State Bank of India",
  monthlyCtc: "e.g. 45000",
  takeHome: "e.g. 38000",
  salaryRange: "e.g. 30000 - 45000",
  website: "e.g. https://company.com",
  clauseDays: "1 – 365 days",
};

// ----- validators returning an error string (or "") -----
export function vPhone(v: string) {
  if (!v) return "";
  return patterns.phone.test(v) ? "" : "Phone number must contain exactly 10 digits.";
}
export function vEmail(v: string) {
  if (!v) return "";
  return patterns.email.test(v) ? "" : "Email is invalid.";
}
export function vPan(v: string) {
  if (!v) return "";
  return patterns.pan.test(v) ? "" : "Invalid PAN Number (format ABCDE1234F).";
}
export function vAadhaar(v: string) {
  if (!v) return "";
  return patterns.aadhaar.test(v) ? "" : "Aadhaar must contain exactly 12 digits.";
}
export function vIfsc(v: string) {
  if (!v) return "";
  return patterns.ifsc.test(v) ? "" : "Invalid IFSC Code (format SBIN0001234).";
}
export function vAccount(v: string) {
  if (!v) return "";
  return patterns.account.test(v) ? "" : "Account number must be 9–18 digits.";
}
export function vUrl(v: string) {
  if (!v) return "";
  return patterns.url.test(v) ? "" : "Enter a valid website URL.";
}

// Full employee form check (used to block submit on the client).
export function employeeErrors(v: {
  name?: string; employeeId?: string; email?: string; phone?: string | null;
  panNumber?: string | null; aadhaarNumber?: string | null; ifsc?: string | null; accountNumber?: string | null;
}): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.name?.trim()) e.name = "Employee name is required.";
  if (!v.employeeId?.trim()) e.employeeId = "Employee ID is required.";
  if (!v.email?.trim()) e.email = "Email is required.";
  else if (!patterns.email.test(v.email)) e.email = "Email is invalid.";
  if (v.phone && !patterns.phone.test(v.phone)) e.phone = "Phone number must contain exactly 10 digits.";
  if (v.panNumber && !patterns.pan.test(v.panNumber)) e.panNumber = "Invalid PAN Number (format ABCDE1234F).";
  if (v.aadhaarNumber && !patterns.aadhaar.test(v.aadhaarNumber)) e.aadhaarNumber = "Aadhaar must contain exactly 12 digits.";
  if (v.ifsc && !patterns.ifsc.test(v.ifsc)) e.ifsc = "Invalid IFSC Code (format SBIN0001234).";
  if (v.accountNumber && !patterns.account.test(v.accountNumber)) e.accountNumber = "Account number must be 9–18 digits.";
  return e;
}
