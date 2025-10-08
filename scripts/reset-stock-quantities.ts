import { prisma } from "@/lib/prisma";
import { decimalToNumber, decimalCompare } from "@/lib/decimal-utils";

async function resetStockQuantities() {
  console.log("🔄 Starting stock quantity reset to zero...");
  
  try {
    // Get current user ID (you'll need to replace this with actual admin user ID)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      throw new Error("No admin user found. Please create an admin user first.");
    }
    
    console.log(`Using admin user: ${adminUser.username} (ID: ${adminUser.id})`);
    
    // Get all inventory items with non-zero quantities (both positive and negative)
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        stockQty: { not: 0 }
      },
      select: {
        id: true,
        barcode: true,
        itemName: true,
        warehouseName: true,
        stockQty: true
      }
    });
    
    if (inventoryItems.length === 0) {
      console.log("✅ No items found with non-zero quantities. Nothing to reset.");
      return;
    }
    
    const positiveItems = inventoryItems.filter(item => decimalCompare(item.stockQty, 0).isGreater);
    const negativeItems = inventoryItems.filter(item => decimalCompare(item.stockQty, 0).isLess);
    
    console.log(`Found ${inventoryItems.length} items with non-zero quantities:`);
    console.log(`  - ${positiveItems.length} items with positive stock`);
    console.log(`  - ${negativeItems.length} items with negative stock`);
    
    // Create confirmation prompt
    console.log("\n📋 Items to be reset:");
    console.log("🟢 Positive Stock Items:");
    positiveItems.forEach(item => {
      console.log(`  - ${item.itemName} (${item.barcode}) at ${item.warehouseName}: +${item.stockQty} → 0`);
    });
    
    if (negativeItems.length > 0) {
      console.log("🔴 Negative Stock Items:");
      negativeItems.forEach(item => {
        console.log(`  - ${item.itemName} (${item.barcode}) at ${item.warehouseName}: ${item.stockQty} → 0`);
      });
    }
    
    // In a real scenario, you'd want manual confirmation here
    // For script execution, we'll proceed
    
    let resetCount = 0;
    let transactionCount = 0;
    
    // Process each item
    for (const item of inventoryItems) {
      const currentQty = item.stockQty;
      
      // Create an "adjustment" transaction record for audit trail
      const reason = decimalCompare(currentQty, 0).isGreater
        ? 'Stock quantity reset to zero - Positive stock adjustment'
        : decimalCompare(currentQty, 0).isLess
        ? 'Stock quantity reset to zero - Negative stock correction'
        : 'Stock quantity reset to zero - Administrative adjustment';
        
      await prisma.stockTransaction.create({
        data: {
          inventoryId: item.id,
          transactionType: 'adjustment',
          quantity: -currentQty, // Negative of current quantity to bring to zero
          transactionDate: new Date(),
          referenceDoc: `RESET-${new Date().toISOString().slice(0, 10)}`,
          reason: reason,
          processedBy: adminUser.id
        }
      });
      
      // Update the inventory quantity to zero
      await prisma.inventory.update({
        where: { id: item.id },
        data: { stockQty: 0 }
      });
      
      console.log(`✅ Reset ${item.itemName} (${item.barcode}): ${currentQty} → 0`);
      resetCount++;
      transactionCount++;
    }
    
    console.log(`\n🎉 Stock reset completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`  - Items reset: ${resetCount}`);
    console.log(`  - Transactions created: ${transactionCount}`);
    console.log(`  - All changes are recorded in StockTransaction table for audit trail`);
    
    // Verify the reset
    const remainingItems = await prisma.inventory.count({
      where: { stockQty: { not: 0 } }
    });
    
    const positiveRemaining = await prisma.inventory.count({
      where: { stockQty: { gt: 0 } }
    });
    
    const negativeRemaining = await prisma.inventory.count({
      where: { stockQty: { lt: 0 } }
    });
    
    console.log(`\n✅ Verification:`);
    console.log(`  - ${remainingItems} items remaining with non-zero quantities`);
    console.log(`  - ${positiveRemaining} items with positive stock`);
    console.log(`  - ${negativeRemaining} items with negative stock`);
    
  } catch (error) {
    console.error("❌ Error during stock reset:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
resetStockQuantities().catch(console.error);