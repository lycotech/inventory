# Manual Inventory Entry - Add New Item Feature

## Overview

The Manual Inventory Entry feature allows users to manually create new inventory items directly in the system. This is perfect for items that cannot be bulk imported or when immediate addition of new items is required.

## Features

### 🎯 **Core Functionality**
- **Manual Item Creation**: Add new inventory items with standard database fields
- **Excel Template Consistency**: Form fields match exactly with bulk import Excel template
- **Barcode Management**: Generate unique barcodes or enter existing ones with validation
- **Warehouse Integration**: Select from existing warehouses with location information
- **Real-time Validation**: Check for barcode duplicates as you type
- **Initial Stock Setup**: Set initial stock quantity with automatic transaction creation
- **Optional Batch Tracking**: Enable batch tracking for items requiring lot management

### 📋 **Form Fields**

#### Required Fields (*)
- **Barcode**: Unique identifier for the item (can be generated automatically)
- **Item Name**: Product name/description  
- **Category**: Product category (loaded from database + option to add new)
- **Warehouse**: Target warehouse for the item

#### Basic Information
- **Search Code**: Custom search identifier (optional, auto-generated if empty)
- **Initial Stock Quantity**: Starting inventory count
- **Stock Alert Level**: Minimum stock threshold for alerts
- **Expiry Date**: Product expiration date (optional)
- **Expiry Alert**: Days before expiry to trigger alerts

#### Batch Information (Optional)
*Enable batch tracking checkbox to show these fields*
- **Batch Number**: Unique batch identifier
- **Manufacture Date**: When the batch was manufactured
- **Supplier Information**: Vendor/supplier details
- **Lot Number**: Manufacturing lot number
- **Cost Per Unit**: Purchase cost per unit for this batch

> **Note**: These fields match exactly with the Excel import template to ensure consistency between manual entry and bulk import processes.

## Access Methods

### 1. **Full Form (Dedicated Page)**
- Dedicated page at `/dashboard/inventory/add`
- Complete form experience with full screen real estate
- Accessible from the main inventory dashboard card
- Better for detailed item entry with extensive information

### 2. **Header Button**
- "Add New Item" button in the main inventory page header
- Quick access from any inventory page

## User Experience

### ✨ **Smart Features**
- **Auto-generated Barcodes**: Click "Generate" to create unique barcodes
- **Real-time Validation**: Instant feedback on barcode availability
- **Dynamic Categories**: Load existing categories from database + add new ones
- **Warehouse Dropdown**: Dynamic loading of available warehouses
- **Custom Category Creation**: Add new categories on-the-fly if not in existing list
- **Success Feedback**: Clear confirmation when items are created

### 🔒 **Validation & Security**
- **Duplicate Prevention**: Prevents duplicate barcodes within the same warehouse
- **Required Field Validation**: Ensures all essential information is provided
- **Session Validation**: Requires valid user session for security
- **Input Sanitization**: Protects against malicious input

## Technical Implementation

### API Endpoints

#### POST `/api/inventory/create`
Creates a new inventory item with validation and transaction logging.

**Request Body:**
```json
{
  "barcode": "ITM123456789",
  "category": "Electronics",
  "itemName": "Sample Product",
  "searchCode": "SAMPLE001",
  "warehouseName": "Main Warehouse",
  "stockQty": "100",
  "stockAlertLevel": "10",
  "expireDate": "2025-12-31",
  "expireDateAlert": "30",
  // Optional batch fields
  "batchNumber": "BATCH001",
  "manufactureDate": "2025-01-01",
  "supplierInfo": "ABC Supplier",
  "lotNumber": "LOT001",
  "costPerUnit": "15.50"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "item": {
    "id": 123,
    "barcode": "ITM123456789",
    "itemName": "Sample Product",
    // ... item details
  }
}
```

#### GET `/api/inventory/create`
Checks if a barcode already exists in a specific warehouse.

**Query Parameters:**
- `barcode`: The barcode to check
- `warehouse`: The warehouse name

**Response:**
```json
{
  "exists": false,
  "message": "Barcode available"
}
```

### Database Operations

1. **Duplicate Check**: Verifies barcode uniqueness within warehouse
2. **Warehouse Validation**: Confirms warehouse exists and is active
3. **Item Creation**: Inserts new inventory record
4. **Transaction Logging**: Creates initial stock transaction if quantity > 0
5. **Audit Trail**: Logs creation details for tracking

## Error Handling

### Common Validation Errors
- **Duplicate Barcode**: "Barcode already exists in this warehouse"
- **Invalid Warehouse**: "Selected warehouse does not exist"
- **Missing Required Fields**: Field-specific error messages
- **Invalid Dates**: "Expiry date must be in the future"

### System Errors
- **Database Connection**: "Unable to connect to database"
- **Permission Denied**: "Insufficient permissions to create items"
- **Server Error**: "Internal server error occurred"

## Best Practices

### 📝 **Data Entry**
1. **Use Descriptive Names**: Clear, searchable item names
2. **Consistent Categories**: Stick to predefined categories
3. **Complete Information**: Fill as many fields as possible for better tracking
4. **Verify Barcodes**: Double-check barcodes for accuracy

### 🏗️ **Workflow Integration**
1. **Initial Setup**: Add new items before receiving stock
2. **Immediate Use**: Create items for immediate stock movements
3. **Catalog Building**: Build comprehensive product catalog
4. **Emergency Additions**: Quick addition for urgent inventory needs

## User Permissions

- **Admin**: Full access to all features
- **Manager**: Full access to all features
- **Staff**: Limited access (if configured)

## Integration Points

### Related Features
- **Stock Management**: Newly created items appear in stock lists
- **Transaction History**: Initial stock entries create transaction records
- **Alerts System**: Alert levels are immediately active
- **Reports**: New items included in all relevant reports
- **Batch Management**: Compatible with batch tracking if enabled

### Warehouse Management
- **Multi-warehouse Support**: Items can be created for any active warehouse
- **Location Tracking**: Specific location within warehouse storage
- **Transfer Ready**: Items immediately available for warehouse transfers

## Troubleshooting

### Common Issues

**Problem**: "Barcode already exists" error
**Solution**: Check if item already exists or use barcode generator

**Problem**: Warehouse not appearing in dropdown
**Solution**: Verify warehouse is active and user has access

**Problem**: Form submission fails
**Solution**: Check all required fields are completed

**Problem**: Modal not opening
**Solution**: Refresh page and try again

### Support Information
- Check browser console for detailed error messages
- Ensure stable internet connection
- Verify user session is active
- Contact system administrator for permission issues

## Future Enhancements

### Planned Features
- **Bulk Item Creation**: Import multiple items from CSV
- **Photo Upload**: Add product images
- **QR Code Generation**: Alternative to barcodes
- **Custom Fields**: Configurable additional fields
- **Template System**: Save common item templates
- **Price History**: Track price changes over time

---

*Last Updated: [Current Date]*
*Version: 1.0*