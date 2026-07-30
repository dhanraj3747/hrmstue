export const LOCATIONS = [
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Pune",
  "Work From Home",
  "Other",
];

export const LANGUAGES = [
  "English",
  "Kannada",
  "Hindi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Urdu",
  "Other",
];

export const CRM_STATUSES = [
  "New Lead",
  "Called",
  "RNR",
  "Interested",
  "Not Interested",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
  "Joined",
  "On Hold",
] as const;

export type CRMCandidate = {
  id: string;
  name: string;
  phone: string;
  email: string;
  languages: string[];
  location: string;
  process: string;
  shortlisted: "Yes" | "No" | "Pending";
  status: string;
  interviewDate: string;
  doj: string;
  remarks: string;
  itType?: string;
  qualification?: string;
  joiningStatus?: string;
  calls: number;
  ctc: string;
  takeHome: string;
  invoiceDate: string;
  clauseDate: string;
  addedAt: number; // timestamp for timer
};

const firstNames = [
  "Lagum", "Sangya", "Arun", "Meena", "Vikram", "Priya", "Rahul", "Anitha",
  "Suresh", "Lochan", "Kavya", "Deepak", "Nisha", "Ravi", "Divya", "Ajay",
  "Pooja", "Sanjay", "Neha", "Karthik", "Sneha", "Manish", "Asha", "Vivek",
];
const lastNames = [
  "Muthyala", "Sanjibani", "Kumar", "Lakshmi", "Singh", "Nair", "Sharma",
  "Patel", "Reddy", "Gavel", "Iyer", "Das", "Gupta", "Joshi", "Menon",
  "Pillai", "Chopra", "Banerjee", "Shetty", "Rao",
];
const processes = [
  "Voice Process - Infosys",
  "Non-Voice - Wipro",
  "Synov - IT Support",
  "Customer Support – Infosys",
  "Data Entry - TCS",
  "HR Recruiter - Capgemini",
  "BPO - Cognizant",
  "Technical Support - Accenture",
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

/** Generate 1000+ seed candidates for CRM demo */
export function generateCandidates(count = 1000): CRMCandidate[] {
  const list: CRMCandidate[] = [];
  const base = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const id = String(1236 + i);
    const fn = pick(firstNames, i);
    const ln = pick(lastNames, i * 3);
    const langs = ["English"];
    if (i % 2 === 0) langs.push("Hindi");
    if (i % 3 === 0) langs.push(pick(LANGUAGES, i + 2));
    if (i % 5 === 0) langs.push(pick(LANGUAGES, i + 4));

    list.push({
      id,
      name: `${fn} ${ln}`,
      phone: `9${String(100000000 + (i * 7919) % 899999999).slice(0, 9)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
      languages: Array.from(new Set(langs)),
      location: pick(LOCATIONS, i),
      process: pick(processes, i),
      shortlisted: pick(["Yes", "No", "Pending"] as const, i),
      status: pick([...CRM_STATUSES], i),
      interviewDate: i % 4 === 0 ? `2026-07-${String((i % 28) + 1).padStart(2, "0")}` : "",
      doj: i % 7 === 0 ? `2026-08-${String((i % 28) + 1).padStart(2, "0")}` : "",
      remarks:
        i % 3 === 0
          ? `${(i % 5) + 1} exp as CSE last ctc ${(i % 4) + 2}`
          : i % 2 === 0
            ? "RNR — call again"
            : "",
      calls: i % 6,
      ctc: `${(2 + (i % 5) * 0.4).toFixed(1)} LPA`,
      takeHome: String(15000 + (i % 10) * 1000),
      invoiceDate: i % 5 === 0 ? "2026-07-01" : "",
      clauseDate: i % 5 === 0 ? "2026-07-15" : "",
      addedAt: base + i * 60_000,
    });
  }
  return list;
}

export const holidays = [
  { id: "1", name: "New Year's Day", date: "2026-01-01", type: "National public holiday" },
  { id: "2", name: "Makar Sankranti / Pongal", date: "2026-01-14", type: "Harvest festival" },
  { id: "3", name: "Republic Day", date: "2026-01-26", type: "National public holiday" },
  { id: "4", name: "Maha Shivaratri", date: "2026-02-17", type: "Hindu festival" },
  { id: "5", name: "Holi", date: "2026-03-17", type: "Festival of colours" },
  { id: "6", name: "Ugadi", date: "2026-03-31", type: "Telugu/Kannada New Year" },
  { id: "7", name: "Good Friday", date: "2026-04-03", type: "Christian holiday" },
  { id: "8", name: "Independence Day", date: "2026-08-15", type: "National public holiday" },
  { id: "9", name: "Ganesh Chaturthi", date: "2026-09-06", type: "Hindu festival" },
  { id: "10", name: "Mahatma Gandhi Jayanti", date: "2026-10-02", type: "National public holiday" },
  { id: "11", name: "Diwali / Deepavali", date: "2026-11-08", type: "Festival of lights" },
  { id: "12", name: "Christmas Day", date: "2026-12-25", type: "Christian holiday" },
];

export function daysAway(dateStr: string, from = new Date("2026-07-16")) {
  const d = new Date(dateStr);
  const diff = Math.ceil((d.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export const weeklyChart = [
  { day: "Mon", work: 7.5, break: 1.0 },
  { day: "Tue", work: 8.0, break: 0.8 },
  { day: "Wed", work: 6.5, break: 1.2 },
  { day: "Thu", work: 7.8, break: 0.9 },
  { day: "Fri", work: 8.2, break: 1.0 },
  { day: "Sat", work: 4.0, break: 0.5 },
  { day: "Sun", work: 0, break: 0 },
];

export const attendanceHistory = Array.from({ length: 20 }, (_, i) => {
  const day = 14 - i;
  const date = `2026-07-${String(Math.max(1, day)).padStart(2, "0")}`;
  const workH = 7 + (i % 3);
  const workM = [10, 25, 40, 53][i % 4];
  return {
    id: String(i + 1),
    date,
    login: `0${9 - (i % 2)}:${String(5 + (i % 50)).padStart(2, "0")} AM`,
    logout: `0${5 + (i % 2)}:${String(10 + (i % 40)).padStart(2, "0")} PM`,
    workHrs: `${workH}h ${workM}m`,
    breakHrs: `0h ${40 + (i % 30)}m`,
    status: i === 0 ? "Active" : "Complete",
  };
});

export const leaveRequestsSeed = [
  {
    id: "1",
    employee: "Gayatri",
    from: "2026-06-27",
    to: "2026-06-27",
    reason: "Due to Food poison",
    type: "Sick",
    status: "pending",
    reviewedBy: "-",
  },
  {
    id: "2",
    employee: "Gayatri",
    from: "2026-05-12",
    to: "2026-05-13",
    reason: "Family function",
    type: "Casual",
    status: "Approved",
    reviewedBy: "Admin User",
  },
  {
    id: "3",
    employee: "Gayatri",
    from: "2026-04-02",
    to: "2026-04-02",
    reason: "Personal work",
    type: "Casual",
    status: "Rejected",
    reviewedBy: "Admin User",
  },
];

export const payrollRecords = [
  {
    id: "1",
    employee: "Dynamic",
    month: "Jun 2026",
    gross: 45000,
    deductions: 3500,
    net: 41500,
    status: "Paid",
    bank: "HDFC ****4521",
  },
  {
    id: "2",
    employee: "Dynamic",
    month: "May 2026",
    gross: 45000,
    deductions: 3500,
    net: 41500,
    status: "Paid",
    bank: "HDFC ****4521",
  },
  {
    id: "3",
    employee: "Dynamic",
    month: "Apr 2026",
    gross: 45000,
    deductions: 3200,
    net: 41800,
    status: "Paid",
    bank: "HDFC ****4521",
  },
  {
    id: "4",
    employee: "Dynamic",
    month: "Mar 2026",
    gross: 44000,
    deductions: 3100,
    net: 40900,
    status: "Paid",
    bank: "HDFC ****4521",
  },
];

export const employees = [
  {
    id: "e1",
    name: "Gayatri H",
    email: "gayatri@redfoxa.com",
    phone: "9000000001",
    role: "Recruitment Executive",
    status: "Logged In",
    breakHrs: "0h 45m",
    workHrs: "5h 20m",
    crmAccess: true,
  },
  {
    id: "e2",
    name: "Rahul Sharma",
    email: "candidate@redfoxa.com",
    phone: "9000000002",
    role: "HR Associate",
    status: "On Break",
    breakHrs: "1h 10m",
    workHrs: "3h 15m",
    crmAccess: true,
  },
  {
    id: "e3",
    name: "Priya Nair",
    email: "priya@redfoxa.com",
    phone: "9000000003",
    role: "Payroll Executive",
    status: "Logged Out",
    breakHrs: "0h 00m",
    workHrs: "0h 00m",
    crmAccess: false,
  },
  {
    id: "e4",
    name: "Suresh Patel",
    email: "suresh@redfoxa.com",
    phone: "9000000004",
    role: "Recruiter",
    status: "Logged In",
    breakHrs: "0h 30m",
    workHrs: "6h 00m",
    crmAccess: true,
  },
];

export type Vendor = {
  id: string;
  company: string;
  contactPerson: string;
  contact: string;
  phone: string;
  website: string;
  location: string;
  agreementDate: string;
  documents: Array<{ id: string; name: string; type: string }>;
  jobOpeningIds: string[];
};

export const vendors: Vendor[] = [
  {
    id: "v1",
    company: "Infosys BPM",
    contactPerson: "Ramesh K",
    contact: "ramesh@infosys.com",
    phone: "080-12345678",
    website: "https://www.infosys.com",
    location: "Bangalore",
    agreementDate: "2026-01-15",
    documents: [
      { id: "vd1", name: "infosys_agreement.pdf", type: "Agreement" },
      { id: "vd2", name: "infosys_msa.pdf", type: "MSA" },
    ],
    jobOpeningIds: ["1"],
  },
  {
    id: "v2",
    company: "Wipro Limited",
    contactPerson: "Anita D",
    contact: "anita@wipro.com",
    phone: "080-87654321",
    website: "https://www.wipro.com",
    location: "Bangalore",
    agreementDate: "2026-02-20",
    documents: [{ id: "vd3", name: "wipro_agreement.pdf", type: "Agreement" }],
    jobOpeningIds: ["2"],
  },
  {
    id: "v3",
    company: "TCS",
    contactPerson: "Vikash M",
    contact: "vikash@tcs.com",
    phone: "022-99887766",
    website: "https://www.tcs.com",
    location: "Mumbai",
    agreementDate: "2026-03-10",
    documents: [{ id: "vd4", name: "tcs_nda.pdf", type: "NDA" }],
    jobOpeningIds: ["3"],
  },
];

export const jobOpenings = [
  {
    id: "1",
    vendorId: "v1",
    company: "Infosys BPM",
    role: "Customer Support Executive",
    process: "Voice",
    skills: "Communication, Soft skills",
    languages: "English, Hindi",
    salary: "18,000 - 22,000",
    ctc: "2.4 LPA",
    takeHome: "18,500",
    location: "Bangalore",
    jd: "Handle inbound customer queries and resolve issues promptly.",
    invoiceDate: "2026-07-01",
    clauseDate: "2026-07-15",
  },
  {
    id: "2",
    vendorId: "v2",
    company: "Wipro Limited",
    role: "Data Entry Operator",
    process: "Non-Voice",
    skills: "MS Office, Typing",
    languages: "English",
    salary: "15,000 - 18,000",
    ctc: "2.0 LPA",
    takeHome: "15,500",
    location: "Hyderabad",
    jd: "Accurate data entry and document processing for client projects.",
    invoiceDate: "2026-07-05",
    clauseDate: "2026-07-20",
  },
  {
    id: "3",
    vendorId: "v3",
    company: "TCS",
    role: "HR Recruiter Intern",
    process: "Non-Voice",
    skills: "Recruitment, Screening",
    languages: "English, Kannada",
    salary: "12,000 - 15,000",
    ctc: "1.8 LPA",
    takeHome: "13,000",
    location: "Bangalore",
    jd: "Screen resumes, schedule interviews, and update CRM tracker.",
    invoiceDate: "2026-07-08",
    clauseDate: "2026-07-25",
  },
];

export const selectedCandidates = [
  {
    id: "s1",
    student: "Vikram Singh",
    email: "vikram@gmail.com",
    phone: "8877665544",
    company: "Infosys BPM",
    role: "Customer Support Executive",
    location: "Bangalore",
    selectedDate: "2026-07-10",
    interviewDate: "2026-07-08",
    joiningDate: "2026-07-20",
    profile: "2 years CSE experience, English + Hindi, CTC 2.4 LPA",
  },
  {
    id: "s2",
    student: "Sangya Sanjibani",
    email: "sangya@gmail.com",
    phone: "9123456780",
    company: "Wipro Limited",
    role: "Data Entry Operator",
    location: "Bangalore",
    selectedDate: "2026-07-12",
    interviewDate: "2026-07-09",
    joiningDate: "2026-07-22",
    profile: "Fresh graduate, English/Hindi/Bengali, Non-Voice role",
  },
];

export const documents = [
  {
    id: "d1",
    employee: "Gayatri H",
    type: "Aadhaar",
    fileName: "gayatri_aadhaar.pdf",
    uploadedAt: "2026-06-01",
  },
  {
    id: "d2",
    employee: "Gayatri H",
    type: "PAN",
    fileName: "gayatri_pan.pdf",
    uploadedAt: "2026-06-01",
  },
  {
    id: "d3",
    employee: "Rahul Sharma",
    type: "Aadhaar",
    fileName: "rahul_aadhaar.pdf",
    uploadedAt: "2026-06-05",
  },
];

export const conversations = [
  {
    id: "c1",
    name: "HR Admin",
    lastMessage: "Please update your attendance.",
    time: "10:30 AM",
    unread: 1,
  },
  {
    id: "c2",
    name: "Payroll Team",
    lastMessage: "June payslip is ready.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "c3",
    name: "Recruitment Lead",
    lastMessage: "New job openings assigned.",
    time: "Mon",
    unread: 0,
  },
];

export const messages = [
  {
    id: "m1",
    from: "HR Admin",
    text: "Hi, please update your CRM calls for today.",
    time: "10:15 AM",
    mine: false,
  },
  {
    id: "m2",
    from: "Me",
    text: "Sure, I will update them shortly.",
    time: "10:18 AM",
    mine: true,
  },
  {
    id: "m3",
    from: "HR Admin",
    text: "Please update your attendance.",
    time: "10:30 AM",
    mine: false,
  },
];

// Keep leaveRequests alias for admin pages
export const leaveRequests = [
  {
    id: "1",
    employee: "Gayatri H",
    from: "2026-07-20",
    to: "2026-07-21",
    reason: "Family function",
    type: "Casual",
    status: "Pending",
  },
  {
    id: "2",
    employee: "Rahul Sharma",
    from: "2026-07-10",
    to: "2026-07-11",
    reason: "Fever",
    type: "Sick",
    status: "Approved",
  },
  {
    id: "3",
    employee: "Priya Nair",
    from: "2026-06-28",
    to: "2026-06-30",
    reason: "Personal work",
    type: "Casual",
    status: "Rejected",
  },
];
