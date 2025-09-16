'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Batch {
  id: number;
  batchNumber: string;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate: string;
  manufactureDate?: string;
  supplierInfo?: string;
  lotNumber?: string;
  costPerUnit?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  inventory: {
    itemName: string;
    barcode: string;
    category: string;
  };
  warehouse: {
    warehouseName: string;
    warehouseCode: string;
  };
  creator: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

interface InventoryItem {
  id: number;
  itemName: string;
  barcode: string;
  category: string;
}

interface Warehouse {
  id: number;
  warehouseName: string;
  warehouseCode: string;
  location?: string;
}

interface BatchFormData {
  batchNumber: string;
  barcode: string;
  inventoryId: string;
  warehouseId: string;
  quantityReceived: string;
  manufactureDate: string;
  expiryDate: string;
  expireDateAlert: string;
  supplierInfo: string;
  lotNumber: string;
  costPerUnit: string;
  notes: string;
}

export default function BatchManagementPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<BatchFormData>({
    batchNumber: '',
    barcode: '',
    inventoryId: '',
    warehouseId: '',
    quantityReceived: '',
    manufactureDate: '',
    expiryDate: '',
    expireDateAlert: '30',
    supplierInfo: '',
    lotNumber: '',
    costPerUnit: '',
    notes: ''
  });

  // Warehouse availability check state
  const [warehouseAlert, setWarehouseAlert] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  }>({ show: false, message: '', type: 'success' });

  // Selected item details state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    warehouseId: '',
    expiringDays: '',
    expired: false,
    activeOnly: true
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBatches();
    fetchInventoryItems();
    fetchWarehouses();
  }, [filters, currentPage]);

  // Search for item when barcode changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.barcode) {
        searchItemByBarcode(formData.barcode);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.barcode]);

  // Check warehouse availability when both item and warehouse are selected
  useEffect(() => {
    if (formData.inventoryId && formData.warehouseId) {
      checkWarehouseAvailability();
    } else {
      setWarehouseAlert({ show: false, message: '', type: 'success' });
    }
  }, [formData.inventoryId, formData.warehouseId]);

  const checkWarehouseAvailability = async () => {
    if (!formData.inventoryId || !formData.warehouseId) return;

    try {
      const response = await fetch(
        `/api/inventory/check-warehouse?inventoryId=${formData.inventoryId}&warehouseId=${formData.warehouseId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWarehouseAlert({
          show: true,
          message: data.message,
          type: data.exists ? 'success' : 'warning'
        });
      } else {
        setWarehouseAlert({
          show: true,
          message: 'Unable to verify item availability in warehouse',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error checking warehouse availability:', error);
      setWarehouseAlert({
        show: true,
        message: 'Error checking warehouse availability',
        type: 'error'
      });
    }
  };

  const searchItemByBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      setSelectedItem(null);
      setFormData({ ...formData, inventoryId: '' });
      return;
    }

    setBarcodeLoading(true);
    try {
      // Use the inventory list API with barcode search
      const response = await fetch(`/api/inventory/list?q=${encodeURIComponent(barcode)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.rows && data.rows.length > 0) {
          // Find exact barcode match first, then fall back to partial match
          let matchedItem = data.rows.find((item: any) => item.barcode === barcode);
          if (!matchedItem) {
            matchedItem = data.rows[0]; // Take the first match if no exact match
          }
          
          const item: InventoryItem = {
            id: matchedItem.id,
            itemName: matchedItem.itemName,
            barcode: matchedItem.barcode,
            category: matchedItem.category || matchedItem.warehouse || ''
          };
          setSelectedItem(item);
          setFormData({ ...formData, inventoryId: matchedItem.id.toString() });
        } else {
          setSelectedItem(null);
          setFormData({ ...formData, inventoryId: '' });
        }
      } else {
        setSelectedItem(null);
        setFormData({ ...formData, inventoryId: '' });
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      setSelectedItem(null);
      setFormData({ ...formData, inventoryId: '' });
    } finally {
      setBarcodeLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        ...(filters.expiringDays && { expiringDays: filters.expiringDays }),
        ...(filters.expired && { expired: 'true' }),
        activeOnly: filters.activeOnly.toString()
      });

      const response = await fetch(`/api/batches?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory/list?limit=1000');
      if (response.ok) {
        const data = await response.json();
        // Map the API response to match our expected interface
        const rawItems = Array.isArray(data.rows) ? data.rows : [];
        const items = rawItems.map((item: any) => ({
          id: Number(item.id) || String(item.id), // Ensure ID is primitive
          itemName: String(item.itemName),
          barcode: String(item.barcode),
          category: String(item.warehouse || item.category || '') // Using warehouse as category for now
        })).filter((item: any) => item.id && item.itemName); // Filter out invalid items
        
        // Remove duplicates based on ID
        const uniqueItems = items.filter((item: any, index: number, arr: any[]) => 
          arr.findIndex((i: any) => i.id === item.id) === index
        );
        setInventoryItems(uniqueItems);
      } else {
        console.error('Failed to fetch inventory items:', response.status);
        setInventoryItems([]); // Set empty array on API error
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setInventoryItems([]); // Set empty array on error
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses/list');
      if (response.ok) {
        const data = await response.json();
        const warehouseList = Array.isArray(data.warehouses) ? data.warehouses : [];
        // Ensure each warehouse has the expected structure
        const validWarehouses = warehouseList.filter((w: any) => w && typeof w === 'object' && w.id && w.warehouseName)
          .map((w: any) => ({
            id: Number(w.id) || String(w.id), // Ensure ID is primitive
            warehouseName: String(w.warehouseName),
            warehouseCode: String(w.warehouseCode || ''),
            location: String(w.location || '')
          }));
        
        // Remove duplicates based on ID
        const uniqueWarehouses = validWarehouses.filter((warehouse: any, index: number, arr: any[]) => 
          arr.findIndex((w: any) => w.id === warehouse.id) === index
        );
        setWarehouses(uniqueWarehouses);
      } else {
        console.error('Failed to fetch warehouses:', response.status);
        setWarehouses([]); // Set empty array on API error
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setWarehouses([]); // Set empty array on error
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          inventoryId: parseInt(formData.inventoryId),
          warehouseId: parseInt(formData.warehouseId),
          quantityReceived: parseInt(formData.quantityReceived),
          expireDateAlert: parseInt(formData.expireDateAlert) || 30,
          costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          batchNumber: '',
          barcode: '',
          inventoryId: '',
          warehouseId: '',
          quantityReceived: '',
          manufactureDate: '',
          expiryDate: '',
          expireDateAlert: '30',
          supplierInfo: '',
          lotNumber: '',
          costPerUnit: '',
          notes: ''
        });
        setWarehouseAlert({ show: false, message: '', type: 'success' });
        setSelectedItem(null);
        fetchBatches();
        alert('Batch created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating batch: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error creating batch');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExpiryStatus = (batch: Batch) => {
    const today = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: 'text-red-600 bg-red-50', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'Expires Soon', color: 'text-orange-600 bg-orange-50', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'Expiring', color: 'text-yellow-600 bg-yellow-50', days: daysUntilExpiry };
    } else {
      return { status: 'Good', color: 'text-green-600 bg-green-50', days: daysUntilExpiry };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading batches...</div>
      </div>
    );
  }

  // Additional safety check - don't render if critical data is missing
  if (!Array.isArray(warehouses) || !Array.isArray(inventoryItems)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading data. Please refresh the page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Management Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Batch Management</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          Create New Batch
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse</label>
          <select
            value={filters.warehouseId}
            onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">All Warehouses</option>
            {Array.isArray(warehouses) && warehouses.map((warehouse, index) => {
              const keyValue = warehouse?.id ? `warehouse-${warehouse.id}` : `warehouse-fallback-${index}`;
              return (
                <option key={keyValue} value={warehouse.id}>
                  {warehouse.warehouseName}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expiring Within (Days)</label>
          <Input
            type="number"
            placeholder="e.g., 30"
            value={filters.expiringDays}
            onChange={(e) => setFilters({ ...filters, expiringDays: e.target.value })}
          />
        </div>
        <div className="flex items-center space-x-4 pt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.expired}
              onChange={(e) => setFilters({ ...filters, expired: e.target.checked })}
              className="mr-2"
            />
            Include Expired
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
              className="mr-2"
            />
            Active Only
          </label>
        </div>
      </div>

      {/* Create Batch Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New Batch</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setWarehouseAlert({ show: false, message: '', type: 'success' });
                  setSelectedItem(null);
                  setFormData({
                    batchNumber: '',
                    barcode: '',
                    inventoryId: '',
                    warehouseId: '',
                    quantityReceived: '',
                    manufactureDate: '',
                    expiryDate: '',
                    expireDateAlert: '30',
                    supplierInfo: '',
                    lotNumber: '',
                    costPerUnit: '',
                    notes: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleCreateBatch} id="batch-form" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Batch Number*</label>
                    <Input
                      required
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="e.g., BATCH001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Item Barcode*</label>
                    <Input
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Scan or enter barcode"
                      className="w-full"
                    />
                    
                    {/* Loading indicator */}
                    {barcodeLoading && (
                      <div className="mt-2 text-sm text-gray-500 flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching for item...
                      </div>
                    )}
                    
                    {/* Selected item display */}
                    {selectedItem && !barcodeLoading && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">✅</span>
                          <div>
                            <p className="text-sm font-medium text-green-800">{selectedItem.itemName}</p>
                            <p className="text-xs text-green-600">Barcode: {selectedItem.barcode} | Category: {selectedItem.category}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* No item found */}
                    {formData.barcode && !selectedItem && !barcodeLoading && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <span className="text-red-600 mr-2">❌</span>
                          <p className="text-sm text-red-800">No item found with barcode: {formData.barcode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Warehouse*</label>
                    <select
                      required
                      value={formData.warehouseId}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Warehouse</option>
                      {Array.isArray(warehouses) && warehouses.map((warehouse, index) => {
                        const keyValue = warehouse?.id ? `create-warehouse-${warehouse.id}` : `create-warehouse-fallback-${index}`;
                        return (
                          <option key={keyValue} value={warehouse.id}>
                            {warehouse.warehouseName}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Warehouse Availability Alert */}
                    {warehouseAlert.show && (
                      <div className={`mt-2 p-3 rounded-md text-sm ${
                        warehouseAlert.type === 'success' 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : warehouseAlert.type === 'warning'
                          ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        <div className="flex items-start">
                          <span className={`mr-2 ${
                            warehouseAlert.type === 'success' ? '✅' 
                            : warehouseAlert.type === 'warning' ? '⚠️' 
                            : '❌'
                          }`}>
                          </span>
                          <span>{warehouseAlert.message}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity Received*</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={formData.quantityReceived}
                      onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Manufacture Date</label>
                    <Input
                      type="date"
                      value={formData.manufactureDate}
                      onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date*</label>
                    <Input
                      required
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Alert Days</label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.expireDateAlert}
                      onChange={(e) => setFormData({ ...formData, expireDateAlert: e.target.value })}
                      placeholder="e.g., 30"
                    />
                    <p className="text-xs text-gray-500 mt-1">Days before expiry to trigger alerts</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier Info</label>
                    <Input
                      value={formData.supplierInfo}
                      onChange={(e) => setFormData({ ...formData, supplierInfo: e.target.value })}
                      placeholder="Supplier name or info"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lot Number</label>
                    <Input
                      value={formData.lotNumber}
                      onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                      placeholder="Lot/batch identifier"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cost Per Unit</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Additional notes or comments"
                  />
                </div>
              </form>
            </div>
            
            {/* Modal Footer - Fixed at bottom */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setWarehouseAlert({ show: false, message: '', type: 'success' });
                  setSelectedItem(null);
                  setFormData({
                    batchNumber: '',
                    barcode: '',
                    inventoryId: '',
                    warehouseId: '',
                    quantityReceived: '',
                    manufactureDate: '',
                    expiryDate: '',
                    expireDateAlert: '30',
                    supplierInfo: '',
                    lotNumber: '',
                    costPerUnit: '',
                    notes: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" form="batch-form">
                Create Batch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(batches) && batches.map((batch, index) => {
                const expiryStatus = getExpiryStatus(batch);
                const keyValue = batch?.id ? `batch-${batch.id}` : `batch-fallback-${index}`;
                return (
                  <tr key={keyValue} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.batchNumber}
                        </div>
                        {batch.lotNumber && (
                          <div className="text-sm text-gray-500">
                            Lot: {batch.lotNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.inventory.itemName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {batch.inventory.barcode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {batch.warehouse.warehouseName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {batch.quantityRemaining} / {batch.quantityReceived}
                        </div>
                        <div className="text-sm text-gray-500">
                          Available / Received
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.color}`}>
                        {expiryStatus.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {expiryStatus.status === 'Expired' 
                          ? `${expiryStatus.days} days ago`
                          : `${expiryStatus.days} days left`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(batch.expiryDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(batch.createdAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {batch.creator.firstName} {batch.creator.lastName}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {batches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No batches found. Create your first batch to get started.
        </div>
      )}
    </div>
  );
}