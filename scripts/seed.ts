import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log("Admin user already exists:", username);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { username, email, passwordHash, role: "admin" as any } });
  console.log("Admin user created:", username);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
