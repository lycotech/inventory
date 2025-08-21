import { prisma } from '../lib/prisma';

async function checkData() {
  try {
    console.log('🔍 Checking database content...\n');
    
    // Count basic data
    const [inventoryCount, warehouseCount, transactionCount, userCount] = await Promise.all([
      prisma.inventory.count(),
      prisma.warehouse.count(),
      prisma.stockTransaction.count(),
      prisma.user.count()
    ]);

    console.log(`📊 Data Counts:`);
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   🏭 Warehouses: ${warehouseCount}`);
    console.log(`   📦 Inventory Items: ${inventoryCount}`);
    console.log(`   🔄 Transactions: ${transactionCount}\n`);

    // Check if we have warehouses
    if (warehouseCount > 0) {
      const warehouses = await prisma.warehouse.findMany({
        select: { id: true, warehouseName: true, warehouseCode: true, isCentralWarehouse: true }
      });
      console.log(`🏭 Warehouses:`);
      warehouses.forEach((w: any) => {
        console.log(`   - ${w.warehouseName} (${w.warehouseCode})${w.isCentralWarehouse ? ' [CENTRAL]' : ''}`);
      });
      console.log('');
    }

    // Sample inventory items
    if (inventoryCount > 0) {
      const sampleItems = await prisma.inventory.findMany({
        take: 5,
        select: { 
          itemName: true, 
          stockQty: true, 
          warehouseName: true
        }
      });
      console.log(`📦 Sample Inventory Items:`);
      sampleItems.forEach((item: any) => {
        console.log(`   - ${item.itemName} (Qty: ${item.stockQty}) @ ${item.warehouseName}`);
      });
    } else {
      console.log(`⚠️  No inventory items found - this explains the blank dashboard!`);
    }

    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
