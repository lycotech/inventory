import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding essential data only...");

  // Ensure admin user exists
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  
  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ 
      data: { 
        username, 
        email, 
        passwordHash, 
        role: "admin" as any,
        firstName: "System",
        lastName: "Administrator"
      } 
    });
    console.log("✅ Admin user created:", username);
  } else {
    console.log("✅ Admin user already exists:", username);
  }

  // Create essential aging categories if they don't exist
  const agingCategoriesCount = await prisma.agingCategory.count();
  if (agingCategoriesCount === 0) {
    console.log("Creating essential aging categories...");
    const agingCategories = [
      { categoryName: "Fresh", minDays: 0, maxDays: 30, colorCode: "#22c55e", priorityLevel: 1 },
      { categoryName: "Good", minDays: 31, maxDays: 90, colorCode: "#eab308", priorityLevel: 2 },
      { categoryName: "Aging", minDays: 91, maxDays: 180, colorCode: "#f97316", priorityLevel: 3 },
      { categoryName: "Critical", minDays: 181, maxDays: null, colorCode: "#ef4444", priorityLevel: 4 },
    ];
    
    for (const category of agingCategories) {
      await prisma.agingCategory.create({ data: category });
    }
    console.log("✅ Created aging categories");
  } else {
    console.log("✅ Aging categories already exist");
  }

  // Create essential app settings if they don't exist
  const settingsCount = await prisma.appSetting.count();
  if (settingsCount === 0) {
    console.log("Creating essential app settings...");
    const settings = [
      { key: "appName", value: "Inventory Management System" },
      { key: "appShortName", value: "InvAlert" },
      { key: "preventNegativeIssue", value: true },
      { key: "alertEmailRecipients", value: [] },
      { key: "companyName", value: "Your Company Name" },
      { key: "companyAddress", value: "Your Company Address" },
    ];
    
    for (const setting of settings) {
      await prisma.appSetting.create({ data: setting });
    }
    console.log("✅ Created essential app settings");
  } else {
    console.log("✅ App settings already exist");
  }

  console.log("\n🎉 Essential data seeding completed!");
  console.log("\n📋 What's been created:");
  console.log(`   👤 Admin user: ${username}`);
  console.log("   📊 Aging categories for stock tracking");
  console.log("   ⚙️  Essential app settings");
  console.log("\n🚀 Ready for production use!");
  console.log("\n📝 Next steps:");
  console.log("   1. Set up your warehouses via /dashboard/warehouse-transfer");
  console.log("   2. Import your inventory data via /dashboard/import");
  console.log("   3. Configure settings via /dashboard/settings");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
