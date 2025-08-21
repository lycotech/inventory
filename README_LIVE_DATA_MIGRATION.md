# Live Data Migration Guide

## 🚨 IMPORTANT: Read Before Proceeding

This guide helps you migrate your existing live inventory data to work with the new Central Warehouse Management System. **Always backup your data before proceeding.**

## 📋 Pre-Migration Checklist

- [ ] **Backup your database** (mysqldump or your preferred method)
- [ ] **Stop the application** to prevent data changes during migration
- [ ] **Document your current warehouse names** used in inventory
- [ ] **Plan your central warehouse designation**

## 🗄️ Step 1: Backup Your Current Data

### MySQL Backup
```bash
# Backup entire database
mysqldump -u your_username -p your_database_name > inventory_backup_$(date +%Y%m%d).sql

# Or backup specific tables
mysqldump -u your_username -p your_database_name Inventory StockTransaction AlertLog > inventory_tables_backup.sql
```

### Alternative: Export via Application
```bash
# Export your inventory data via the application
curl -H "Authorization: Bearer your_token" http://localhost:3000/api/backup/export > inventory_data_backup.json
```

## 🏭 Step 2: Clean Demo Data (If Present)

Run the cleanup script to remove any demo data:

```bash
cd c:\app\inventory
npx tsx scripts/cleanup-demo-data.ts
```

This removes:
- Demo inventory items (Laptop Dell XPS, Office Chair, etc.)
- Demo warehouses (Central Warehouse, Branch A, Branch B, Storage Depot)
- Demo transactions and alerts
- Sample stock aging records

## 🏢 Step 3: Set Up Your Real Warehouses

### Option A: Via Web Interface (Recommended)
1. Start the application: `npm run dev`
2. Login as admin
3. Go to `/dashboard/warehouse-transfer`
4. Create your warehouses using the form:
   - **Central Warehouse**: Your main receiving location
   - **Branch Warehouses**: Your other locations

### Option B: Via Database Script
Create a script `setup-real-warehouses.ts`:

```typescript
import { prisma } from "@/lib/prisma";

async function setupWarehouses() {
  // Replace with your actual warehouse information
  const warehouses = [
    {
      warehouseName: "Main Distribution Center",
      warehouseCode: "MDC001",
      location: "123 Main St, City, State",
      contactPerson: "Your Manager Name",
      phoneNumber: "+1234567890",
      email: "manager@yourcompany.com",
      isCentralWarehouse: true, // This is your central warehouse
    },
    {
      warehouseName: "North Branch",
      warehouseCode: "NB001",
      location: "456 North Ave, City, State", 
      contactPerson: "Branch Manager",
      phoneNumber: "+1234567891",
      email: "north@yourcompany.com",
      isCentralWarehouse: false,
    },
    // Add more warehouses as needed
  ];

  for (const warehouse of warehouses) {
    await prisma.warehouse.create({ data: warehouse });
    console.log(`Created: ${warehouse.warehouseName}`);
  }
}

setupWarehouses().catch(console.error);
```

Run it: `npx tsx setup-real-warehouses.ts`

## 📊 Step 4: Update Existing Inventory Data

### Check Current Warehouse Names
```sql
-- See all unique warehouse names in your inventory
SELECT DISTINCT warehouseName, COUNT(*) as item_count 
FROM Inventory 
GROUP BY warehouseName 
ORDER BY item_count DESC;
```

### Option A: Map Old Names to New Warehouses
```sql
-- Update inventory to use your new warehouse names
UPDATE Inventory 
SET warehouseName = 'Main Distribution Center' 
WHERE warehouseName IN ('Old Warehouse Name', 'Another Old Name');

UPDATE Inventory 
SET warehouseName = 'North Branch' 
WHERE warehouseName = 'Old Branch Name';
```

### Option B: Create Warehouses Matching Existing Names
If you want to keep your current warehouse names, create `Warehouse` records that match:

```typescript
// Get existing warehouse names from inventory
const existingNames = await prisma.inventory.findMany({
  distinct: ['warehouseName'],
  select: { warehouseName: true }
});

// Create warehouse records for each
for (const { warehouseName } of existingNames) {
  await prisma.warehouse.create({
    data: {
      warehouseName: warehouseName,
      warehouseCode: warehouseName.replace(/\s+/g, '').toUpperCase(),
      isCentralWarehouse: warehouseName === 'Your Central Warehouse Name', // Set one as central
    }
  });
}
```

## ⚙️ Step 5: Configure Central Warehouse Policy

### Set Central Warehouse
```sql
-- Make sure only one warehouse is marked as central
UPDATE Warehouse SET isCentralWarehouse = false;
UPDATE Warehouse SET isCentralWarehouse = true WHERE warehouseName = 'Your Central Warehouse Name';
```

### Test Central Warehouse Policy
Try receiving stock into a non-central warehouse - it should give you a helpful error message directing you to the central warehouse.

## 🔄 Step 6: Update Stock Transactions (Optional)

If you want warehouse transfer history, you can update existing transactions:

```sql
-- Add warehouse references to existing transfer transactions
-- This requires matching transaction data to warehouse IDs
UPDATE StockTransaction st
JOIN Warehouse wf ON wf.warehouseName = 'Source Warehouse Name'
JOIN Warehouse wt ON wt.warehouseName = 'Destination Warehouse Name'
SET 
  st.fromWarehouseId = wf.id,
  st.toWarehouseId = wt.id
WHERE st.transactionType = 'transfer';
```

