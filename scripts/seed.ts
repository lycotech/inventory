import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Ensure admin user
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { username, email, passwordHash, role: "admin" as any } });
    console.log("Admin user created:", username);
  } else {
    console.log("Admin user already exists:", username);
  }

  // Seed default aging categories
  const defaults = [
    { categoryName: "0-30 Days", minDays: 0,   maxDays: 30,  colorCode: "#28a745", priorityLevel: 1, isActive: true },
    { categoryName: "31-60 Days", minDays: 31, maxDays: 60,  colorCode: "#ffc107", priorityLevel: 2, isActive: true },
    { categoryName: "61-90 Days", minDays: 61, maxDays: 90,  colorCode: "#fd7e14", priorityLevel: 3, isActive: true },
    { categoryName: "91-180 Days", minDays: 91, maxDays: 180, colorCode: "#fd7e14", priorityLevel: 4, isActive: true },
    { categoryName: "180+ Days", minDays: 181, maxDays: null, colorCode: "#dc3545", priorityLevel: 5, isActive: true },
  ] as const;

  // Try Prisma model first
  const client: any = prisma as any;
  if (client.agingCategory?.findMany) {
    for (const cat of defaults) {
      const found = await client.agingCategory.findFirst({ where: { categoryName: cat.categoryName } });
      if (!found) {
        await client.agingCategory.create({ data: { ...cat } });
        console.log("Seeded aging category:", cat.categoryName);
      }
    }
    return;
  }

  // Fallback: raw SQL (for cases where Prisma client hasn't been regenerated yet)
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS AgingCategory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoryName VARCHAR(191) NOT NULL,
        minDays INT NOT NULL,
        maxDays INT NULL,
        colorCode VARCHAR(191) NOT NULL DEFAULT '#28a745',
        priorityLevel INT NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        INDEX idx_minDays (minDays)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );
    for (const cat of defaults) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM AgingCategory WHERE categoryName = ? LIMIT 1`,
        cat.categoryName
      );
      if (!rows || rows.length === 0) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO AgingCategory (categoryName, minDays, maxDays, colorCode, priorityLevel, isActive)
           VALUES (?, ?, ?, ?, ?, ?)`,
          cat.categoryName, cat.minDays, cat.maxDays, cat.colorCode, cat.priorityLevel, cat.isActive ? 1 : 0
        );
        console.log("Seeded aging category (raw):", cat.categoryName);
      }
    }
  } catch (e) {
    console.warn("Skipping AgingCategory seed (raw) due to error:", (e as Error).message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
