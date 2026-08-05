"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EMPLOYEE_STATUSES } from "@/types/employee";
import type { EmployeeInput } from "@/types/employee";
import {
  alnumSpace, examples, onlyDigits, onlyLetters, upperAlnum,
  vAadhaar, vAccount, vEmail, vIfsc, vPan, vPhone,
} from "@/lib/validators";

type Errors = Record<string, string>;

interface EmployeeFormProps {
  values: EmployeeInput;
  errors?: Errors;
  onChange: (patch: Partial<EmployeeInput>) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{children}</h3>;
}

export function EmployeeForm({ values, errors = {}, onChange }: EmployeeFormProps) {
  // Live validation errors (server errors from props take precedence).
  const live: Errors = {
    phone: vPhone(values.phone ?? ""),
    email: vEmail(values.email ?? ""),
    ifsc: vIfsc(values.ifsc ?? ""),
    panNumber: vPan(values.panNumber ?? ""),
    aadhaarNumber: vAadhaar(values.aadhaarNumber ?? ""),
    accountNumber: vAccount(values.accountNumber ?? ""),
  };
  const err = (k: string) => errors[k] || live[k] || undefined;

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <section className="space-y-3">
        <SectionTitle>Personal Details</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Employee Name" value={values.name} maxLength={100}
            onChange={(e) => onChange({ name: onlyLetters(e.target.value, 100) })}
            error={errors.name} hint={examples.name} required />
          <Input label="Employee ID" value={values.employeeId} maxLength={20}
            onChange={(e) => onChange({ employeeId: e.target.value.toUpperCase().slice(0, 20) })}
            error={errors.employeeId} hint="e.g. EMP005" required />
          <Input label="Department" value={values.department ?? ""} maxLength={60}
            onChange={(e) => onChange({ department: onlyLetters(e.target.value, 60) })}
            error={errors.department} hint="e.g. Recruitment" />
          <Input label="Designation" value={values.designation ?? ""} maxLength={60}
            onChange={(e) => onChange({ designation: alnumSpace(e.target.value, 60) })}
            error={errors.designation} hint="e.g. HR Recruiter" />
          <Input label="Phone" value={values.phone ?? ""} inputMode="numeric" maxLength={10}
            onChange={(e) => onChange({ phone: onlyDigits(e.target.value, 10) })}
            error={err("phone")} hint={examples.phone} />
          <Input label="Email" type="email" value={values.email} maxLength={120}
            onChange={(e) => onChange({ email: e.target.value.slice(0, 120) })}
            error={err("email")} hint={examples.email} required />
          <Input label="Qualification" value={values.qualification ?? ""} maxLength={100}
            onChange={(e) => onChange({ qualification: e.target.value.slice(0, 100) })}
            error={errors.qualification} hint="e.g. B.Com, B.E, MBA" />
          <Input label="Date of Joining" type="date" value={values.doj ?? ""}
            onChange={(e) => onChange({ doj: e.target.value })} error={errors.doj} />
          <Select label="Status" value={values.status ?? "Active"}
            onChange={(e) => onChange({ status: e.target.value })}
            options={EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s }))} />
        </div>
      </section>

      {/* Bank Details */}
      <section className="space-y-3">
        <SectionTitle>Bank Details</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Account Holder" value={values.accountHolder ?? ""} maxLength={100}
            onChange={(e) => onChange({ accountHolder: onlyLetters(e.target.value, 100) })}
            error={errors.accountHolder} hint={examples.name} />
          <Input label="Bank Name" value={values.bankName ?? ""} maxLength={100}
            onChange={(e) => onChange({ bankName: alnumSpace(e.target.value, 100) })}
            error={errors.bankName} hint={examples.bankName} />
          <Input label="Account Number" value={values.accountNumber ?? ""} inputMode="numeric" maxLength={18}
            onChange={(e) => onChange({ accountNumber: onlyDigits(e.target.value, 18) })}
            error={err("accountNumber")} hint={examples.account} />
          <Input label="IFSC" value={values.ifsc ?? ""} maxLength={11}
            onChange={(e) => onChange({ ifsc: upperAlnum(e.target.value, 11) })}
            error={err("ifsc")} hint={examples.ifsc} />
          <Input label="PAN Number" value={values.panNumber ?? ""} maxLength={10}
            onChange={(e) => onChange({ panNumber: upperAlnum(e.target.value, 10) })}
            error={err("panNumber")} hint={examples.pan} />
          <Input label="Aadhaar Number" value={values.aadhaarNumber ?? ""} inputMode="numeric" maxLength={12}
            onChange={(e) => onChange({ aadhaarNumber: onlyDigits(e.target.value, 12) })}
            error={err("aadhaarNumber")} hint={examples.aadhaar} />
        </div>
      </section>

      {/* Salary */}
      <section className="space-y-3">
        <SectionTitle>Salary</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Monthly Salary / CTC" inputMode="numeric" maxLength={8}
            value={values.monthlyCtc != null ? String(values.monthlyCtc) : ""}
            onChange={(e) => { const d = onlyDigits(e.target.value, 8); onChange({ monthlyCtc: d === "" ? null : Number(d) }); }}
            error={errors.monthlyCtc} hint={examples.monthlyCtc} />
          <Input label="Take Home Salary" inputMode="numeric" maxLength={8}
            value={values.takeHome != null ? String(values.takeHome) : ""}
            onChange={(e) => { const d = onlyDigits(e.target.value, 8); onChange({ takeHome: d === "" ? null : Number(d) }); }}
            error={errors.takeHome} hint={examples.takeHome} />
        </div>
      </section>

      {/* CRM Access */}
      <section className="space-y-3">
        <SectionTitle>CRM Access</SectionTitle>
        <label className="flex cursor-pointer items-center gap-3">
          <button type="button" role="switch" aria-checked={values.crmEnabled}
            onClick={() => onChange({ crmEnabled: !values.crmEnabled })}
            className={"relative inline-flex h-6 w-11 items-center rounded-full transition " + (values.crmEnabled ? "bg-brand-red" : "bg-gray-300")}>
            <span className={"inline-block h-4 w-4 transform rounded-full bg-white transition " + (values.crmEnabled ? "translate-x-6" : "translate-x-1")} />
          </button>
          <span className="text-sm font-medium text-gray-800">{values.crmEnabled ? "CRM access enabled" : "CRM access disabled"}</span>
        </label>
      </section>
    </div>
  );
}
