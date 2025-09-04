"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Database, FileX, TrendingDown, RefreshCw, Download, Filter } from 'lucide-react';

interface ErrorLogs {
  failedTransactions: any[];
  systemAlerts: any[];
  failedImports: any[];
  negativeStockItems: any[];
  summary: {
    totalFailedTransactions: number;
    totalSystemAlerts: number;
    totalFailedImports: number;
    totalNegativeStock: number;
  };
}

export default function ErrorLogsPage() {
  const [errorLogs, setErrorLogs] = useState<ErrorLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  const fetchErrorLogs = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/logs/errors');
      if (response.ok) {
        const data = await response.json();
        setErrorLogs(data.errorLogs);
      } else {
        console.error('Failed to fetch error logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const downloadLogs = () => {
    if (!errorLogs) return;
    
    const dataStr = JSON.stringify(errorLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!errorLogs) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Error Logs</h2>
          <p className="text-gray-600 mb-4">Unable to fetch error logs. Please check your permissions.</p>
          <button 
            onClick={fetchErrorLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'transactions', label: 'Failed Transactions', count: errorLogs.summary.totalFailedTransactions, icon: Database },
    { id: 'alerts', label: 'System Alerts', count: errorLogs.summary.totalSystemAlerts, icon: AlertTriangle },
    { id: 'imports', label: 'Failed Imports', count: errorLogs.summary.totalFailedImports, icon: FileX },
    { id: 'negative', label: 'Negative Stock', count: errorLogs.summary.totalNegativeStock, icon: TrendingDown },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
          <p className="text-gray-600">Monitor system errors and data integrity issues</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchErrorLogs}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{tab.label}</p>
                  <p className="text-2xl font-bold text-red-600">{tab.count}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow border">
        {activeTab === 'transactions' && (
          <TransactionErrors transactions={errorLogs.failedTransactions} />
        )}
        {activeTab === 'alerts' && (
          <SystemAlerts alerts={errorLogs.systemAlerts} />
        )}
        {activeTab === 'imports' && (
          <ImportErrors imports={errorLogs.failedImports} />
        )}
        {activeTab === 'negative' && (
          <NegativeStock items={errorLogs.negativeStockItems} />
        )}
      </div>
    </div>
  );
}

function TransactionErrors({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No failed transactions found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Failed Transactions</h3>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{transaction.inventory?.itemName}</h4>
                <p className="text-sm text-gray-600">
                  {transaction.inventory?.warehouseName} • {transaction.transactionType.toUpperCase()}
                </p>
                <p className="text-sm text-red-600">Quantity: {transaction.quantity}</p>
                {transaction.referenceDoc && (
                  <p className="text-sm text-gray-500">Ref: {transaction.referenceDoc}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemAlerts({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No system alerts found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{alert.inventory?.itemName || 'System Alert'}</h4>
                <p className="text-sm text-gray-600">{alert.message}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.priorityLevel === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.priorityLevel.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    {alert.alertType.toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportErrors({ imports }: { imports: any[] }) {
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [importDetails, setImportDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchImportDetails = async (importId: number) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/logs/imports/${importId}`);
      if (response.ok) {
        const data = await response.json();
        setImportDetails(data.importDetails);
      } else {
        console.error('Failed to fetch import details');
      }
    } catch (error) {
      console.error('Error fetching import details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openImportDetails = (importItem: any) => {
    setSelectedImport(importItem);
    fetchImportDetails(importItem.id);
  };

  const closeModal = () => {
    setSelectedImport(null);
    setImportDetails(null);
  };

  if (imports.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No failed imports found</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Failed Imports</h3>
        <div className="space-y-4">
          {imports.map((importItem) => (
            <div key={importItem.id} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{importItem.filename}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      importItem.importStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {importItem.importStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-1 font-medium">{importItem.importType.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-1 font-medium">{importItem.totalRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success:</span>
                      <span className="ml-1 font-medium text-green-600">{importItem.successfulRecords}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <span className="ml-1 font-medium text-red-600">{importItem.failedRecords}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span>Processed by: {importItem.processor?.firstName ? 
                      `${importItem.processor.firstName} ${importItem.processor.lastName}` : 
                      importItem.processor?.username}</span>
                  </div>
                  <button
                    onClick={() => openImportDetails(importItem)}
                    className="mt-3 text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
                <span className="text-xs text-gray-500 ml-4">
                  {new Date(importItem.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Import Details */}
      {selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Import Details: {selectedImport.filename}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading details...</p>
                </div>
              ) : importDetails ? (
                <ImportDetailsContent details={importDetails} />
              ) : (
                <p className="text-gray-500">Failed to load import details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ImportDetailsContent({ details }: { details: any }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Import Type</div>
          <div className="font-semibold">{details.importType.replace('_', ' ').toUpperCase()}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="font-semibold text-green-600">{details.summary.successRate}%</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Failure Rate</div>
          <div className="font-semibold text-red-600">{details.summary.failureRate}%</div>
        </div>
      </div>

      {/* Record Breakdown */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Record Breakdown</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{details.totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{details.successfulRecords}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{details.failedRecords}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Related Transactions */}
      {details.relatedTransactions && details.relatedTransactions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Related Transactions ({details.relatedTransactions.length})</h4>
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.relatedTransactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-2 text-sm">{tx.inventory.itemName}</td>
                    <td className="px-4 py-2 text-sm">{tx.transactionType}</td>
                    <td className="px-4 py-2 text-sm">{tx.quantity}</td>
                    <td className="px-4 py-2 text-sm">{tx.inventory.warehouseName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Alerts */}
      {details.relatedAlerts && details.relatedAlerts.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Related Alerts ({details.relatedAlerts.length})</h4>
          <div className="space-y-2">
            {details.relatedAlerts.map((alert: any) => (
              <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{alert.inventory.itemName}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.priorityLevel === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.priorityLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processor Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Processed By</h4>
        <div className="text-sm">
          <div><strong>User:</strong> {details.processor.firstName ? 
            `${details.processor.firstName} ${details.processor.lastName}` : 
            details.processor.username}</div>
          <div><strong>Processed:</strong> {new Date(details.createdAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function NegativeStock({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <TrendingDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No negative stock items found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Negative Stock Items</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{item.itemName}</h4>
                <p className="text-sm text-gray-600">
                  {item.warehouseName} • Barcode: {item.barcode}
                </p>
                <p className="text-sm text-purple-600 font-medium">
                  Stock Quantity: {item.stockQty}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                Updated: {new Date(item.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
