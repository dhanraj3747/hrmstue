import type { EmployeeInput } from "@/types/employee";

/** Empty values for the Add/Edit employee form. */
export const emptyEmployeeForm: EmployeeInput = {
  employeeId: "",
  name: "",
  department: "",
  designation: "",
  phone: "",
  email: "",
  qualification: "",
  doj: "",
  status: "Active",
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  panNumber: "",
  aadhaarNumber: "",
  crmEnabled: false,
  monthlyCtc: null,
  takeHome: null,
};

/** Convert an API employee record into editable form values. */
export function toFormValues(e: {
  employeeId: string;
  name: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  email: string;
  qualification: string | null;
  doj: string | null;
  status: string;
  accountHolder: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  crmEnabled: boolean;
  monthlyCtc?: number | null;
  takeHome?: number | null;
}): EmployeeInput {
  return {
    employeeId: e.employeeId,
    name: e.name,
    department: e.department ?? "",
    designation: e.designation ?? "",
    phone: e.phone ?? "",
    email: e.email,
    qualification: e.qualification ?? "",
    doj: e.doj ? e.doj.slice(0, 10) : "",
    status: e.status,
    accountHolder: e.accountHolder ?? "",
    bankName: e.bankName ?? "",
    accountNumber: e.accountNumber ?? "",
    ifsc: e.ifsc ?? "",
    branch: e.branch ?? "",
    panNumber: e.panNumber ?? "",
    aadhaarNumber: e.aadhaarNumber ?? "",
    crmEnabled: e.crmEnabled,
    monthlyCtc: e.monthlyCtc ?? null,
    takeHome: e.takeHome ?? null,
  };
}
