# Warehouse Management System

## Overview

The inventory system now supports a **Central Warehouse** model with warehouse-to-warehouse transfers. This ensures proper stock control and distribution tracking.

## Central Warehouse Policy

### Concept
- **Central Warehouse**: A designated main warehouse where all new stock is initially received
- **Branch Warehouses**: Secondary locations that receive stock through transfers from the central warehouse
- **Stock Flow**: New stock → Central Warehouse → Transfer → Branch Warehouses

### Benefits
- **Centralized Control**: All incoming stock passes through a single point of control
- **Better Tracking**: Clear audit trail of stock movements between locations
- **Distribution Management**: Controlled distribution to branch locations based on demand
- **Inventory Accuracy**: Reduces discrepancies by having a single receiving point

## Warehouse Features

### 1. Warehouse Setup
- **Central Warehouse**: One warehouse marked as `isCentralWarehouse: true`
- **Branch Warehouses**: Multiple warehouses for different locations
- **Warehouse Details**: Name, code, location, contact information

### 2. Stock Receiving Policy
- New stock **must** be received into the Central Warehouse first
- Attempting to receive directly into branch warehouses will show an error
- Admin can override this policy if needed using `allowNonCentral: true`

### 3. Warehouse Transfers
- Transfer stock from any warehouse to any other warehouse
- Supports partial transfers
- Automatic inventory adjustment at both source and destination
- Full audit trail with transaction records

## API Endpoints

### Warehouse Management
- `GET /api/warehouses/manage` - List all warehouses
- `POST /api/warehouses/manage` - Create new warehouse

### Stock Operations
- `POST /api/inventory/receive` - Receive stock (Central Warehouse policy enforced)
- `POST /api/inventory/issue` - Issue stock from any warehouse
- `POST /api/inventory/transfer` - Transfer stock between warehouses

### Import Templates
- `warehouse_transfer` - New template for bulk warehouse transfers
- Updated existing templates with central warehouse examples

## Database Schema Changes

### New `Warehouse` Table
```sql
Warehouse {
  id              Int      @id @default(autoincrement())
  warehouseName   String   @unique
  warehouseCode   String   @unique
  location        String?
  contactPerson   String?
  phoneNumber     String?
  email           String?
  isCentralWarehouse Boolean @default(false)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Updated `StockTransaction` Table
```sql
StockTransaction {
  // ... existing fields
  fromWarehouseId  Int?        // For transfers
  toWarehouseId    Int?        // For transfers
  fromWarehouse    Warehouse?  @relation("TransferFromWarehouse")
  toWarehouse      Warehouse?  @relation("TransferToWarehouse")
}
```

### New Transaction Type
- Added `transfer` to `TransactionType` enum
- Added `warehouse_transfer` to `ImportType` enum

## Usage Examples

### 1. Setting Up Warehouses
```typescript
// Create Central Warehouse
POST /api/warehouses/manage
{
  "warehouseName": "Central Warehouse",
  "warehouseCode": "CWH001",
  "location": "Main Distribution Center",
  "isCentralWarehouse": true
}

// Create Branch Warehouse
POST /api/warehouses/manage
{
  "warehouseName": "Branch A",
  "warehouseCode": "BWH001", 
  "location": "North Branch",
  "isCentralWarehouse": false
}
```

### 2. Stock Operations
```typescript
// Receive stock (must be to Central Warehouse)
POST /api/inventory/receive
{
  "barcode": "LAP001",
  "warehouseName": "Central Warehouse",
  "quantity": 50,
  "referenceDoc": "GRN-001"
}

// Transfer to branch
POST /api/inventory/transfer
{
  "barcode": "LAP001",
  "fromWarehouse": "Central Warehouse",
  "toWarehouse": "Branch A",
  "quantity": 10,
  "referenceDoc": "TRF-001"
}
```

### 3. Import Templates

**Warehouse Transfer Template** (`warehouse_transfer.csv`):
```csv
barcode,fromWarehouse,toWarehouse,quantity,referenceDoc,reason
LAP001,Central Warehouse,Branch A,10,TRF-001,Initial branch stock
USB001,Central Warehouse,Branch B,25,TRF-002,Branch restocking
```

**Updated Stock Receive Template**:
```csv
barcode,warehouseName,quantity,referenceDoc,reason
LAP001,Central Warehouse,50,GRN-001,New stock to central warehouse
```

## User Interface

### Warehouse Transfer Page (`/dashboard/warehouse-transfer`)
- **Transfer Form**: Select source/destination warehouses, item, and quantity
- **Warehouse List**: View all configured warehouses with their status
- **Central Warehouse Indicator**: Clear marking of which warehouse is central
- **Policy Information**: Built-in guidance about central warehouse policy

### Navigation
- Added "Warehouse Transfer" under Inventory section in sidebar
- Integrated with existing inventory management workflow

### Import Page Updates
- Added `warehouse_transfer` option to import types
- New template download link for warehouse transfers

## Migration Guide

### For Existing Installations
1. Run the database migration: `npx prisma migrate deploy`
2. Set up warehouses using the management API or run the seed script
3. Designate one warehouse as central: Update `isCentralWarehouse = true`
4. Update any existing stock receiving processes to use central warehouse
5. Train users on the new warehouse transfer workflow

### Seed Data
The seed script now creates:
- **Central Warehouse**: Main distribution center
- **Branch Warehouses**: Branch A, Branch B, Storage Depot
- **Sample Inventory**: Distributed across warehouses showing the new structure

## Benefits for Your Operation

1. **Compliance**: Ensures all stock follows proper receiving procedures
2. **Visibility**: Clear tracking of stock movements between locations
3. **Control**: Prevents unauthorized direct receiving into branch locations
4. **Efficiency**: Streamlined transfer process with bulk import capability
5. **Reporting**: Enhanced audit trail for stock movements and distribution

## Best Practices

1. **Stock Flow**: Always receive → central warehouse → transfer to branches
2. **Documentation**: Use reference documents for all transfers
3. **Batch Transfers**: Use import templates for multiple transfers
4. **Regular Reviews**: Monitor stock levels across all warehouses
5. **Access Control**: Limit direct branch receiving to authorized personnel only

This warehouse management system provides the foundation for proper inventory control across multiple locations while maintaining flexibility for your specific operational needs.
