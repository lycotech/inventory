"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Warehouse {
  id: number;
  warehouseName: string;
  warehouseCode: string;
  isCentralWarehouse: boolean;
  location?: string;
}

export function WarehouseTransferForm() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    barcode: "",
    fromWarehouse: "",
    toWarehouse: "",
    quantity: "",
    referenceDoc: "",
    reason: "",
  });

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses/manage');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: formData.barcode,
          fromWarehouse: formData.fromWarehouse,
          toWarehouse: formData.toWarehouse,
          quantity: parseInt(formData.quantity),
          referenceDoc: formData.referenceDoc || undefined,
          reason: formData.reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Transfer completed successfully' });
        setFormData({
          barcode: "",
          fromWarehouse: "",
          toWarehouse: "",
          quantity: "",
          referenceDoc: "",
          reason: "",
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Transfer failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const centralWarehouse = warehouses.find(w => w.isCentralWarehouse);
  const branchWarehouses = warehouses.filter(w => !w.isCentralWarehouse);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <Label htmlFor="barcode">Item Barcode *</Label>
        <Input
          id="barcode"
          type="text"
          value={formData.barcode}
          onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
          placeholder="Enter item barcode"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromWarehouse">From Warehouse *</Label>
          <select
            id="fromWarehouse"
            value={formData.fromWarehouse}
            onChange={(e) => setFormData(prev => ({ ...prev, fromWarehouse: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select source warehouse</option>
            {centralWarehouse && (
              <option value={centralWarehouse.warehouseName}>
                {centralWarehouse.warehouseName} (Central)
              </option>
            )}
            {branchWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.warehouseName}>
                {warehouse.warehouseName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="toWarehouse">To Warehouse *</Label>
          <select
            id="toWarehouse"
            value={formData.toWarehouse}
            onChange={(e) => setFormData(prev => ({ ...prev, toWarehouse: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select destination warehouse</option>
            {centralWarehouse && (
              <option value={centralWarehouse.warehouseName}>
                {centralWarehouse.warehouseName} (Central)
              </option>
            )}
            {branchWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.warehouseName}>
                {warehouse.warehouseName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          placeholder="Enter quantity to transfer"
          min="1"
          required
        />
      </div>

      <div>
        <Label htmlFor="referenceDoc">Reference Document</Label>
        <Input
          id="referenceDoc"
          type="text"
          value={formData.referenceDoc}
          onChange={(e) => setFormData(prev => ({ ...prev, referenceDoc: e.target.value }))}
          placeholder="e.g., TRF-001, WO-123"
        />
      </div>

      <div>
        <Label htmlFor="reason">Reason/Notes</Label>
        <Input
          id="reason"
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Optional transfer reason or notes"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Processing Transfer..." : "Transfer Stock"}
      </Button>
    </form>
  );
}
