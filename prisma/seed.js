// Plain-Node seed (no ts-node required). Run via: npx prisma db seed
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

const seedEmployees = [
  {
    employeeId: "EMP001", name: "Gayatri H", email: "gayatri@redfoxa.com", phone: "9000000001",
    department: "Recruitment", designation: "Recruitment Executive", status: "Active",
    doj: new Date("2024-06-01"), accountHolder: "Gayatri H", bankName: "State Bank of India",
    accountNumber: "30012345678", ifsc: "SBIN0001234", branch: "MG Road, Bangalore",
    panNumber: "ABCDE1234F", aadhaarNumber: "123412341234", crmEnabled: true, monthlyCtc: 45000, takeHome: 38000,
  },
  {
    employeeId: "EMP002", name: "Rahul Sharma", email: "candidate@redfoxa.com", phone: "9000000002",
    department: "Human Resources", designation: "HR Associate", status: "Active",
    doj: new Date("2024-08-15"), accountHolder: "Rahul Sharma", bankName: "HDFC Bank",
    accountNumber: "50100234567", ifsc: "HDFC0000456", branch: "Koramangala, Bangalore",
    panNumber: "BCDEF2345G", aadhaarNumber: "234523452345", crmEnabled: true, monthlyCtc: 40000, takeHome: 34000,
  },
  {
    employeeId: "EMP003", name: "Priya Nair", email: "priya@redfoxa.com", phone: "9000000003",
    department: "Finance", designation: "Payroll Executive", status: "Active",
    doj: new Date("2023-11-20"), accountHolder: "Priya Nair", bankName: "ICICI Bank",
    accountNumber: "60200345678", ifsc: "ICIC0000789", branch: "Indiranagar, Bangalore",
    panNumber: "CDEFG3456H", aadhaarNumber: "345634563456", crmEnabled: false, monthlyCtc: 52000, takeHome: 44000,
  },
  {
    employeeId: "EMP004", name: "Suresh Patel", email: "suresh@redfoxa.com", phone: "9000000004",
    department: "Recruitment", designation: "Recruiter", status: "Active",
    doj: new Date("2025-01-10"), accountHolder: "Suresh Patel", bankName: "Axis Bank",
    accountNumber: "91800456789", ifsc: "UTIB0001122", branch: "Whitefield, Bangalore",
    panNumber: "DEFGH4567I", aadhaarNumber: "456745674567", crmEnabled: true, monthlyCtc: 38000, takeHome: 32000,
  },
];

async function main() {
  for (const emp of seedEmployees) {
    await prisma.employee.upsert({ where: { employeeId: emp.employeeId }, update: emp, create: emp });
  }

  const gayatri = await prisma.employee.findUnique({ where: { employeeId: "EMP001" } });
  if (gayatri) {
    const existing = await prisma.attendance.count({ where: { employeeId: gayatri.id } });
    if (existing === 0) {
      for (let d = 1; d <= 5; d++) {
        await prisma.attendance.create({
          data: {
            employeeId: gayatri.id,
            date: new Date(2026, 1, d),
            loginAt: new Date(2026, 1, d, 9, 30),
            logoutAt: new Date(2026, 1, d, 18, 15),
            breakMinutes: 45,
            workedMinutes: 8 * 60,
            status: "Complete",
          },
        });
      }
    }
  }

  const users = [
    { email: "admin@redfoxa.com", password: "admin123", firstName: "Admin", lastName: "User", role: "admin", crmAccess: false },
    { email: "gayatri@redfoxa.com", password: "candidate123", firstName: "Gayatri", lastName: "H", role: "candidate", crmAccess: true },
    { email: "candidate@redfoxa.com", password: "candidate123", firstName: "Rahul", lastName: "Sharma", role: "candidate", crmAccess: true },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName, role: u.role, crmAccess: u.crmAccess },
      create: { email: u.email, passwordHash: hashPassword(u.password), firstName: u.firstName, lastName: u.lastName, role: u.role, crmAccess: u.crmAccess },
    });
  }

  console.log(`Seeded ${seedEmployees.length} employees + ${users.length} login accounts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
