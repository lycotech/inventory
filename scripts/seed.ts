import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Create warehouses first
  console.log("Setting up warehouses...");
  
  const warehouses = [
    {
      warehouseName: "Central Warehouse",
      warehouseCode: "CWH001",
      location: "Main Distribution Center",
      contactPerson: "John Manager",
      phoneNumber: "+1234567890",
      email: "central@company.com",
      isCentralWarehouse: true,
    },
    {
      warehouseName: "Branch A",
      warehouseCode: "BWH001", 
      location: "North Branch",
      contactPerson: "Alice Branch",
      phoneNumber: "+1234567891",
      email: "brancha@company.com",
      isCentralWarehouse: false,
    },
    {
      warehouseName: "Branch B", 
      warehouseCode: "BWH002",
      location: "South Branch",
      contactPerson: "Bob Branch",
      phoneNumber: "+1234567892", 
      email: "branchb@company.com",
      isCentralWarehouse: false,
    },
    {
      warehouseName: "Storage Depot",
      warehouseCode: "SWH001",
      location: "External Storage Facility", 
      contactPerson: "Carol Storage",
      phoneNumber: "+1234567893",
      email: "storage@company.com",
      isCentralWarehouse: false,
    },
  ];

  for (const warehouse of warehouses) {
    const existing = await prisma.warehouse.findUnique({ 
      where: { warehouseName: warehouse.warehouseName } 
    });
    if (!existing) {
      await prisma.warehouse.create({ data: warehouse });
      console.log(`Created warehouse: ${warehouse.warehouseName} (${warehouse.isCentralWarehouse ? 'Central' : 'Branch'})`);
    } else {
      console.log(`Warehouse already exists: ${warehouse.warehouseName}`);
    }
  }

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

  // Add sample inventory data if none exists
  const inventoryCount = await prisma.inventory.count();
  if (inventoryCount === 0) {
    console.log("Adding sample inventory data...");
    
    // Get admin user to use as creator
    const adminUser = await prisma.user.findUnique({ where: { username } });
    if (!adminUser) {
      console.log("Admin user not found, skipping sample data creation");
      return;
    }
    
    const sampleItems = [
      { itemName: "Laptop Dell XPS", category: "Electronics", warehouseName: "Central Warehouse", stockQty: 45, stockAlertLevel: 10, barcode: "LAP001", searchCode: "LAPDELXPS", createdBy: adminUser.id },
      { itemName: "Office Chair", category: "Furniture", warehouseName: "Central Warehouse", stockQty: 23, stockAlertLevel: 5, barcode: "CHR001", searchCode: "OFFCHAIR", createdBy: adminUser.id },
      { itemName: "Printer Paper A4", category: "Office Supplies", warehouseName: "Central Warehouse", stockQty: 8, stockAlertLevel: 15, barcode: "PPR001", searchCode: "PRNPAPERA4", createdBy: adminUser.id }, // Low stock
      { itemName: "USB Cable", category: "Electronics", warehouseName: "Branch A", stockQty: 67, stockAlertLevel: 20, barcode: "USB001", searchCode: "USBCBL", createdBy: adminUser.id },
      { itemName: "Desk Lamp", category: "Furniture", warehouseName: "Branch A", stockQty: 34, stockAlertLevel: 8, barcode: "LMP001", searchCode: "DSKLMP", createdBy: adminUser.id },
      { itemName: "Notebook", category: "Office Supplies", warehouseName: "Central Warehouse", stockQty: 156, stockAlertLevel: 25, barcode: "NTB001", searchCode: "NOTEBOOK", createdBy: adminUser.id },
      { itemName: "Monitor 24inch", category: "Electronics", warehouseName: "Branch B", stockQty: 12, stockAlertLevel: 15, barcode: "MON001", searchCode: "MON24", createdBy: adminUser.id },
      { itemName: "Coffee Beans", category: "Beverages", warehouseName: "Storage Depot", stockQty: 4, stockAlertLevel: 10, barcode: "COF001", searchCode: "COFBEANS", createdBy: adminUser.id }, // Low stock
      { itemName: "Whiteboard Marker", category: "Office Supplies", warehouseName: "Central Warehouse", stockQty: 28, stockAlertLevel: 12, barcode: "MRK001", searchCode: "WHTMRK", createdBy: adminUser.id },
      { itemName: "Keyboard Wireless", category: "Electronics", warehouseName: "Branch A", stockQty: 19, stockAlertLevel: 8, barcode: "KBD001", searchCode: "KBDWIRELESS", createdBy: adminUser.id },
    ];

    for (const item of sampleItems) {
      await prisma.inventory.create({ data: item });
    }

    console.log(`Added ${sampleItems.length} sample inventory items`);

    // Add some sample transactions
    const items = await prisma.inventory.findMany();
    const today = new Date();
    const transactions = [];
    
    for (let i = 0; i < 7; i++) {
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - i);
      
      // Create 2-5 transactions per day
      const numTransactions = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numTransactions; j++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 20) + 1;
        const isReceive = Math.random() > 0.5;
        const transactionType = isReceive ? 'receive' : 'issue';
        
        transactions.push({
          inventoryId: randomItem.id,
          quantity: isReceive ? quantity : -quantity,
          transactionType: transactionType as any,
          transactionDate,
          reason: `Sample ${transactionType} transaction`,
          processedBy: adminUser.id,
        });
      }
    }

    for (const transaction of transactions) {
      await prisma.stockTransaction.create({ data: transaction });
    }

    console.log(`Added ${transactions.length} sample transactions`);
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
