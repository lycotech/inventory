"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle, Clock, Warehouse, TrendingUp, TrendingDown } from "lucide-react";
import BatchExpiryAlerts from "@/components/dashboard/batch-expiry-alerts";

interface DashboardStats {
  totalItems: number;
  lowStock: number;
  pendingItems: number;
  totalWarehouses: number;
}

interface StockHealth {
  healthy: number;
  lowStock: number;
  outOfStock: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TransactionTrend {
  date: string;
  receive: number;
  issue: number;
  adjustment: number;
}

interface WarehouseDistribution {
  warehouse: string;
  items: number;
}

interface RecentActivity {
  id: number;
  itemName: string;
  warehouse: string;
  type: string;
  quantity: number;
  at: string;
  referenceDoc?: string;
}

interface Alert {
  id: number;
  message: string;
  type: "stock" | "expiry" | "system";
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  itemName?: string;
  warehouseName?: string;
}

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStock: 0,
    pendingItems: 0,
    totalWarehouses: 0
  });
  const [stockHealth, setStockHealth] = useState<StockHealth>({
    healthy: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [transactionTrends, setTransactionTrends] = useState<TransactionTrend[]>([]);
  const [warehouseDistribution, setWarehouseDistribution] = useState<WarehouseDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/stats").then(r => r.json()),
      fetch("/api/dashboard/recent").then(r => r.json()),
      fetch("/api/dashboard/alerts").then(r => r.json())
    ]).then(([statsData, recentData, alertsData]) => {
      setStats(statsData.stats || stats);
      setStockHealth(statsData.stockHealth || stockHealth);
      setCategoryData(statsData.categoryData || []);
      setTransactionTrends(statsData.transactionTrends || []);
      setWarehouseDistribution(statsData.warehouseDistribution || []);
      setRecentActivity(recentData.recent || []);
      setAlerts(alertsData.alerts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, admin</h1>
          <p className="text-gray-600">Monitor your inventory levels, alerts, and recent activities</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last login at some time</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Items</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Warehouses</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalWarehouses}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Health Overview */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Health Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-green-600 font-bold">{stockHealth.healthy}</span>
                  </div>
                  <p className="text-sm text-gray-600">Healthy Stock</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">{stockHealth.lowStock}</span>
                  </div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-red-600 font-bold">{stockHealth.outOfStock}</span>
                  </div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory by Category */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
          <div className="h-64">
            <div className="space-y-3">
              {categoryData.slice(0, 6).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{category.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Trends */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trends</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>Transaction trends chart placeholder</p>
          </div>
        </div>
      </div>

      {/* Warehouse Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Distribution</h3>
        <div className="h-64">
          <div className="space-y-3">
            {warehouseDistribution.slice(0, 8).map((warehouse) => (
              <div key={warehouse.warehouse} className="flex items-center justify-between">
                <span className="text-sm font-medium">{warehouse.warehouse}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (warehouse.items / Math.max(...warehouseDistribution.map(w => w.items))) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{warehouse.items}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Expiry Alerts */}
      <div className="grid grid-cols-1">
        <BatchExpiryAlerts />
      </div>

      {/* Bottom Row - Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  activity.type === 'receive' ? 'bg-green-100' :
                  activity.type === 'issue' ? 'bg-red-100' :
                  activity.type === 'adjustment' ? 'bg-blue-100' :
                  activity.type === 'transfer' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  {activity.type === 'receive' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                   activity.type === 'issue' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                   <Package className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.itemName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.warehouse} • {activity.type.toUpperCase()} • {activity.quantity} units
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(activity.at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  alert.severity === 'critical' ? 'bg-red-100' :
                  alert.severity === 'high' ? 'bg-orange-100' :
                  alert.severity === 'medium' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'high' ? 'text-orange-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
                  {alert.itemName && (
                    <p className="text-xs text-gray-500">
                      {alert.itemName} • {alert.warehouseName}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
