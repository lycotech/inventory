// Test authentication by checking the /me endpoint
fetch('/api/auth/me')
  .then(response => {
    console.log('Auth check - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Auth check - Data:', data);
    
    // If authenticated, test warehouse API
    if (data.user) {
      console.log('User is authenticated, testing warehouse API...');
      return fetch('/api/warehouses/manage');
    } else {
      console.log('User is not authenticated');
      return null;
    }
  })
  .then(response => {
    if (response) {
      console.log('Warehouse API - Status:', response.status);
      return response.json();
    }
    return null;
  })
  .then(data => {
    if (data) {
      console.log('Warehouse API - Data:', data);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
