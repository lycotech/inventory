'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BatchAlert {
  id: number;
  batchNumber: string;
  quantityRemaining: number;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  priority: string;
  isExpired: boolean;
  inventory: {
    itemName: string;
    barcode: string;
    category: string;
  };
  warehouse: {
    warehouseName: string;
    warehouseCode: string;
  };
}

interface BatchExpiryAlertsProps {
  className?: string;
}

export default function BatchExpiryAlerts({ className }: BatchExpiryAlertsProps) {
  const [alerts, setAlerts] = useState<BatchAlert[]>([]);
  const [summary, setSummary] = useState({
    expired: 0,
    expiring_within_7_days: 0,
    expiring_within_14_days: 0,
    expiring_within_30_days: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchExpiryAlerts();
  }, []);

  const fetchExpiryAlerts = async () => {
    try {
      const response = await fetch('/api/batches/expiry-alerts?warningDays=30&includeExpired=true');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.batches.slice(0, expanded ? undefined : 5)); // Show first 5 if not expanded
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching batch expiry alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority: string, isExpired: boolean) => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    switch (priority) {
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Expiry Alerts</h3>
        <div className="text-center py-4">
          <div className="text-green-600 text-sm">
            ✓ No batches expiring within 30 days
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Batch Expiry Alerts</h3>
          <Link href="/dashboard/batches">
            <Button variant="outline" size="sm">
              View All Batches
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-600 text-2xl font-bold">{summary.expired}</div>
            <div className="text-red-600 text-xs">Expired</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-orange-600 text-2xl font-bold">{summary.expiring_within_7_days}</div>
            <div className="text-orange-600 text-xs">≤ 7 Days</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-600 text-2xl font-bold">{summary.expiring_within_14_days}</div>
            <div className="text-yellow-600 text-xs">8-14 Days</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-600 text-2xl font-bold">{summary.expiring_within_30_days}</div>
            <div className="text-blue-600 text-xs">15-30 Days</div>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getPriorityColor(alert.priority, alert.isExpired)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {alert.inventory.itemName}
                    </span>
                    <span className="text-xs bg-white/70 px-2 py-1 rounded">
                      Batch: {alert.batchNumber}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Warehouse: {alert.warehouse.warehouseName}</div>
                    <div>Quantity: {alert.quantityRemaining} units</div>
                    <div>Expiry: {formatDate(alert.expiryDate)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">
                    {alert.isExpired 
                      ? `Expired ${Math.abs(alert.daysUntilExpiry)}d ago`
                      : `${alert.daysUntilExpiry} days left`
                    }
                  </div>
                  <div className="text-xs capitalize">
                    {alert.priority} priority
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {summary.total > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : `Show All ${summary.total} Alerts`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}