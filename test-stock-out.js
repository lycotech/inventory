// Quick test for stock out API
const fs = require('fs');

// First, let's check if we have any inventory items
console.log('Testing Stock Out functionality...');

// Simulate the API call
const testData = {
  barcode: "TEST123",
  warehouseName: "Main Warehouse", 
  quantity: 1,
  referenceDoc: "TEST-001",
  reason: "Testing stock out"
};

console.log('Test data:', JSON.stringify(testData, null, 2));
console.log('Run this in your browser console on the stock out page:');
console.log(`
fetch('/api/inventory/stock-out', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(testData)})
}).then(r => r.json()).then(console.log).catch(console.error);
`);
