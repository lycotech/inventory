"use client";

import { useState, useEffect } from "react";

interface Warehouse {
  id: number;
  warehouseName: string;
  warehouseCode: string;
  location?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  isCentralWarehouse: boolean;
  isActive: boolean;
  createdAt: string;
  isVirtual?: boolean; // Added for inventory-only warehouses
  itemCount?: number; // Number of inventory items in warehouse
}

interface NewWarehouse {
  warehouseName: string;
  warehouseCode: string;
  location: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  isCentralWarehouse: boolean;
}

interface EditWarehouse extends NewWarehouse {
  id: number;
  isActive: boolean;
}

export function WarehouseList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<EditWarehouse | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<NewWarehouse>({
    warehouseName: '',
    warehouseCode: '',
    location: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    isCentralWarehouse: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses/manage');
      
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', response.status, errorData);
        setMessage({ type: 'error', text: `Failed to load warehouses: ${errorData.error || 'Unknown error'}` });
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/warehouses/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Warehouse created successfully!' });
        setFormData({
          warehouseName: '',
          warehouseCode: '',
          location: '',
          contactPerson: '',
          phoneNumber: '',
          email: '',
          isCentralWarehouse: false,
        });
        setShowCreateForm(false);
        fetchWarehouses(); // Refresh the list
        
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('warehouse:created'));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create warehouse' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create warehouse' });
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateFromInventory = (warehouse: Warehouse) => {
    // Pre-fill form with inventory warehouse data
    setFormData({
      warehouseName: warehouse.warehouseName,
      warehouseCode: warehouse.warehouseCode,
      location: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      isCentralWarehouse: false,
    });
    setShowCreateForm(true);
    setMessage({ type: 'success', text: `Creating warehouse record for "${warehouse.warehouseName}"` });
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    if (warehouse.isVirtual) {
      setMessage({ type: 'error', text: 'Cannot edit virtual warehouses. Create a warehouse record first.' });
      return;
    }

    setEditingWarehouse({
      id: warehouse.id,
      warehouseName: warehouse.warehouseName,
      warehouseCode: warehouse.warehouseCode,
      location: warehouse.location || '',
      contactPerson: warehouse.contactPerson || '',
      phoneNumber: warehouse.phoneNumber || '',
      email: warehouse.email || '',
      isCentralWarehouse: warehouse.isCentralWarehouse,
      isActive: warehouse.isActive,
    });
    setShowCreateForm(false);
    setMessage(null);
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;

    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/warehouses/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingWarehouse),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Warehouse updated successfully!' });
        setEditingWarehouse(null);
        fetchWarehouses(); // Refresh the list
        
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('warehouse:updated'));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update warehouse' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update warehouse' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    if (warehouse.isVirtual) {
      setMessage({ type: 'error', text: 'Cannot delete virtual warehouses. They exist only in inventory records.' });
      return;
    }

    setConfirmDelete(warehouse);
  };

  const confirmDeleteWarehouse = async () => {
    if (!confirmDelete) return;

    setDeleting(confirmDelete.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/warehouses/manage?id=${confirmDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Warehouse deleted successfully!' });
        fetchWarehouses(); // Refresh the list
        
        // Emit event to notify other components
        window.dispatchEvent(new CustomEvent('warehouse:deleted'));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete warehouse' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete warehouse' });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingWarehouse) return;

    const { name, value, type, checked } = e.target;
    setEditingWarehouse(prev => prev ? {
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    } : null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Warehouse Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Warehouse List</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Warehouse
        </button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <button 
                onClick={() => setMessage(null)}
                className="text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Warehouse Form */}
      {showCreateForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Create New Warehouse</h4>
          <form onSubmit={handleCreateWarehouse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  name="warehouseName"
                  required
                  value={formData.warehouseName}
                  onChange={handleInputChange}
                  placeholder="e.g., Central Warehouse"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Code *
                </label>
                <input
                  type="text"
                  name="warehouseCode"
                  required
                  value={formData.warehouseCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CW01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., 123 Main Street, City, State"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., +1234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., warehouse@company.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isCentralWarehouse"
                checked={formData.isCentralWarehouse}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Set as Central Warehouse (main distribution center)
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setMessage(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Warehouse'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Warehouse Form */}
      {editingWarehouse && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Edit Warehouse</h4>
          <form onSubmit={handleUpdateWarehouse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  name="warehouseName"
                  required
                  value={editingWarehouse.warehouseName}
                  onChange={handleEditInputChange}
                  placeholder="e.g., Central Warehouse"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warehouse Code *
                </label>
                <input
                  type="text"
                  name="warehouseCode"
                  required
                  value={editingWarehouse.warehouseCode}
                  onChange={handleEditInputChange}
                  placeholder="e.g., CW01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={editingWarehouse.location}
                onChange={handleEditInputChange}
                placeholder="e.g., 123 Main Street, City, State"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={editingWarehouse.contactPerson}
                  onChange={handleEditInputChange}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editingWarehouse.phoneNumber}
                  onChange={handleEditInputChange}
                  placeholder="e.g., +1234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={editingWarehouse.email}
                onChange={handleEditInputChange}
                placeholder="e.g., warehouse@company.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isCentralWarehouse"
                checked={editingWarehouse.isCentralWarehouse}
                onChange={handleEditInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Set as Central Warehouse (main distribution center)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={editingWarehouse.isActive}
                onChange={handleEditInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active warehouse
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setEditingWarehouse(null);
                  setMessage(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Updating...' : 'Update Warehouse'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.268 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-2">
              Delete Warehouse
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Are you sure you want to delete "{confirmDelete.warehouseName}"? This action cannot be undone.
            </p>
            {(confirmDelete.itemCount ?? 0) > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This warehouse contains {confirmDelete.itemCount} inventory items. Delete operation is not allowed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWarehouse}
                disabled={(confirmDelete.itemCount ?? 0) > 0 || confirmDelete.isCentralWarehouse}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse List */}
      <div className="space-y-3">
        {warehouses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-lg font-medium">No warehouses configured</p>
            <p className="text-sm">Click "Add Warehouse" to create your first warehouse</p>
          </div>
        ) : (
          warehouses.map((warehouse, index) => (
            <div
              key={warehouse.isVirtual ? `virtual-${warehouse.warehouseName}-${index}` : `warehouse-${warehouse.id}`}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                warehouse.isCentralWarehouse
                  ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                  : warehouse.isVirtual
                  ? 'border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {warehouse.warehouseName}
                    </h3>
                    {warehouse.isCentralWarehouse && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        Central
                      </span>
                    )}
                    {warehouse.isVirtual && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                        From Inventory
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Code: {warehouse.warehouseCode}
                  </p>
                  {warehouse.isVirtual && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                      📋 Found in inventory records - click "Create Warehouse Record" to manage this warehouse
                    </p>
                  )}
                  {warehouse.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      📍 {warehouse.location}
                    </p>
                  )}
                  {warehouse.contactPerson && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      👤 {warehouse.contactPerson}
                      {warehouse.phoneNumber && (
                        <span className="ml-2">📞 {warehouse.phoneNumber}</span>
                      )}
                    </p>
                  )}
                  {warehouse.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ✉️ {warehouse.email}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <div className="flex gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      warehouse.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {warehouse.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
                      {warehouse.itemCount || 0} items
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {warehouse.isVirtual ? (
                      <button
                        onClick={() => handleCreateFromInventory(warehouse)}
                        className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                      >
                        Create Record
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditWarehouse(warehouse)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWarehouse(warehouse)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            (warehouse.itemCount ?? 0) > 0 || warehouse.isCentralWarehouse
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                          disabled={(warehouse.itemCount ?? 0) > 0 || warehouse.isCentralWarehouse || deleting === warehouse.id}
                          title={
                            warehouse.isCentralWarehouse
                              ? 'Cannot delete central warehouse'
                              : (warehouse.itemCount ?? 0) > 0 
                              ? 'Cannot delete warehouses with inventory items' 
                              : 'Delete warehouse'
                          }
                        >
                          {deleting === warehouse.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
