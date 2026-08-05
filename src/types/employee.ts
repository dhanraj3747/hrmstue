export type EmployeeStatus =
  | "Active"
  | "Inactive"
  | "On Leave"
  | "Notice Period";

export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  "Active",
  "Inactive",
  "On Leave",
  "Notice Period",
];

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  department: string | null;
  designation: string | null;
  phone: string | null;
  email: string;
  qualification: string | null;
  doj: string | null; // ISO date string
  status: string;

  accountHolder: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  branch: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;

  crmEnabled: boolean;
  monthlyCtc: number | null;
  takeHome: number | null;

  createdAt: string;
  updatedAt: string;
}

/** Shape accepted by create/update endpoints. */
export interface EmployeeInput {
  employeeId: string;
  name: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  email: string;
  qualification?: string | null;
  doj?: string | null;
  status?: string;

  accountHolder?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  branch?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;

  crmEnabled?: boolean;
  monthlyCtc?: number | null;
  takeHome?: number | null;
}
