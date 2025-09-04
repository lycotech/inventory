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
}

export function SimpleWarehouseList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      console.log('Fetching warehouses...');
      const response = await fetch('/api/warehouses/manage');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setWarehouses(data.warehouses || []);
        console.log('Warehouses count:', (data.warehouses || []).length);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  console.log('Rendering with warehouses:', warehouses);

  if (loading) {
    return <div className="p-4 bg-blue-100">Loading warehouses...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-800">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100">
      <h3 className="font-bold mb-2">Simple Warehouse List</h3>
      <p className="mb-2">Total warehouses: {warehouses.length}</p>
      
      {warehouses.length === 0 ? (
        <div className="p-4 bg-yellow-100">No warehouses found</div>
      ) : (
        <div className="space-y-2">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="p-3 bg-white border rounded">
              <h4 className="font-semibold">{warehouse.warehouseName}</h4>
              <p>Code: {warehouse.warehouseCode}</p>
              <p>Central: {warehouse.isCentralWarehouse ? 'Yes' : 'No'}</p>
              <p>Active: {warehouse.isActive ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
