# Module 1 — Employee Management (real MySQL backend)

This module replaces the mock/localStorage employee data with a real Prisma + MySQL
backend, real API routes, and an updated Add / Edit / View employee UI.

## What changed

- **prisma/schema.prisma** — new `Employee` model (personal details, bank details, CRM toggle).
- **src/lib/prisma.ts** — real Prisma client singleton (was a placeholder).
- **src/app/api/employees/route.ts** — `GET` (list + search) and `POST` (create).
- **src/app/api/employees/[id]/route.ts** — `GET`, `PUT`, `DELETE`.
- **src/lib/validation/employee.ts** — server-side validation (PAN, IFSC, Aadhaar, phone, email).
- **src/types/employee.ts** — shared Employee types.
- **src/components/employees/EmployeeForm.tsx** — shared form (Personal + Bank + CRM toggle).
- **src/app/admin/(portal)/employees/page.tsx** — table + Add modal wired to the API.
- **src/app/admin/(portal)/employees/[id]/page.tsx** — Edit + View wired to the API.
- **prisma/seed.ts** — seeds the 4 original employees (with bank details) into MySQL.

## One-time setup on your machine

1. Make sure MySQL is running and create the database:
   ```sql
   CREATE DATABASE hrms_db;
   ```
2. Set your connection string in `.env`:
   ```
   DATABASE_URL="mysql://<user>:<password>@localhost:3306/hrms_db"
   ```
3. Install deps, create the table, generate the client, and seed:
   ```bash
   npm install
   npx prisma migrate dev --name init_employee
   npx prisma generate
   npx prisma db seed
   ```
4. Run it:
   ```bash
   npm run dev      # or: npm run build
   ```

Open **Admin → Employees** to add, edit, and view employees with full personal and
bank details plus the CRM access toggle.

---

# Module 2 — Work Hours, Payroll, Payslip

New models: **Attendance**, **Payroll**, **Payslip** (see prisma/schema.prisma).
Employee gained `monthlyCtc` / `hourlyRate` for auto salary.

Re-run migrations after pulling this module:

```bash
npx prisma migrate dev --name module2_payroll
npx prisma generate
npx prisma db seed
```

What was added:
- **Attendance** (`/candidate/attendance`) now saves login/logout/break + worked minutes to the DB (no localStorage). API: `/api/attendance`.
- **Payroll** (`/admin/payroll`): Generate (auto worked-hours from attendance + auto salary), Edit, Approve, Reject, history + status. API: `/api/payroll`, `/api/payroll/[id]`.
- **Payslip** (`/admin/payslip/[id]`): editable, auto-filled from the employee (bank, PAN, Aadhaar, DOJ). Approve. PDF via `/payslip-print/[id]` (browser Print → Save as PDF). API: `/api/payslip`, `/api/payslip/[id]`.
- **Auto calculations** in `src/lib/payroll-calc.ts`: worked hours, salary, and 45/60/90-day cycles / invoice date from DOJ.
- **CRM**: "Clause Date" → "Clause Days"; exact "Added On" timestamp column; selected-candidates "Selected Date" → "Invoice Date".

Chain: **Employee → Payroll → Payslip** — bank/PAN/Aadhaar/DOJ auto-flow from Employee into the Payslip.

---

# Module 3 — Invoice Reminder System

New models: **Invoice**, **Reminder**. Run:

```bash
npx prisma migrate dev --name module3_invoices
npx prisma generate
```

- Invoice status logic in `src/lib/invoice-status.ts`: DOJ + Clause Days = Invoice Date; RED (not reached) / GREEN (reached today) / PURPLE (raised).
- APIs: `/api/invoices` (list + Today/Upcoming/Overdue/Raised summary), `/api/invoices/[id]` (raise / edit).
- **Selected Candidates**: new Invoice Status column with RED/GREEN/PURPLE badge, Generate (DOJ+clause) / Today buttons, and an editable dropdown to raise (Green → Purple).
- **Admin Dashboard**: Invoice Reminders widget (Due Today / Overdue / Upcoming / Raised + list of invoices to raise).

---

# Modules 4–12 — CRM, Employee salary/docs, Payroll bonus, Vendors, Dashboards

New models: **EmployeeDocument, Vendor, VendorDocument, Candidate**; **Payroll.bonus**, **Employee.takeHome**. Run:

```bash
npx prisma migrate dev --name module4_12
npx prisma generate
```

New APIs: `/api/vendors`(+[id]), `/api/vendor-documents`(+[id]), `/api/employee-documents`(+[id]), `/api/candidates`(+[id]), `/api/reminders`. Payslip API now supports `?employeeId=&approved=1` for candidate downloads.

