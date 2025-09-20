"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddNewItemProps {
  onItemAdded?: (item: any) => void;
  onClose?: () => void;
}

interface Warehouse {
  id: number;
  warehouseName: string;
  warehouseCode: string;
  location?: string;
}

export default function AddNewItemForm({ onItemAdded, onClose }: AddNewItemProps) {
  // Form state - matching Excel template fields exactly
  const [formData, setFormData] = useState({
    barcode: '',
    category: '',
    itemName: '',
    searchCode: '',
    warehouseName: '',
    stockQty: '',
    stockAlertLevel: '',
    expireDate: '',
    expireDateAlert: '',
    // Batch fields (optional)
    batchNumber: '',
    manufactureDate: '',
    supplierInfo: '',
    lotNumber: '',
    costPerUnit: ''
  });

  // UI state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const [barcodeExists, setBarcodeExists] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [enableBatchTracking, setEnableBatchTracking] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Load warehouses and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch warehouses
        const warehousesResponse = await fetch('/api/warehouses/list');
        if (warehousesResponse.ok) {
          const warehousesData = await warehousesResponse.json();
          setWarehouses(warehousesData.warehouses || []);
        }

        // Fetch existing categories
        const categoriesResponse = await fetch('/api/categories/list');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Check if barcode already exists when barcode and warehouse are provided
  useEffect(() => {
    const checkBarcodeExists = async () => {
      if (formData.barcode.trim() && formData.warehouseName.trim()) {
        setCheckingBarcode(true);
        try {
          const response = await fetch(
            `/api/inventory/create?barcode=${encodeURIComponent(formData.barcode)}&warehouse=${encodeURIComponent(formData.warehouseName)}`
          );
          if (response.ok) {
            const data = await response.json();
            setBarcodeExists(data.exists);
          }
        } catch (error) {
          console.error('Failed to check barcode:', error);
        } finally {
          setCheckingBarcode(false);
        }
      } else {
        setBarcodeExists(false);
      }
    };

    const timeoutId = setTimeout(checkBarcodeExists, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.barcode, formData.warehouseName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage(null);
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const generated = `ITM${timestamp}${random}`;
    handleInputChange('barcode', generated);
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'ADD_NEW_CATEGORY') {
      setShowCustomCategory(true);
      setCustomCategoryInput('');
    } else {
      setShowCustomCategory(false);
      handleInputChange('category', value);
    }
  };

  const handleAddCustomCategory = () => {
    const newCategory = customCategoryInput.trim();
    if (newCategory && !categories.includes(newCategory)) {
      // Add to categories list
      setCategories(prev => [...prev, newCategory].sort());
      // Set as selected category
      handleInputChange('category', newCategory);
      // Hide custom input
      setShowCustomCategory(false);
      setCustomCategoryInput('');
      setMessage({ type: 'success', text: `Category "${newCategory}" added successfully!` });
    } else if (categories.includes(newCategory)) {
      setMessage({ type: 'error', text: 'Category already exists' });
    } else {
      setMessage({ type: 'error', text: 'Please enter a valid category name' });
    }
  };

  const handleCancelCustomCategory = () => {
    setShowCustomCategory(false);
    setCustomCategoryInput('');
    handleInputChange('category', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (barcodeExists) {
      setMessage({ type: 'error', text: 'Barcode already exists in this warehouse' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/inventory/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item created successfully!' });
        onItemAdded?.(data.item);
        
        // Reset form
        setFormData({
          barcode: '',
          category: '',
          itemName: '',
          searchCode: '',
          warehouseName: '',
          stockQty: '',
          stockAlertLevel: '',
          expireDate: '',
          expireDateAlert: '',
          batchNumber: '',
          manufactureDate: '',
          supplierInfo: '',
          lotNumber: '',
          costPerUnit: ''
        });
        setEnableBatchTracking(false);
        setShowCustomCategory(false);
        setCustomCategoryInput('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create item' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create item. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Item</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            ✕ Close
          </Button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Basic Information
            </h3>
            
            <div>
              <Label htmlFor="barcode">Barcode *</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Enter or scan barcode"
                  required
                  className={barcodeExists ? 'border-red-500' : ''}
                />
                <Button type="button" onClick={generateBarcode} variant="outline">
                  Generate
                </Button>
              </div>
              {checkingBarcode && (
                <p className="text-sm text-blue-600 mt-1">Checking barcode...</p>
              )}
              {barcodeExists && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Barcode already exists in this warehouse
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              {!showCustomCategory ? (
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="ADD_NEW_CATEGORY" className="font-medium text-blue-600">
                    + Add New Category
                  </option>
                </select>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddCustomCategory}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={!customCategoryInput.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancelCustomCategory}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Press Enter or click Add to create the new category
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="searchCode">Search Code</Label>
              <Input
                id="searchCode"
                value={formData.searchCode}
                onChange={(e) => handleInputChange('searchCode', e.target.value)}
                placeholder="Enter search code (optional)"
              />
            </div>

            <div>
              <Label htmlFor="warehouseName">Warehouse *</Label>
              <select
                id="warehouseName"
                value={formData.warehouseName}
                onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.warehouseName}>
                    {warehouse.warehouseName} ({warehouse.warehouseCode})
                    {warehouse.location && ` - ${warehouse.location}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Stock Information
            </h3>

            <div>
              <Label htmlFor="stockQty">Initial Stock Quantity</Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                value={formData.stockQty}
                onChange={(e) => handleInputChange('stockQty', e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="stockAlertLevel">Stock Alert Level</Label>
              <Input
                id="stockAlertLevel"
                type="number"
                min="0"
                value={formData.stockAlertLevel}
                onChange={(e) => handleInputChange('stockAlertLevel', e.target.value)}
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="expireDate">Expiry Date (Optional)</Label>
              <Input
                id="expireDate"
                type="date"
                value={formData.expireDate}
                onChange={(e) => handleInputChange('expireDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expireDateAlert">Expiry Alert (Days Before)</Label>
              <Input
                id="expireDateAlert"
                type="number"
                min="0"
                value={formData.expireDateAlert}
                onChange={(e) => handleInputChange('expireDateAlert', e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Batch Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 flex-1">
              Batch Information (Optional)
            </h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableBatchTracking}
                onChange={(e) => setEnableBatchTracking(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable batch tracking</span>
            </label>
          </div>

          {enableBatchTracking && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="Enter batch number"
                  />
                </div>

                <div>
                  <Label htmlFor="manufactureDate">Manufacture Date</Label>
                  <Input
                    id="manufactureDate"
                    type="date"
                    value={formData.manufactureDate}
                    onChange={(e) => handleInputChange('manufactureDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="supplierInfo">Supplier Information</Label>
                  <Input
                    id="supplierInfo"
                    value={formData.supplierInfo}
                    onChange={(e) => handleInputChange('supplierInfo', e.target.value)}
                    placeholder="Enter supplier name/info"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="lotNumber">Lot Number</Label>
                  <Input
                    id="lotNumber"
                    value={formData.lotNumber}
                    onChange={(e) => handleInputChange('lotNumber', e.target.value)}
                    placeholder="Enter lot number"
                  />
                </div>

                <div>
                  <Label htmlFor="costPerUnit">Cost Per Unit</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPerUnit}
                    onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6 border-t">
          <Button
            type="submit"
            disabled={loading || barcodeExists || !formData.barcode || !formData.itemName || !formData.category || !formData.warehouseName}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {loading ? 'Creating...' : 'Create Item'}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                barcode: '',
                category: '',
                itemName: '',
                searchCode: '',
                warehouseName: '',
                stockQty: '',
                stockAlertLevel: '',
                expireDate: '',
                expireDateAlert: '',
                batchNumber: '',
                manufactureDate: '',
                supplierInfo: '',
                lotNumber: '',
                costPerUnit: ''
              });
              setEnableBatchTracking(false);
              setShowCustomCategory(false);
              setCustomCategoryInput('');
              setMessage(null);
            }}
          >
            Reset Form
          </Button>
        </div>
      </form>
    </div>
  );
}