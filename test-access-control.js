#!/usr/bin/env node

// Test script for role-based access control
// This script tests the access control functionality

const BASE_URL = 'http://localhost:3000';

async function testAccessControl() {
  console.log('🧪 Testing Role-Based Access Control');
  console.log('=====================================\n');

  // Test 1: Admin Login
  console.log('📝 Test 1: Admin Login');
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (adminLogin.ok) {
    console.log('✅ Admin login successful');
    
    // Get session cookie
    const cookies = adminLogin.headers.get('set-cookie');
    console.log('🍪 Session cookie received');
    
    // Test admin access to all pages
    const adminHeaders = { 'Cookie': cookies || '' };
    
    console.log('\n📋 Testing Admin Access:');
    const adminUrls = [
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/users', 
      '/dashboard/import',
      '/dashboard/backup',
      '/dashboard/inventory',
      '/dashboard/stock-aging',
      '/dashboard/reports',
      '/dashboard/alerts'
    ];
    
    for (const url of adminUrls) {
      const response = await fetch(`${BASE_URL}${url}`, { headers: adminHeaders });
      console.log(`${response.ok ? '✅' : '❌'} ${url}: ${response.status}`);
    }
    
  } else {
    console.log('❌ Admin login failed');
  }

  // Test 2: Basic User Login
  console.log('\n📝 Test 2: Basic User Login');
  const basicLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'basic', password: 'basic123' })
  });
  
  if (basicLogin.ok) {
    console.log('✅ Basic user login successful');
    
    // Get session cookie
    const cookies = basicLogin.headers.get('set-cookie');
    console.log('🍪 Session cookie received');
    
    // Test basic user access - should be restricted
    const basicHeaders = { 'Cookie': cookies || '' };
    
    console.log('\n📋 Testing Basic User Access:');
    console.log('Should have access to:');
    const allowedUrls = [
      '/dashboard',
      '/dashboard/inventory/stock-items',
      '/dashboard/alerts',
      '/dashboard/reports',
      '/dashboard/stock-aging'
    ];
    
    for (const url of allowedUrls) {
      const response = await fetch(`${BASE_URL}${url}`, { headers: basicHeaders });
      console.log(`${response.ok ? '✅' : '❌'} ${url}: ${response.status}`);
    }
    
    console.log('\nShould be blocked from:');
    const blockedUrls = [
      '/dashboard/settings',
      '/dashboard/users',
      '/dashboard/import', 
      '/dashboard/backup',
      '/dashboard/inventory'
    ];
    
    for (const url of blockedUrls) {
      const response = await fetch(`${BASE_URL}${url}`, { headers: basicHeaders });
      console.log(`${response.ok ? '❌' : '✅'} ${url}: ${response.status} ${response.ok ? '(SHOULD BE BLOCKED!)' : '(CORRECTLY BLOCKED)'}`);
    }
    
  } else {
    console.log('❌ Basic user login failed');
  }

  console.log('\n🎯 Test Summary Complete');
}

// Run the test
testAccessControl().catch(console.error);
