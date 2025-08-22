import { prisma } from '../lib/prisma';

async function getWarehouseNames() {
  try {
    console.log('🔍 Finding warehouse names in inventory...\n');
    
    const result = await prisma.$queryRaw<{warehouseName: string, item_count: bigint}[]>`
      SELECT warehouseName, COUNT(*) as item_count 
      FROM Inventory 
      GROUP BY warehouseName 
      ORDER BY item_count DESC
    `;

    console.log(`📊 Warehouses referenced in inventory:`);
    result.forEach((row: { warehouseName: string; item_count: bigint }) => {
      console.log(`   - ${row.warehouseName}: ${Number(row.item_count)} items`);
    });

    console.log(`\n✅ Found ${result.length} unique warehouse names in inventory`);
    console.log(`\n🔧 Next steps:`);
    console.log(`   1. Create these warehouses using the setup script`);
    console.log(`   2. Or run cleanup to remove orphaned inventory`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getWarehouseNames();
