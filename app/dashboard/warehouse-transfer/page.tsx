"use client";

import { Suspense } from "react";
import { WarehouseTransferForm } from "@/components/dashboard/warehouse-transfer-form";
import { WarehouseList } from "@/components/dashboard/warehouse-list";
import { AccessControl } from "@/components/access-control";

export default function WarehouseTransferPage() {
  return (
    <AccessControl requiredRoles={["admin", "manager"]}>
      <WarehouseTransferContent />
    </AccessControl>
  );
}

function WarehouseTransferContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Warehouse Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage warehouses, then transfer inventory between locations. Stock should be received into the central warehouse first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Warehouse Management */}
        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Warehouse Management</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage warehouse locations</p>
                </div>
              </div>
              <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>}>
                <WarehouseList />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Stock Transfer Form */}
        <div className="space-y-6">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transfer Stock</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Move inventory between warehouses</p>
                </div>
              </div>
              <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>}>
                <WarehouseTransferForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Warehouse Management Best Practices</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>Central Warehouse:</strong> Designate one main warehouse as your central distribution point</p>
              <p>• <strong>Stock Flow:</strong> Receive all new stock into the central warehouse first</p>
              <p>• <strong>Transfers:</strong> Use transfers to distribute stock to branch locations as needed</p>
              <p>• <strong>Tracking:</strong> Each transfer creates a complete audit trail for inventory movements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
