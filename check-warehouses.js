const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWarehouses() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { warehouseName: 'asc' }
    });
    
    console.log('All warehouses in database:');
    console.log(JSON.stringify(warehouses, null, 2));
    
    const activeWarehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { warehouseName: 'asc' }
    });
    
    console.log('\nActive warehouses:');
    console.log(JSON.stringify(activeWarehouses, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWarehouses();
