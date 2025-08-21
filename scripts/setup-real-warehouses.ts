import { prisma } from "@/lib/prisma";

async function setupRealWarehouses() {
  console.log("🏭 Setting up your real warehouses...");
  
  // ⚠️ CUSTOMIZE THIS SECTION WITH YOUR ACTUAL WAREHOUSE INFORMATION ⚠️
  const warehouses = [
    {
      warehouseName: "YOUR_CENTRAL_WAREHOUSE_NAME", // e.g., "Main Distribution Center"
      warehouseCode: "CWH001",                       // e.g., "MDC001"
      location: "Your warehouse address",            // e.g., "123 Industrial Blvd, City, State"
      contactPerson: "Warehouse Manager Name",       // e.g., "John Smith"
      phoneNumber: "+1234567890",                    // Your contact number
      email: "manager@yourcompany.com",              // Manager email
      isCentralWarehouse: true,                      // ⭐ This is your central warehouse
    },
    {
      warehouseName: "YOUR_BRANCH_1_NAME",          // e.g., "North Branch"
      warehouseCode: "BWH001",                       // e.g., "NB001"
      location: "Branch 1 address",                 // Branch location
      contactPerson: "Branch Manager 1",            // Branch manager
      phoneNumber: "+1234567891",
      email: "branch1@yourcompany.com",
      isCentralWarehouse: false,                     // Branch warehouse
    },
    {
      warehouseName: "YOUR_BRANCH_2_NAME",          // e.g., "South Branch"
      warehouseCode: "BWH002",                       // e.g., "SB001"
      location: "Branch 2 address",
      contactPerson: "Branch Manager 2",
      phoneNumber: "+1234567892",
      email: "branch2@yourcompany.com",
      isCentralWarehouse: false,
    },
    // Add more warehouses as needed...
  ];

  // ⚠️ SAFETY CHECK - Prevent running with placeholder data ⚠️
  const hasPlaceholders = warehouses.some(w => 
    w.warehouseName.includes("YOUR_") || 
    w.location.includes("Your ") ||
    w.contactPerson.includes("Manager Name")
  );

  if (hasPlaceholders) {
    console.log("❌ Please customize the warehouse information in this script first!");
    console.log("📝 Update the warehouse details above with your actual information:");
    console.log("   - Warehouse names and codes");
    console.log("   - Physical addresses");
    console.log("   - Contact person details");
    console.log("   - Email addresses and phone numbers");
    console.log("\n🔍 Look for 'YOUR_' placeholders and replace them.");
    return;
  }

  try {
    console.log(`Creating ${warehouses.length} warehouses...`);
    
    for (const warehouse of warehouses) {
      // Check if warehouse already exists
      const existing = await prisma.warehouse.findUnique({
        where: { warehouseName: warehouse.warehouseName }
      });

      if (existing) {
        console.log(`⚠️  Warehouse already exists: ${warehouse.warehouseName}`);
        continue;
      }

      // Create the warehouse
      const created = await prisma.warehouse.create({ data: warehouse });
      
      console.log(`✅ Created: ${warehouse.warehouseName} ${warehouse.isCentralWarehouse ? '(Central)' : '(Branch)'}`);
      console.log(`   📍 ${warehouse.location}`);
      console.log(`   👤 ${warehouse.contactPerson} - ${warehouse.phoneNumber}`);
    }

    // Verify central warehouse setup
    const centralWarehouses = await prisma.warehouse.findMany({
      where: { isCentralWarehouse: true }
    });

    if (centralWarehouses.length === 0) {
      console.log("⚠️  No central warehouse designated! Please set one warehouse as central.");
    } else if (centralWarehouses.length > 1) {
      console.log("⚠️  Multiple central warehouses found! Only one should be central.");
    } else {
      console.log(`🎯 Central warehouse: ${centralWarehouses[0].warehouseName}`);
    }

    console.log("\n🎉 Warehouse setup completed!");
    console.log("\n📋 Summary:");
    
    const allWarehouses = await prisma.warehouse.findMany({
      orderBy: [{ isCentralWarehouse: 'desc' }, { warehouseName: 'asc' }]
    });
    
    allWarehouses.forEach((w: { warehouseName: string; warehouseCode: string; isCentralWarehouse: boolean }) => {
      console.log(`   ${w.isCentralWarehouse ? '🏭' : '🏢'} ${w.warehouseName} (${w.warehouseCode})`);
    });

    console.log("\n📝 Next steps:");
    console.log("   1. Visit /dashboard/warehouse-transfer to see your warehouses");
    console.log("   2. Import your inventory data with your warehouse names");
    console.log("   3. Start receiving stock into your central warehouse");

  } catch (error: any) {
    console.error("❌ Error setting up warehouses:", error.message);
    
    if (error.code === 'P2002') {
      console.log("💡 This error usually means a warehouse name or code already exists.");
      console.log("   Check your warehouse names and codes for duplicates.");
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupRealWarehouses()
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });

/* 
📋 CUSTOMIZATION CHECKLIST:
[ ] Update warehouse names with your actual warehouse names
[ ] Set warehouse codes (usually 3-6 character abbreviations)
[ ] Add real physical addresses
[ ] Update contact person names
[ ] Add correct phone numbers
[ ] Set proper email addresses
[ ] Designate exactly ONE warehouse as central (isCentralWarehouse: true)
[ ] Add/remove warehouses as needed for your operation

🎯 EXAMPLE CUSTOMIZATION:
{
  warehouseName: "Main Distribution Center",
  warehouseCode: "MDC001", 
  location: "123 Industrial Boulevard, Chicago, IL 60601",
  contactPerson: "Sarah Johnson",
  phoneNumber: "+1-312-555-0123",
  email: "sarah.johnson@yourcompany.com",
  isCentralWarehouse: true,
}
*/
