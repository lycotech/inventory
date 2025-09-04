"use client";

import { useState, useEffect } from "react";

export default function TestAccessControl() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          console.log('Current user:', userData);
        } else {
          console.log('No user logged in');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Access Control Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Current User:</h2>
        {user ? (
          <pre>{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <p>No user logged in</p>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <h2 className="font-semibold">Test Links:</h2>
        <div className="space-y-1">
          <a href="/dashboard" className="block text-blue-600 hover:underline">Dashboard (All users)</a>
          <a href="/dashboard/inventory/stock-items" className="block text-blue-600 hover:underline">Stock Items (All users)</a>
          <a href="/dashboard/settings" className="block text-blue-600 hover:underline">Settings (Admin only)</a>
          <a href="/dashboard/users" className="block text-blue-600 hover:underline">Users (Admin only)</a>
          <a href="/dashboard/import" className="block text-blue-600 hover:underline">Import (Admin/Manager)</a>
          <a href="/dashboard/inventory" className="block text-blue-600 hover:underline">Inventory Management (Admin/Manager)</a>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Login Forms:</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => loginAs('admin', 'admin123')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Login as Admin
          </button>
          <button 
            onClick={() => loginAs('basic', 'basic123')}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Login as Basic User
          </button>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  async function loginAs(username: string, password: string) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
