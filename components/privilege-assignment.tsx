"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface PrivilegeAssignmentProps {
  onPrivilegesChange?: (privileges: {
    menuPermissions: { [key: string]: boolean };
    warehouseAccess: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } };
    operationPrivileges: { [key: string]: boolean };
  }) => void;
  initialPrivileges?: {
    menuPermissions?: { [key: string]: boolean };
    warehouseAccess?: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } };
    operationPrivileges?: { [key: string]: boolean };
  };
}

export function PrivilegeAssignment({ onPrivilegesChange, initialPrivileges }: PrivilegeAssignmentProps) {
  const [warehouses, setWarehouses] = useState<{ id: number; warehouseName: string; location?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Menu permissions state
  const [menuPermissions, setMenuPermissions] = useState<{ [key: string]: boolean }>({
    dashboard: false,
    inventory: false,
    batches: false,
    alerts: false,
    reports: false,
    users: false,
    settings: false,
    backup: false,
    logs: false,
    warehouse_transfer: false,
    stock_aging: false,
    import: false
  });

  // Warehouse access state
  const [warehouseAccess, setWarehouseAccess] = useState<{ [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } }>({});

  // Operation privileges state
  const [operationPrivileges, setOperationPrivileges] = useState<{ [key: string]: boolean }>({
    create: false,
    read: false,
    update: false,
    delete: false,
    import: false,
    export: false,
    transfer: false,
    adjust_stock: false,
    reset_stock: false,
    acknowledge_alerts: false
  });

  useEffect(() => {
    // Load warehouses
    const loadWarehouses = async () => {
      try {
        const res = await fetch("/api/users/warehouses");
        const data = await res.json();
        if (data.warehouses) {
          setWarehouses(data.warehouses);
          
          // Initialize warehouse access for all warehouses
          const warehouseAccessInit: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } } = {};
          data.warehouses.forEach((warehouse: any) => {
            warehouseAccessInit[warehouse.warehouseName] = {
              canView: false,
              canEdit: false,
              canTransfer: false
            };
          });
          setWarehouseAccess(warehouseAccessInit);
        }
      } catch (error) {
        console.error("Failed to load warehouses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  // Load initial privileges if provided
  useEffect(() => {
    if (initialPrivileges) {
      if (initialPrivileges.menuPermissions) {
        setMenuPermissions(prev => ({ ...prev, ...initialPrivileges.menuPermissions }));
      }
      if (initialPrivileges.warehouseAccess) {
        setWarehouseAccess(prev => ({ ...prev, ...initialPrivileges.warehouseAccess }));
      }
      if (initialPrivileges.operationPrivileges) {
        setOperationPrivileges(prev => ({ ...prev, ...initialPrivileges.operationPrivileges }));
      }
    }
  }, [initialPrivileges]);

  // Notify parent when privileges change
  useEffect(() => {
    if (onPrivilegesChange) {
      onPrivilegesChange({
        menuPermissions,
        warehouseAccess,
        operationPrivileges
      });
    }
  }, [menuPermissions, warehouseAccess, operationPrivileges, onPrivilegesChange]);

  const handleMenuPermissionChange = (menuItem: string, value: boolean) => {
    setMenuPermissions(prev => ({ ...prev, [menuItem]: value }));
  };

  const handleWarehouseAccessChange = (warehouseName: string, permission: 'canView' | 'canEdit' | 'canTransfer', value: boolean) => {
    setWarehouseAccess(prev => ({
      ...prev,
      [warehouseName]: {
        ...prev[warehouseName],
        [permission]: value
      }
    }));
  };

  const handleOperationPrivilegeChange = (operation: string, value: boolean) => {
    setOperationPrivileges(prev => ({ ...prev, [operation]: value }));
  };

  const menuItemLabels: { [key: string]: string } = {
    dashboard: "Dashboard",
    inventory: "Inventory Management",
    batches: "Batch Management",
    alerts: "Alerts & Notifications",
    reports: "Reports",
    users: "User Management",
    settings: "System Settings",
    backup: "Backup & Export",
    logs: "System Logs",
    warehouse_transfer: "Warehouse Transfer",
    stock_aging: "Stock Aging",
    import: "Import Data"
  };

  const operationLabels: { [key: string]: string } = {
    create: "Create Records",
    read: "View Records",
    update: "Update Records",
    delete: "Delete Records",
    import: "Import Data",
    export: "Export Data",
    transfer: "Transfer Stock",
    adjust_stock: "Adjust Stock Levels",
    reset_stock: "Reset Stock Quantities",
    acknowledge_alerts: "Acknowledge Alerts"
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading privilege options...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Menu Permissions */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Menu Access Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(menuItemLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              <Switch
                checked={menuPermissions[key]}
                onCheckedChange={(checked) => handleMenuPermissionChange(key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Warehouse Access */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Warehouse Access Permissions
        </h3>
        {warehouses.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm italic">No warehouses found</p>
        ) : (
          <div className="space-y-4">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {warehouse.warehouseName}
                  {warehouse.location && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-normal ml-2">
                      ({warehouse.location})
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">View Access</span>
                    <Switch
                      checked={warehouseAccess[warehouse.warehouseName]?.canView || false}
                      onCheckedChange={(checked) => handleWarehouseAccessChange(warehouse.warehouseName, 'canView', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Edit Access</span>
                    <Switch
                      checked={warehouseAccess[warehouse.warehouseName]?.canEdit || false}
                      onCheckedChange={(checked) => handleWarehouseAccessChange(warehouse.warehouseName, 'canEdit', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Transfer Access</span>
                    <Switch
                      checked={warehouseAccess[warehouse.warehouseName]?.canTransfer || false}
                      onCheckedChange={(checked) => handleWarehouseAccessChange(warehouse.warehouseName, 'canTransfer', checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operation Privileges */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Operation Privileges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(operationLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              <Switch
                checked={operationPrivileges[key]}
                onCheckedChange={(checked) => handleOperationPrivilegeChange(key, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}