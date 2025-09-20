"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddNewItemForm from '@/components/inventory/add-new-item';

export default function AddNewItemPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleItemAdded = (item: any) => {
    setShowSuccess(true);
    // Optionally navigate back to inventory list after a delay
    setTimeout(() => {
      router.push('/dashboard/inventory');
    }, 2000);
  };

  const handleClose = () => {
    router.push('/dashboard/inventory');
  };

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-green-50 dark:bg-green-900 rounded-lg">
        <div className="text-center">
          <div className="text-6xl text-green-600 mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
            Item Added Successfully!
          </h2>
          <p className="text-green-700 dark:text-green-300 mb-4">
            The new inventory item has been created and added to your inventory.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Redirecting to inventory list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <AddNewItemForm onItemAdded={handleItemAdded} onClose={handleClose} />
    </div>
  );
}