## 📥 Step 7: Import New Data (If Needed)

### Prepare Your Import Files
Update your CSV/Excel files with new warehouse names:

```csv
# stock_receive.csv - All to central warehouse
barcode,warehouseName,quantity,referenceDoc,reason
ABC001,Main Distribution Center,50,GRN-001,Initial stock
DEF002,Main Distribution Center,25,GRN-002,Restock

# warehouse_transfer.csv - Distribute to branches
barcode,fromWarehouse,toWarehouse,quantity,referenceDoc,reason
ABC001,Main Distribution Center,North Branch,10,TRF-001,Branch stock
DEF002,Main Distribution Center,South Branch,5,TRF-002,Branch stock
```

### Import via Web Interface
1. Go to `/dashboard/import`
2. Select the appropriate template type
3. Upload your updated files

## ✅ Step 8: Verification & Testing

### Verify Data Integrity
```sql
-- Check all inventory has valid warehouses
SELECT i.*, w.warehouseName as warehouse_exists
FROM Inventory i
LEFT JOIN Warehouse w ON i.warehouseName = w.warehouseName
WHERE w.id IS NULL; -- Should return no rows

-- Check central warehouse is set
SELECT * FROM Warehouse WHERE isCentralWarehouse = true; -- Should return exactly 1 row

-- Check stock levels are correct
SELECT warehouseName, COUNT(*) as items, SUM(stockQty) as total_stock
FROM Inventory
GROUP BY warehouseName;
```

### Test Key Workflows
1. **Stock Receiving**: Try receiving into central warehouse ✅
2. **Stock Receiving**: Try receiving into branch warehouse (should error) ⚠️
3. **Warehouse Transfer**: Transfer stock between warehouses ✅
4. **Stock Issue**: Issue from any warehouse ✅

## 🚨 Rollback Plan (If Something Goes Wrong)

### Quick Rollback
```bash
# Restore from backup
mysql -u your_username -p your_database_name < inventory_backup_YYYYMMDD.sql
```

### Partial Rollback
```sql
-- Remove warehouse management if needed
DROP TABLE IF EXISTS Warehouse;
ALTER TABLE StockTransaction DROP COLUMN fromWarehouseId;
ALTER TABLE StockTransaction DROP COLUMN toWarehouseId;
-- Restore schema to previous state
```

## 📊 Common Migration Scenarios

### Scenario 1: Single Warehouse → Multi-Warehouse
```sql
-- If you currently have one warehouse called "Main"
UPDATE Warehouse SET isCentralWarehouse = true WHERE warehouseName = 'Main';

-- Create additional warehouses for different locations
INSERT INTO Warehouse (warehouseName, warehouseCode, isCentralWarehouse) VALUES
('Branch Office', 'BO001', false),
('Storage Facility', 'SF001', false);
```

### Scenario 2: Multiple Warehouses → Central Model
```sql
-- Designate your largest/main warehouse as central
UPDATE Warehouse SET isCentralWarehouse = true WHERE warehouseName = 'Your Main Warehouse';
UPDATE Warehouse SET isCentralWarehouse = false WHERE warehouseName != 'Your Main Warehouse';
```

### Scenario 3: Warehouse Name Changes
```sql
-- Update inventory and warehouse names consistently
UPDATE Warehouse SET warehouseName = 'New Warehouse Name' WHERE warehouseName = 'Old Name';
UPDATE Inventory SET warehouseName = 'New Warehouse Name' WHERE warehouseName = 'Old Name';
```

## 📞 Support & Troubleshooting

### Common Issues

**Error: "Warehouse not found"**
- Ensure `Warehouse` records exist for all warehouse names in `Inventory`
- Check spelling and case sensitivity

**Error: "Multiple central warehouses"**
- Run: `UPDATE Warehouse SET isCentralWarehouse = false; UPDATE Warehouse SET isCentralWarehouse = true WHERE id = YOUR_CENTRAL_ID;`

**Central warehouse policy not working**
- Verify exactly one warehouse has `isCentralWarehouse = true`
- Check API endpoint is using updated code

### Data Validation Queries
```sql
-- Find orphaned inventory (no matching warehouse)
SELECT DISTINCT i.warehouseName 
FROM Inventory i 
LEFT JOIN Warehouse w ON i.warehouseName = w.warehouseName 
WHERE w.id IS NULL;

-- Check for duplicate central warehouses
SELECT COUNT(*) as central_count FROM Warehouse WHERE isCentralWarehouse = true;

-- Verify stock totals
SELECT 
  w.warehouseName,
  w.isCentralWarehouse,
  COUNT(i.id) as total_items,
  SUM(i.stockQty) as total_stock,
  AVG(i.stockQty) as avg_stock
FROM Warehouse w
LEFT JOIN Inventory i ON w.warehouseName = i.warehouseName
GROUP BY w.id, w.warehouseName, w.isCentralWarehouse;
```

## 🎯 Final Steps

1. **Start the application**: `npm run dev`
2. **Test all functionality**
3. **Update documentation** with your warehouse names
4. **Train users** on the new workflow
5. **Monitor for the first few days**

## 📚 Best Practices After Migration

1. **Always receive new stock into central warehouse first**
2. **Use warehouse transfers to distribute to branches**
3. **Regular stock level monitoring across warehouses**
4. **Maintain proper reference documentation for transfers**
5. **Regular backups of the updated system**

---

**✅ Migration Complete!** Your inventory system now supports proper warehouse management with central warehouse controls and full audit trails.
