// Test script to check warehouse API in browser console
// Copy and paste this into the browser console on the warehouse management page

console.log('Testing warehouse API...');

fetch('/api/warehouses/manage')
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('Response data:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
