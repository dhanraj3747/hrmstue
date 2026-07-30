export type PayrollStatus = "Draft" | "Generated" | "Approved" | "Rejected";
export const PAYROLL_STATUSES: PayrollStatus[] = ["Draft", "Generated", "Approved", "Rejected"];

export interface Payroll {
  id: number;
  employeeId: number;
  month: string;
  periodStart: string;
  periodEnd: string;
  cycleDays: number;
  workedHours: number;
  basic: number;
  allowances: number;
  deductions: number;
  gross: number;
  net: number;
  bonus: number;
  status: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    employeeId: string;
    name: string;
    email: string;
    department: string | null;
    designation: string | null;
    doj: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    panNumber: string | null;
    aadhaarNumber: string | null;
  };
  payslip?: Payslip | null;
}

export interface PayslipLine {
  label: string;
  amount: number;
}

export interface Payslip {
  id: number;
  payrollId: number;
  employeeName: string;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  subDepartment: string | null;
  doj: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  month: string;
  workedHours: number;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  invoiceDate: string | null;
  clauseDays: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  loginAt: string | null;
  logoutAt: string | null;
  breakMinutes: number;
  workedMinutes: number;
  status: string;
}
