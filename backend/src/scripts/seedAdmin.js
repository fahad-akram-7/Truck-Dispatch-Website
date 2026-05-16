import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@dispatch.local";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const fullName = process.env.ADMIN_NAME || "System Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "ADMIN"
    }
  });

  console.log(`Admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
