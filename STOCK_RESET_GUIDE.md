# Stock Quantity Reset Guide

This guide provides multiple safe methods to reset all stock item quantities to zero without affecting other database tables.

## ⚠️ IMPORTANT SAFETY NOTES

1. **ALWAYS CREATE A BACKUP** before running any reset operation:
   ```bash
   mysqldump -u username -p inventory_db > backup_before_reset_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **All methods preserve audit trail** by creating StockTransaction records

3. **No other tables are affected** - only Inventory.stockQty is modified

4. **Admin access required** for all operations

---

## Method 1: TypeScript Script (RECOMMENDED)

**File:** `scripts/reset-stock-quantities.ts`

**Pros:**
- Full audit trail with transaction records
- Detailed logging and verification
- Safest option with built-in checks

**Usage:**
```bash
# Navigate to your application directory
cd C:\path\to\your\inventory\application

# Run the script
npx ts-node scripts/reset-stock-quantities.ts
```

**What it does:**
1. Finds all items with non-zero stockQty (both positive and negative)
2. Creates "adjustment" transactions for each item with appropriate reasons
3. Updates stockQty to 0 for all items
4. Provides detailed summary and verification with stock breakdown

---

## Method 2: SQL Script (FASTEST)

**File:** `scripts/reset-stock-quantities.sql`

**Pros:**
- Direct database access
- Fastest execution
- Good for large databases

**Usage:**
```bash
# Connect to MySQL
mysql -u username -p inventory_db

# Run the script
source scripts/reset-stock-quantities.sql

# Or execute directly
mysql -u username -p inventory_db < scripts/reset-stock-quantities.sql
```

**What it does:**
1. Creates audit transactions for both positive and negative stock
2. Resets all quantities to zero (handles positive and negative values)  
3. Provides detailed verification queries with stock breakdown
4. Includes rollback instructions

---

## Method 3: API Endpoint

**File:** `app/api/admin/reset-stock/route.ts`

**Pros:**
- Web-based access
- Built-in authentication
- Can be integrated into admin UI

**Usage via curl:**
```bash
# Get current summary
curl -X GET "http://localhost:3000/api/admin/reset-stock" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Reset stock (requires confirmation)
curl -X POST "http://localhost:3000/api/admin/reset-stock" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "confirm": "RESET_ALL_STOCK",
    "reason": "Annual inventory reset"
  }'
```

**What it does:**
1. Validates admin authentication and permissions
2. Creates audit transactions for both positive and negative stock
3. Resets all quantities to zero using database transactions
4. Returns detailed response with stock breakdown and verification data

---

## Method 4: UI Component

**File:** `components/admin/stock-reset.tsx`

**Pros:**
- User-friendly interface
- Built-in confirmation steps
- Real-time summary display

**Integration:**
Add to your admin dashboard:
```tsx
import StockResetComponent from '@/components/admin/stock-reset';

// In your admin page
<StockResetComponent 
  onResetComplete={(result) => {
    console.log('Reset completed:', result);
    // Handle completion
  }} 
/>
```

---

## Database Impact Analysis

### Tables Modified:
✅ **Inventory** - `stockQty` field reset to 0

### Tables with New Records:
✅ **StockTransaction** - Audit records created

### Tables NOT Affected:
❌ **User** - No changes
❌ **Warehouse** - No changes  
❌ **AlertLog** - No changes
❌ **ImportHistory** - No changes
❌ **Batch** - No changes
❌ **StockAging** - No changes
❌ **Report** - No changes

---

## Verification Queries

After reset, verify with these queries:

```sql
-- Check items still with non-zero stock (should be 0)
SELECT 
    COUNT(*) as items_with_non_zero_stock,
    COUNT(CASE WHEN stockQty > 0 THEN 1 END) as items_with_positive_stock,
    COUNT(CASE WHEN stockQty < 0 THEN 1 END) as items_with_negative_stock
FROM Inventory 
WHERE stockQty != 0;

-- Verify audit trail created
SELECT COUNT(*) as reset_transactions 
FROM StockTransaction 
WHERE referenceDoc LIKE 'RESET-%' 
AND DATE(transactionDate) = CURDATE();

-- Sample of reset transactions
SELECT 
    st.transactionDate,
    i.itemName,
    i.barcode,
    st.quantity,
    st.reason
FROM StockTransaction st
JOIN Inventory i ON st.inventoryId = i.id
WHERE st.referenceDoc LIKE 'RESET-%'
AND DATE(st.transactionDate) = CURDATE()
LIMIT 5;
```

---

## Rollback Procedure

If you need to restore quantities:

```sql
-- Restore quantities from audit trail
UPDATE Inventory i 
SET stockQty = (
    SELECT ABS(st.quantity) 
    FROM StockTransaction st 
    WHERE st.inventoryId = i.id 
    AND st.referenceDoc LIKE 'RESET-%' 
    AND DATE(st.transactionDate) = CURDATE()
    LIMIT 1
)
WHERE i.id IN (
    SELECT DISTINCT inventoryId 
    FROM StockTransaction 
    WHERE referenceDoc LIKE 'RESET-%' 
    AND DATE(transactionDate) = CURDATE()
);
```

---

## Key Features

- ✅ **Handles Both Stock Types:** All methods now reset both positive and negative stock quantities
- ✅ **Comprehensive Audit Trail:** Separate transaction records for positive vs negative adjustments  
- ✅ **Detailed Reporting:** Enhanced verification queries show breakdown of stock types
- ✅ **Safe Operations:** All methods preserve data integrity and provide rollback capabilities

## Recommendations

1. **For Production:** Use Method 1 (TypeScript script) for safety
2. **For Development:** Use Method 3 (API) for testing
3. **For Large Datasets:** Use Method 2 (SQL script) for speed
4. **For End Users:** Use Method 4 (UI component) for ease of use

## Support

If you encounter issues:
1. Check database connections
2. Verify admin user permissions
3. Review error logs
4. Ensure backup exists before retry