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

export function WarehouseList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warehouses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No warehouses configured</p>
          <p className="text-sm">Contact administrator to set up warehouses</p>
        </div>
      ) : (
        warehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className={`p-4 rounded-lg border-2 ${
              warehouse.isCentralWarehouse
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {warehouse.warehouseName}
                  </h3>
                  {warehouse.isCentralWarehouse && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Central
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Code: {warehouse.warehouseCode}
                </p>
                {warehouse.location && (
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {warehouse.location}
                  </p>
                )}
                {warehouse.contactPerson && (
                  <p className="text-sm text-gray-500">
                    👤 {warehouse.contactPerson}
                    {warehouse.phoneNumber && (
                      <span className="ml-2">📞 {warehouse.phoneNumber}</span>
                    )}
                  </p>
                )}
                {warehouse.email && (
                  <p className="text-sm text-gray-500">
                    ✉️ {warehouse.email}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  warehouse.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {warehouse.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
