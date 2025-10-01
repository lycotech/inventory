const XLSX = require('xlsx');
const fs = require('fs');

// Read the CSV file
const csvData = fs.readFileSync('test-inventory-with-units.csv', 'utf8');

// Parse CSV to workbook
const wb = XLSX.read(csvData, { type: 'string' });

// Write to Excel file
XLSX.writeFile(wb, 'test-inventory-with-units.xlsx');

console.log('Excel file created: test-inventory-with-units.xlsx');