import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StockResetProps {
  onResetComplete?: (result: any) => void;
}

export default function StockResetComponent({ onResetComplete }: StockResetProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [result, setResult] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  // Fetch current stock summary
  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/reset-stock');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  // Load summary on component mount
  React.useEffect(() => {
    fetchSummary();
  }, []);

  const handleResetStock = async () => {
    if (confirmation !== 'RESET_ALL_STOCK') {
      alert('Please type "RESET_ALL_STOCK" to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/reset-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'RESET_ALL_STOCK',
          reason: reason || 'Administrative stock reset'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setShowConfirm(false);
        setConfirmation('');
        setReason('');
        await fetchSummary(); // Refresh summary
        onResetComplete?.(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to reset stock: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold text-red-600">⚠️ Stock Quantity Reset</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This will reset ALL item quantities to zero. This action creates audit records but is irreversible.
        </p>
      </div>

      {/* Current Stock Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{summary.itemsWithPositiveStock || 0}</div>
            <div className="text-xs text-muted-foreground">Items with Positive Stock</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{summary.itemsWithNegativeStock || 0}</div>
            <div className="text-xs text-muted-foreground">Items with Negative Stock</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{summary.itemsWithZeroStock || 0}</div>
            <div className="text-xs text-muted-foreground">Items with Zero Stock</div>
          </div>
        </div>
      )}

      {!showConfirm ? (
        <div className="space-y-4">
          <Button 
            onClick={() => setShowConfirm(true)}
            variant="destructive"
            disabled={!summary?.itemsWithNonZeroStock || summary.itemsWithNonZeroStock === 0}
          >
            {summary?.itemsWithNonZeroStock === 0 ? 'No Items with Stock to Reset' : 'Reset All Stock Quantities'}
          </Button>
          <Button 
            onClick={fetchSummary}
            variant="outline"
            size="sm"
          >
            Refresh Summary
          </Button>
        </div>
      ) : (
        <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for Reset (Optional):
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual inventory reset, System cleanup"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Type "RESET_ALL_STOCK" to confirm:
            </label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="RESET_ALL_STOCK"
              className="w-full"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleResetStock}
              disabled={loading || confirmation !== 'RESET_ALL_STOCK'}
              variant="destructive"
            >
              {loading ? 'Resetting...' : 'Confirm Reset'}
            </Button>
            <Button
              onClick={() => {
                setShowConfirm(false);
                setConfirmation('');
                setReason('');
              }}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800">✅ Reset Completed Successfully</h4>
          <div className="mt-2 text-sm space-y-1">
            <div>Items Reset: <strong>{result.resetCount}</strong></div>
            <div>Transactions Created: <strong>{result.transactionCount}</strong></div>
            <div>Remaining Items with Non-Zero Stock: <strong>{result.remainingItemsWithNonZeroStock || 0}</strong></div>
            <div>Completed: <strong>{new Date(result.timestamp).toLocaleString()}</strong></div>
          </div>
          {result.resetItems && result.resetItems.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-green-700">
                View Sample Reset Items ({result.resetItems.length} shown)
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {result.resetItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.itemName} ({item.barcode})</span>
                    <span>{item.previousQty} → {item.newQty}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}