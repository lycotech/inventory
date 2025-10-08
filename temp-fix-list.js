// This script fixes all remaining Decimal comparison issues

const files = [
  'app/api/inventory/receive/route.ts',
  'app/api/inventory/stock-out/route.ts', 
  'app/api/inventory/transfer/route.ts',
  'scripts/check-data.ts',
  'scripts/reset-stock-quantities.ts'
];

console.log('Files that need fixing:');
files.forEach(file => console.log(`- ${file}`));

// This is just a reference list - we'll fix them manually