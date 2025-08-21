import { prisma } from "@/lib/prisma";

async function cleanup() {
  console.log("🧹 Cleaning up demo data...");

  try {
    // Delete demo inventory items
    console.log("Deleting demo inventory items...");
    const deletedInventory = await prisma.inventory.deleteMany({
      where: {
        OR: [
          { barcode: { in: ["LAP001", "CHR001", "PPR001", "USB001", "LMP001", "NTB001", "MON001", "COF001", "MRK001", "KBD001", "123"] } },
          { itemName: { contains: "Demo" } },
          { itemName: { contains: "Sample" } },
          { itemName: { in: ["Laptop Dell XPS", "Office Chair", "Printer Paper A4", "USB Cable", "Desk Lamp", "Notebook", "Monitor 24inch", "Coffee Beans", "Whiteboard Marker", "Keyboard Wireless"] } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedInventory.count} demo inventory items`);

    // Delete demo stock transactions (optional - keeps history if you want)
    console.log("Deleting demo stock transactions...");
    const deletedTransactions = await prisma.stockTransaction.deleteMany({
      where: {
        OR: [
          { referenceDoc: { contains: "DEMO" } },
          { referenceDoc: { contains: "Sample" } },
          { reason: { contains: "demo" } },
          { reason: { contains: "sample" } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedTransactions.count} demo transactions`);

    // Delete demo alert logs
    console.log("Deleting demo alert logs...");
    const deletedAlerts = await prisma.alertLog.deleteMany({
      where: {
        OR: [
          { message: { contains: "Demo" } },
          { message: { contains: "Sample" } },
          { message: { contains: "Laptop Dell XPS" } },
          { message: { contains: "Office Chair" } },
          { message: { contains: "USB Cable" } }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedAlerts.count} demo alert logs`);

    // Delete demo warehouses
    console.log("Deleting demo warehouses...");
    const deletedWarehouses = await prisma.warehouse.deleteMany({
      where: {
        warehouseName: {
          in: [
            "Central Warehouse", 
            "Branch A", 
            "Branch B", 
            "Storage Depot",
            "Main Warehouse",
            "Storage A",
            "Storage B",
            "Kitchen Storage"
          ]
        }
      }
    });
    console.log(`✅ Deleted ${deletedWarehouses.count} demo warehouses`);

    // Delete demo import history
    console.log("Cleaning up import history...");
    const deletedImports = await prisma.importHistory.deleteMany({
      where: {
        filename: {
          contains: "demo"
        }
      }
    });
    console.log(`✅ Deleted ${deletedImports.count} demo import records`);

    // Delete demo stock aging records
    console.log("Cleaning up stock aging records...");
    const deletedAging = await prisma.stockAging.deleteMany({});
    console.log(`✅ Deleted ${deletedAging.count} stock aging records`);

    console.log("\n🎉 Demo data cleanup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Set up your real warehouses using the warehouse management page");
    console.log("2. Import your actual inventory data");
    console.log("3. Configure your real categories and items");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  });