Highlights:
- **CRM (candidate)**: new column order (Serial, Name, Phone, IT/Non-IT, Email, Qualification, Languages, Location, Remarks, Status, Process, Shortlisted, Interview, DOJ, Added On), inline editable dropdowns + Edit modal, summary cards (Calls Today / Shortlisted Today / Interviewed Today / Scheduled Interviews / Joined This Month), export removed.
- **Employee form**: Salary (Monthly CTC) + Take Home added, Branch removed; Employee Documents upload (Agreement/Offer Letter/Contract/Other, multiple) on the edit page.
- **Payroll**: Bonus field with auto Net; candidate portal shows approved payslips as downloadable PDFs.
- **Vendors**: Company/Contact/Website/Location/Clause Days + document/agreement upload; Clause Date removed.
- **Candidate dashboard**: CRM summary cards (Calls Today, Scheduled Interviews, Selected, Joined). Candidate payroll: Net Pay/Records/Bank removed. Candidate job openings: Clause Date removed.
- **Admin dashboard**: CRM Activity cards, Invoice Reminders, HR Performance (click an HR to expand metrics), Employee Count & Live status.

---

# Update — Auth DB, Vendor contacts, Invoice status editor, bug fixes

New model **User** (email, passwordHash, role, crmAccess). Vendor gained contactEmail/phone/agreementDate. Invoice gained statusOverride. Run:

```bash
npx prisma migrate dev --name auth_and_vendor_contacts
npx prisma generate
npx prisma db seed   # creates login accounts + demo data
```

Default logins (created by seed, stored hashed in the DB):
- Admin: `admin@redfoxa.com` / `admin123`
- Candidate: `gayatri@redfoxa.com` / `candidate123`

Changes:
- **Login/Signup (admin + candidate)**: real DB auth. Signup writes to the `user` table then redirects to login; login verifies credentials and shows "Invalid email or password" on mismatch. Password field has a show/hide eye toggle.
- **Add Vendor**: Company, Contact Person, Contact Email, Phone, Website, Location, Agreement Date, Clause Days.
- **Selected Candidates**: labels — RED "Not Generated", GREEN "Invoice Generated", PURPLE "Ready to Raise"; editable dropdown to set Red/Green/Purple per candidate (stored as `statusOverride`).
- **Fix**: candidate Payroll "Unexpected end of JSON input" — response is now guarded (`res.ok` + safe JSON parse).

---

# Update — Messaging, payslip format, labels

New model **Message** (chat between admin and candidates). After pulling, run:

```bash
npx prisma migrate dev --name messaging
```

(That adds the `message` table and regenerates the Prisma client. Login accounts are unaffected.)

Changes:
- **Messages**: Admin portal now has a Messages page (sidebar) to see candidates they're chatting with and reply. Candidate Messages shows admin + HR recruiters as contacts. APIs: `/api/messages`, `/api/users`.
- **Payslip PDF**: `/payslip-print/[id]` now matches the company payslip format (header, employee grid, Salary Details days, Earnings [Basic 80% / HRA 10% / Special Allowance] vs Taxes & Deductions, Net Salary Payable A-B, amount in words). Calculations are automatic from the payroll. Approved payslips remain downloadable from the candidate portal.
- **Selected Candidates**: "Student" → "Candidate" everywhere.
- **CRM**: removed the "Interviewed Today" card.
- **Admin Job Openings**: "Clause Date" → "Clause Days".
- Password fields on all login/signup pages have the show/hide eye toggle.

---

# Update — Job Openings (DB) + notifications + quick fixes

New model **JobOpening**; **Payslip.subDepartment** column added. Run:

```bash
npx prisma migrate dev --name job_openings
```

- **Job Openings now DB-backed**: admin create/**edit**/delete at `/admin/job-openings` → instantly appears in the candidate portal `/candidate/job-openings`. APIs: `/api/job-openings`(+[id]).
- **Notifications**: header bell now shows a live count — unread messages ("N new messages from <name>") for admin & candidate, plus "N new job openings" for candidates — with a dropdown, WhatsApp-style.
- **Payslip**: added **Sub Department** to the PDF (auto-filled from the employee).
- **CRM**: "Languages Known" is now a multi-select chip picker (choose many).
- **Add Vendor page** (`/admin/vendors/new`): upload documents after saving the vendor.
- **Site identity**: app icon/logo set to the Redfoxa logo.

Still pending (from your list, for next round): fully dynamic candidate dashboard (Today/Week/Month + weekly chart from attendance), dynamic Leaves system, and payslip re-check against your latest sample.

---

# Update — Dynamic dashboard + Leaves system

New model **Leave**. Run:

```bash
npx prisma migrate dev --name leaves
npx prisma db seed
```

- **Leaves (DB)**: candidate `/candidate/leaves` requests a leave -> appears instantly with status; admin `/admin/leaves` approves/rejects. APIs: `/api/leaves`(+[id]).
- **Candidate dashboard is now dynamic**: Today Work / Today Break / This Week / This Month and the Weekly Work & Breaks chart are computed from real attendance for the logged-in candidate; the Leave Summary (Pending/Approved/Rejected) reflects real leave records.
