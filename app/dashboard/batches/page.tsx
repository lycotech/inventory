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

interface EditBatchFormProps {
  batch: Batch;
  onSave: (data: any) => void;
  onCancel: () => void;
  updating: boolean;
  inventoryItems: InventoryItem[];
  warehouses: Warehouse[];
}

function EditBatchForm({ batch, onSave, onCancel, updating, inventoryItems, warehouses }: EditBatchFormProps) {
  const [editFormData, setEditFormData] = useState({
    batchNumber: batch.batchNumber,
    quantityReceived: batch.quantityReceived.toString(),
    quantityRemaining: batch.quantityRemaining.toString(),
    manufactureDate: batch.manufactureDate ? new Date(batch.manufactureDate).toISOString().split('T')[0] : '',
    expiryDate: new Date(batch.expiryDate).toISOString().split('T')[0],
    supplierInfo: batch.supplierInfo || '',
    lotNumber: batch.lotNumber || '',
    costPerUnit: batch.costPerUnit?.toString() || '',
    notes: batch.notes || '',
    isActive: batch.isActive
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submitted with data:', editFormData);
    
    const updatedData = {
      ...editFormData,
      quantityReceived: parseFloat(editFormData.quantityReceived) || 0,
      quantityRemaining: parseFloat(editFormData.quantityRemaining) || 0,
      costPerUnit: editFormData.costPerUnit ? parseFloat(editFormData.costPerUnit) : null,
    };
    
    console.log('Processed data:', updatedData);
    onSave(updatedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Batch Number *
          </label>
          <input
            type="text"
            name="batchNumber"
            required
            value={editFormData.batchNumber}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Lot Number
          </label>
          <input
            type="text"
            name="lotNumber"
            value={editFormData.lotNumber}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Quantity Received *
          </label>
          <input
            type="number"
            name="quantityReceived"
            required
            min="0"
            step="0.01"
            value={editFormData.quantityReceived}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Quantity Remaining
          </label>
          <input
            type="number"
            name="quantityRemaining"
            min="0"
            step="0.01"
            value={editFormData.quantityRemaining}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Manufacture Date
          </label>
          <input
            type="date"
            name="manufactureDate"
            value={editFormData.manufactureDate}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Expiry Date *
          </label>
          <input
            type="date"
            name="expiryDate"
            required
            value={editFormData.expiryDate}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Cost Per Unit
          </label>
          <input
            type="number"
            name="costPerUnit"
            min="0"
            step="0.01"
            value={editFormData.costPerUnit}
            onChange={handleInputChange}
            placeholder="0.00"
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            Supplier Information
          </label>
          <input
            type="text"
            name="supplierInfo"
            value={editFormData.supplierInfo}
            onChange={handleInputChange}
            className="w-full h-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
          Notes
        </label>
        <textarea
          name="notes"
          rows={2}
          value={editFormData.notes}
          onChange={handleInputChange}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={editFormData.isActive}
          onChange={handleInputChange}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label className="ml-2 block text-sm text-gray-700">
          Active batch
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }}
          disabled={updating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {updating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            'Update Batch'
          )}
        </Button>
      </div>
    </form>
  );
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

  // Batch detail and delete states
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState<Batch | null>(null);
  const [showBulkDeactivateConfirm, setShowBulkDeactivateConfirm] = useState(false);
  const [expiredBatchesCount, setExpiredBatchesCount] = useState(0);
  
  // Edit batch states
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [updating, setUpdating] = useState(false);

  // Debug useEffect for editingBatch state
  useEffect(() => {
    console.log('editingBatch state changed:', editingBatch);
  }, [editingBatch]);

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
        console.log('Fetched batches data:', data.batches);
        setBatches(data.batches);
        setTotalPages(data.pagination.pages);
        
        // Count expired batches
        const expiredCount = data.batches.filter((batch: Batch) => batch.isExpired).length;
        setExpiredBatchesCount(expiredCount);
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

  const handleDeleteBatch = async (batchId: number) => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDeleteConfirmBatch(null);
        fetchBatches();
        alert('Batch deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error deleting batch: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch');
    }
  };

  const handleBulkDeactivateExpired = async () => {
    try {
      const response = await fetch('/api/batches', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deactivate-expired'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowBulkDeactivateConfirm(false);
        fetchBatches();
        alert(`Successfully deactivated ${result.deactivatedCount} expired batch${result.deactivatedCount !== 1 ? 'es' : ''}!`);
      } else {
        const error = await response.json();
        alert(`Error deactivating batches: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deactivating expired batches:', error);
      alert('Error deactivating expired batches');
    }
  };

  const handleEditBatch = (batch: Batch) => {
    console.log('Edit batch clicked:', batch);
    console.log('Current editingBatch state:', editingBatch);
    setEditingBatch(batch);
    console.log('Set editingBatch to:', batch);
  };

  const handleUpdateBatch = async (updatedData: any) => {
    console.log('handleUpdateBatch called with:', updatedData);
    if (!editingBatch) {
      console.log('No editing batch found');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setEditingBatch(null);
        fetchBatches();
        alert('Batch updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating batch: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('Error updating batch');
    } finally {
      setUpdating(false);
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
        <div>
          <h1 className="text-2xl font-bold">Batch Management</h1>
          {expiredBatchesCount > 0 && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ {expiredBatchesCount} expired batch{expiredBatchesCount !== 1 ? 'es' : ''} found
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {expiredBatchesCount > 0 && (
            <Button 
              onClick={() => setShowBulkDeactivateConfirm(true)}
              variant="outline"
              className="text-red-600 hover:text-red-800 border-red-300 hover:border-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Deactivate All Expired ({expiredBatchesCount})
            </Button>
          )}

          <Button onClick={() => setShowCreateForm(true)}>
            Create New Batch
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium mb-3 text-gray-700">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.expired && !filters.expiringDays ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, expired: true, expiringDays: '', activeOnly: true })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expired Only
          </Button>
          <Button
            variant={filters.expiringDays === '7' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, expiringDays: '7', expired: false, activeOnly: true })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expiring in 7 Days
          </Button>
          <Button
            variant={filters.expiringDays === '30' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, expiringDays: '30', expired: false, activeOnly: true })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
            </svg>
            Expiring in 30 Days
          </Button>
          <Button
            variant={!filters.expired && !filters.expiringDays ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, expired: false, expiringDays: '', activeOnly: true })}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All Active
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-2.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create New Batch</h2>
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
            <div className="flex-1 overflow-y-auto px-6 py-3">
              <form onSubmit={handleCreateBatch} id="batch-form" className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Batch Number*</label>
                    <Input
                      required
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="e.g., BATCH001"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Item Barcode*</label>
                    <Input
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Scan or enter barcode"
                      className="w-full h-8 text-sm"
                    />
                    
                    {/* Loading indicator */}
                    {barcodeLoading && (
                      <div className="mt-1 text-xs text-gray-500 flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching for item...
                      </div>
                    )}
                    
                    {/* Selected item display */}
                    {selectedItem && !barcodeLoading && (
                      <div className="mt-1 p-1.5 bg-green-50 border border-green-200 rounded-md">
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
                      <div className="mt-1 p-1.5 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <span className="text-red-600 mr-2">❌</span>
                          <p className="text-sm text-red-800">No item found with barcode: {formData.barcode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Warehouse*</label>
                    <select
                      required
                      value={formData.warehouseId}
                      onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                      className="w-full h-8 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className={`mt-1 p-1.5 rounded-md text-xs ${
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
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Quantity Received*</label>
                    <Input
                      required
                      type="number"
                      min="1"
                      value={formData.quantityReceived}
                      onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Manufacture Date</label>
                    <Input
                      type="date"
                      value={formData.manufactureDate}
                      onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Expiry Date*</label>
                    <Input
                      required
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Expiry Alert Days</label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.expireDateAlert}
                      onChange={(e) => setFormData({ ...formData, expireDateAlert: e.target.value })}
                      placeholder="30"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Supplier Info</label>
                    <Input
                      value={formData.supplierInfo}
                      onChange={(e) => setFormData({ ...formData, supplierInfo: e.target.value })}
                      placeholder="Supplier name or info"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Lot Number</label>
                    <Input
                      value={formData.lotNumber}
                      onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                      placeholder="Lot/batch identifier"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Cost Per Unit</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5 text-gray-600 dark:text-gray-400">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes or comments"
                  />
                </div>
              </form>
            </div>
            
            {/* Modal Footer - Fixed at bottom */}
            <div className="px-6 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end space-x-2">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(batches) && batches.map((batch, index) => {
                const expiryStatus = getExpiryStatus(batch);
                const keyValue = batch?.id ? `batch-${batch.id}` : `batch-fallback-${index}`;
                const rowBgColor = batch.isExpired 
                  ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' 
                  : batch.isExpiringSoon 
                    ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500' 
                    : 'hover:bg-gray-50';
                return (
                  <tr key={keyValue} className={rowBgColor}>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Edit button clicked for batch:', batch.batchNumber);
                            if (batch) {
                              handleEditBatch(batch);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('View button clicked, batch:', batch);
                            setSelectedBatch(batch);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Button>
                        {(batch.isExpired || batch.isExpiringSoon) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirmBatch(batch)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </Button>
                        )}
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

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div 
          className="fixed inset-0 overflow-y-auto" 
          style={{ 
            zIndex: 9999, 
            backgroundColor: 'rgba(0,0,0,0.8)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-6 relative"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Batch Details: {selectedBatch.batchNumber}
                </h3>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Item Name</label>
                      <p className="text-sm text-gray-900">{selectedBatch.inventory.itemName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Barcode</label>
                      <p className="text-sm text-gray-900">{selectedBatch.inventory.barcode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-900">{selectedBatch.inventory.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Warehouse</label>
                      <p className="text-sm text-gray-900">{selectedBatch.warehouse.warehouseName} ({selectedBatch.warehouse.warehouseCode})</p>
                    </div>
                  </div>
                </div>

                {/* Batch Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Batch Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Batch Number</label>
                      <p className="text-sm text-gray-900">{selectedBatch.batchNumber}</p>
                    </div>
                    {selectedBatch.lotNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Lot Number</label>
                        <p className="text-sm text-gray-900">{selectedBatch.lotNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Quantity</label>
                      <p className="text-sm text-gray-900">
                        {selectedBatch.quantityRemaining} / {selectedBatch.quantityReceived}
                        <span className="text-gray-500 ml-2">(Available / Received)</span>
                      </p>
                    </div>
                    {selectedBatch.costPerUnit && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cost Per Unit</label>
                        <p className="text-sm text-gray-900">${Number(selectedBatch.costPerUnit).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expiry Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Expiry Information</h4>
                  <div className="space-y-3">
                    {selectedBatch.manufactureDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Manufacture Date</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedBatch.manufactureDate)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBatch.expiryDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Expiry Status</label>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExpiryStatus(selectedBatch).color}`}>
                          {getExpiryStatus(selectedBatch).status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getExpiryStatus(selectedBatch).status === 'Expired' 
                            ? `${getExpiryStatus(selectedBatch).days} days ago`
                            : `${getExpiryStatus(selectedBatch).days} days left`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Additional Information</h4>
                  <div className="space-y-3">
                    {selectedBatch.supplierInfo && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Supplier</label>
                        <p className="text-sm text-gray-900">{selectedBatch.supplierInfo}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created By</label>
                      <p className="text-sm text-gray-900">
                        {selectedBatch.creator.firstName} {selectedBatch.creator.lastName} ({selectedBatch.creator.username})
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBatch.createdAt)}</p>
                    </div>
                    {selectedBatch.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Notes</label>
                        <p className="text-sm text-gray-900">{selectedBatch.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                {(selectedBatch.isExpired || selectedBatch.isExpiringSoon) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteConfirmBatch(selectedBatch);
                      setSelectedBatch(null);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Expired Batch
                  </Button>
                )}
                <Button onClick={() => setSelectedBatch(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setDeleteConfirmBatch(null)}></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Modal Content */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Batch
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete batch "{deleteConfirmBatch.batchNumber}"? 
                  This action will mark the batch as inactive and cannot be undone.
                </p>
                
                {/* Batch Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Batch Information:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Item:</strong> {deleteConfirmBatch.inventory.itemName}</p>
                    <p><strong>Warehouse:</strong> {deleteConfirmBatch.warehouse.warehouseName}</p>
                    <p><strong>Remaining Quantity:</strong> {deleteConfirmBatch.quantityRemaining}</p>
                    <p><strong>Expiry Date:</strong> {formatDate(deleteConfirmBatch.expiryDate)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getExpiryStatus(deleteConfirmBatch).color}`}>
                        {getExpiryStatus(deleteConfirmBatch).status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmBatch(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteBatch(deleteConfirmBatch.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Batch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Deactivate Confirmation Modal */}
      {showBulkDeactivateConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowBulkDeactivateConfirm(false)}></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Modal Content */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Deactivate All Expired Batches
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to deactivate all {expiredBatchesCount} expired batch{expiredBatchesCount !== 1 ? 'es' : ''}? 
                  This action will mark them as inactive and they will no longer appear in active inventory listings.
                </p>
                
                {/* Warning Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">What will happen:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• All expired batches will be marked as inactive</li>
                        <li>• They will be removed from active inventory counts</li>
                        <li>• Historical records will be preserved</li>
                        <li>• This action cannot be easily undone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm font-medium text-red-800">
                      {expiredBatchesCount} expired batch{expiredBatchesCount !== 1 ? 'es' : ''} will be deactivated
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeactivateConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkDeactivateExpired}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Deactivate All Expired ({expiredBatchesCount})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            onClick={() => {
              console.log('Backdrop clicked, closing modal');
              setEditingBatch(null);
            }}
          ></div>
          
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-xl px-6 pt-4 pb-4 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Modal content clicked');
            }}
          >
            {/* Edit Icon */}
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-2">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>

            {/* Modal Content */}
            <div className="text-center mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                Edit Batch: {editingBatch.batchNumber}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Update batch details below
              </p>
            </div>

            <EditBatchForm 
              batch={editingBatch}
              onSave={handleUpdateBatch}
              onCancel={() => setEditingBatch(null)}
              updating={updating}
              inventoryItems={inventoryItems}
              warehouses={warehouses}
            />
          </div>
        </div>
      )}
    </div>
  );
}