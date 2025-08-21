import { prisma } from '../lib/prisma';

async function createMissingWarehouse() {
  try {
    console.log('🏭 Creating missing warehouse for existing inventory...\n');
    
    // Check if warehouse already exists
    const existing = await prisma.warehouse.findFirst({
      where: { 
        OR: [
          { warehouseName: 'WHS Arena' },
          { warehouseCode: 'WHS-ARENA' }
        ]
      }
    });

    if (existing) {
      console.log(`✅ Warehouse "${existing.warehouseName}" already exists`);
      return;
    }

    // Create the warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        warehouseName: 'WHS Arena',
        warehouseCode: 'WHS-ARENA',
        location: 'Main Location', // You can update this later
        contactPerson: 'Warehouse Manager', // You can update this later
        phoneNumber: '000-000-0000', // You can update this later
        email: 'warehouse@company.com', // You can update this later
        isCentralWarehouse: true, // Making it central since it has all your inventory
        isActive: true
      }
    });

    console.log(`✅ Successfully created warehouse:`);
    console.log(`   - Name: ${warehouse.warehouseName}`);
    console.log(`   - Code: ${warehouse.warehouseCode}`);
    console.log(`   - Central: ${warehouse.isCentralWarehouse ? 'Yes' : 'No'}`);

    // Update inventory count
    const inventoryCount = await prisma.inventory.count({
      where: { warehouseName: 'WHS Arena' }
    });

    console.log(`\n📦 Linked ${inventoryCount} existing inventory items to this warehouse`);
    
    console.log(`\n🎉 Your dashboard should now work properly!`);
    console.log(`\n📝 You can update the warehouse details at:`);
    console.log(`   http://localhost:3000/dashboard/warehouse-transfer`);
    
  } catch (error) {
    console.error('❌ Error creating warehouse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingWarehouse();
