const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWarehouseAPI() {
  try {
    // Simulate the API call
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: [
        { isCentralWarehouse: 'desc' },
        { warehouseName: 'asc' }
      ],
    });
    
    console.log('API simulation result:');
    console.log(JSON.stringify({ warehouses }, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWarehouseAPI();
