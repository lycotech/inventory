"use client";

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Building2 } from 'lucide-react';

interface ChartData {
  categoryData: Array<{
    name: string;
    items: number;
    totalStock: number;
  }>;
  transactionData: Array<{
    date: string;
    transactions: number;
    totalQuantity: number;
  }>;
  warehouseData: Array<{
    name: string;
    items: number;
    totalStock: number;
  }>;
  stockHealthData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await fetch('/api/dashboard/charts');
        if (res.ok) {
          const chartData = await res.json();
          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || (
    !data.categoryData?.length && 
    !data.transactionData?.length && 
    !data.warehouseData?.length && 
    !data.stockHealthData?.length
  )) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No data available for charts</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Add some inventory items to see analytics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Health Pie Chart */}
      <ChartCard
        title="Stock Health Overview"
        icon={PieChartIcon}
        description="Distribution of healthy vs low stock items"
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.stockHealthData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.stockHealthData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Category Distribution */}
      <ChartCard
        title="Inventory by Category"
        icon={PieChartIcon}
        description="Item distribution across categories"
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.categoryData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="items"
              label={(entry) => entry.name}
            >
              {data.categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Transaction Trends */}
      <ChartCard
        title="Transaction Trends"
        icon={TrendingUp}
        description="Daily transaction activity over the last 7 days"
      >
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.transactionData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="transactions" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Warehouse Distribution */}
      <ChartCard
        title="Warehouse Distribution"
        icon={Building2}
        description="Stock levels across different warehouses"
      >
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.warehouseData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="items" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  children: React.ReactNode;
}

function ChartCard({ title, icon: Icon, description, children }: ChartCardProps) {
  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg shadow-gray-500/5 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
