import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

// Inline password hashing
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

async function main() {
  // Only create/ensure the single Admin user
  await prisma.user.upsert({
    where: { email: "admin@redfoxa.com" },
    update: {
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      crmAccess: false,
    },
    create: {
      email: "admin@redfoxa.com",
      passwordHash: hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      crmAccess: false,
    },
  });

  console.log("Successfully seeded single admin account: admin@redfoxa.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });