-- Stock Quantity Reset Script
-- This script safely resets all stock quantities to zero while preserving audit trail

-- ==========================================
-- BACKUP REMINDER
-- ==========================================
-- IMPORTANT: Create a database backup before running this script!
-- mysqldump -u username -p inventory_db > backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

-- ==========================================
-- STEP 1: Create audit transactions first
-- ==========================================

-- Insert adjustment transactions for all items with non-zero qty (both positive and negative)
INSERT INTO StockTransaction (
    inventoryId, 
    transactionType, 
    quantity, 
    transactionDate, 
    referenceDoc, 
    reason, 
    processedBy
)
SELECT 
    i.id,
    'adjustment',
    -i.stockQty,  -- Negative of current quantity to bring to zero
    NOW(),
    CONCAT('RESET-', DATE_FORMAT(NOW(), '%Y-%m-%d')),
    CASE 
        WHEN i.stockQty > 0 THEN 'Stock quantity reset to zero - Positive stock adjustment'
        WHEN i.stockQty < 0 THEN 'Stock quantity reset to zero - Negative stock correction'
        ELSE 'Stock quantity reset to zero - Administrative adjustment'
    END,
    (SELECT id FROM User WHERE role = 'admin' LIMIT 1)  -- Use first admin user
FROM Inventory i 
WHERE i.stockQty != 0;

-- Check how many transactions were created
SELECT 
    COUNT(*) as transactions_created,
    SUM(ABS(quantity)) as total_quantity_reset
FROM StockTransaction 
WHERE referenceDoc LIKE 'RESET-%' 
AND DATE(transactionDate) = CURDATE();

-- ==========================================
-- STEP 2: Reset all quantities to zero
-- ==========================================

-- Show items that will be affected (for verification)
SELECT 
    COUNT(*) as items_to_reset,
    SUM(stockQty) as total_current_quantity,
    COUNT(CASE WHEN stockQty > 0 THEN 1 END) as positive_stock_items,
    COUNT(CASE WHEN stockQty < 0 THEN 1 END) as negative_stock_items,
    SUM(CASE WHEN stockQty > 0 THEN stockQty ELSE 0 END) as positive_stock_total,
    SUM(CASE WHEN stockQty < 0 THEN stockQty ELSE 0 END) as negative_stock_total
FROM Inventory 
WHERE stockQty != 0;

-- Reset all stock quantities to zero (both positive and negative)
UPDATE Inventory 
SET stockQty = 0 
WHERE stockQty != 0;

-- ==========================================
-- STEP 3: Verification queries
-- ==========================================

-- Verify reset completed
SELECT 
    COUNT(*) as items_with_non_zero_stock,
    SUM(stockQty) as total_remaining_stock,
    COUNT(CASE WHEN stockQty > 0 THEN 1 END) as items_with_positive_stock,
    COUNT(CASE WHEN stockQty < 0 THEN 1 END) as items_with_negative_stock
FROM Inventory 
WHERE stockQty != 0;

-- Show recent reset transactions
SELECT 
    st.transactionDate,
    st.transactionType,
    st.quantity,
    st.referenceDoc,
    i.itemName,
    i.barcode,
    i.warehouseName,
    u.username as processed_by
FROM StockTransaction st
JOIN Inventory i ON st.inventoryId = i.id
JOIN User u ON st.processedBy = u.id
WHERE st.referenceDoc LIKE 'RESET-%'
AND DATE(st.transactionDate) = CURDATE()
ORDER BY st.transactionDate DESC
LIMIT 10;

-- Summary report
SELECT 
    'Stock Reset Summary' as report_type,
    COUNT(*) as total_transactions,
    SUM(ABS(quantity)) as total_quantity_reset,
    MIN(transactionDate) as first_transaction,
    MAX(transactionDate) as last_transaction
FROM StockTransaction 
WHERE referenceDoc LIKE 'RESET-%' 
AND DATE(transactionDate) = CURDATE();

-- ==========================================
-- ROLLBACK SCRIPT (if needed)
-- ==========================================
-- If you need to rollback, you can restore quantities using the audit trail:
-- 
-- UPDATE Inventory i 
-- SET stockQty = (
--     SELECT ABS(st.quantity) 
--     FROM StockTransaction st 
--     WHERE st.inventoryId = i.id 
--     AND st.referenceDoc LIKE 'RESET-%' 
--     AND DATE(st.transactionDate) = CURDATE()
--     LIMIT 1
-- )
-- WHERE i.id IN (
--     SELECT DISTINCT inventoryId 
--     FROM StockTransaction 
--     WHERE referenceDoc LIKE 'RESET-%' 
--     AND DATE(transactionDate) = CURDATE()
-- );