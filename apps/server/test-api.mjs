// Test API endpoints
const API = 'http://localhost:3000/api';

// First, get an auth token by logging in
async function getToken() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testvendor@test.com', password: 'test123' })
  });
  if (!res.ok) {
    console.log('Login failed, trying register...');
    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testvendor@test.com', password: 'test123', name: 'Test Vendor', role: 'vendor' })
    });
    const regData = await regRes.json();
    console.log('Register response:', JSON.stringify(regData, null, 2));
    if (regData.token) return regData.token;
    return null;
  }
  const data = await res.json();
  console.log('Login response keys:', Object.keys(data));
  return data.token;
}

async function test() {
  const token = await getToken();
  if (!token) {
    console.log('Could not get token');
    return;
  }
  console.log('Got token:', token.substring(0, 20) + '...');
  
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Test vendor products
  console.log('\n=== Vendor Products Endpoint ===');
  const vendorRes = await fetch(`${API}/vendor/products`, { headers });
  const vendorData = await vendorRes.json();
  console.log('Status:', vendorRes.status);
  console.log('Products count:', Array.isArray(vendorData) ? vendorData.length : 'not array');
  if (Array.isArray(vendorData) && vendorData.length > 0) {
    const p = vendorData[0];
    console.log('First product name:', p.name);
    console.log('Images field:', JSON.stringify(p.images?.slice(0, 1)));
    console.log('Has images?', p.images?.length > 0);
  } else {
    console.log('Raw response:', JSON.stringify(vendorData).substring(0, 200));
  }

  // Test customer products
  console.log('\n=== Customer Products Endpoint ===');
  const custRes = await fetch(`${API}/products`, { headers });
  const custData = await custRes.json();
  console.log('Status:', custRes.status);
  console.log('Product count:', custData.data?.length || 0);
  if (custData.data?.length > 0) {
    const p = custData.data[0];
    console.log('First product name:', p.name);
    console.log('Image field:', p.image);
    console.log('Has image?', !!p.image);
  } else {
    console.log('Raw response:', JSON.stringify(custData).substring(0, 200));
  }
}

test().catch(console.error);
