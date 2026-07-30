// Plain-Node seed (no ts-node required). Run via: npx prisma db seed
// This intentionally seeds ONLY the admin login and removes the old demo/test
// data (sample employees + demo candidate logins) so you start with a clean DB.
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

// Old demo/test data to remove if present.
const DEMO_EMPLOYEE_IDS = ["EMP001", "EMP002", "EMP003", "EMP004"];
const DEMO_USER_EMAILS = ["gayatri@redfoxa.com", "candidate@redfoxa.com", "priya@redfoxa.com", "suresh@redfoxa.com"];

async function main() {
  // Remove leftover testing data (attendance/payroll cascade via schema).
  const delEmp = await prisma.employee.deleteMany({ where: { employeeId: { in: DEMO_EMPLOYEE_IDS } } });
  const delUsr = await prisma.user.deleteMany({ where: { email: { in: DEMO_USER_EMAILS } } });

  // The only account created by the seed is the admin.
  await prisma.user.upsert({
    where: { email: "admin@redfoxa.com" },
    update: { firstName: "Admin", lastName: "User", role: "admin", crmAccess: false },
    create: {
      email: "admin@redfoxa.com",
      passwordHash: hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      crmAccess: false,
    },
  });

  console.log(`Cleaned ${delEmp.count} demo employees, ${delUsr.count} demo logins. Admin account ready (admin@redfoxa.com / admin123).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
