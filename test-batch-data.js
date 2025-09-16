const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBatchData() {
  console.log('=== Checking Batch Data ===');
  
  const batches = await prisma.batch.findMany({
    include: {
      inventory: true,
      warehouse: true
    }
  });
  
  console.log(`Total batches: ${batches.length}`);
  
  batches.forEach((batch, index) => {
    console.log(`\nBatch ${index + 1}:`);
    console.log(`- ID: ${batch.id}`);
    console.log(`- Batch Number: ${batch.batchNumber}`);
    console.log(`- Expiry Date: ${batch.expiryDate}`);
    console.log(`- Expire Date Alert: ${batch.expireDateAlert}`);
    console.log(`- Is Active: ${batch.isActive}`);
    console.log(`- Quantity Remaining: ${batch.quantityRemaining}`);
    console.log(`- Item: ${batch.inventory?.itemName || 'N/A'}`);
    console.log(`- Warehouse: ${batch.warehouse?.warehouseName || 'N/A'}`);
    
    if (batch.expiryDate) {
      const today = new Date();
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`- Days until expiry: ${daysUntilExpiry}`);
      console.log(`- Should alert? ${daysUntilExpiry <= batch.expireDateAlert ? 'YES' : 'NO'}`);
    }
  });
  
  // Test the actual query from the API
  console.log('\n=== Testing API Query ===');
  const expiringSoonBatches = await prisma.batch.findMany({
    where: {
      AND: [
        { expiryDate: { not: null } },
        { expireDateAlert: { gt: 0 } },
        { isActive: true },
        { quantityRemaining: { gt: 0 } }
      ]
    },
    include: {
      inventory: true,
      warehouse: true
    },
    orderBy: { expiryDate: 'asc' },
    take: 5
  });
  
  console.log(`Batches matching API query: ${expiringSoonBatches.length}`);
  
  await prisma.$disconnect();
}

checkBatchData().catch(console.error);