import { Suspense } from "react";
import { WarehouseTransferForm } from "@/components/dashboard/warehouse-transfer-form";
import { WarehouseList } from "@/components/dashboard/warehouse-list";

export default function WarehouseTransferPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Warehouse Management</h1>
        <p className="text-gray-600 mt-2">
          Manage inventory transfers between warehouses. Stock should be received into the central warehouse first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Warehouse Transfer Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Transfer Stock</h2>
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
              <WarehouseTransferForm />
            </Suspense>
          </div>
        </div>

        {/* Warehouse List */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Warehouses</h2>
            <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded"></div>}>
              <WarehouseList />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Central Warehouse Policy</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                All new stock should be received into the <strong>Central Warehouse</strong> first. 
                Use warehouse transfers to move stock to branch locations as needed. This ensures 
                proper inventory tracking and stock distribution control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
