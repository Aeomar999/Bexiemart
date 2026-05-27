import http from 'http';

const API = 'http://localhost:3000/api';

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || { 'Content-Type': 'application/json' },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function test() {
  // Check health
  const health = await fetchUrl('http://localhost:3000/api/health');
  console.log('Health:', health.status, JSON.stringify(health.data).substring(0, 100));

  // Try customer products first (no auth needed since the endpoint might not have auth guard)
  const custRes = await fetchUrl('http://localhost:3000/api/products');
  console.log('\n=== Customer Products ===');
  console.log('Status:', custRes.status);
  if (custRes.data?.data) {
    console.log('Products:', custRes.data.data.length);
    if (custRes.data.data.length > 0) {
      const p = custRes.data.data[0];
      console.log('First product:', p.name);
      console.log('Image field:', p.image);
      console.log('Has image?', p.image ? 'YES' : 'NO');
    }
  } else {
    console.log('Response:', JSON.stringify(custRes.data).substring(0, 300));
  }

  // Check what products endpoint returns (maybe it's the full response)
  console.log('\n=== Raw Customer Products Response ===');
  const rawRes = await fetchUrl('http://localhost:3000/api/products');
  console.log('Full response:', JSON.stringify(rawRes.data).substring(0, 500));
}

test().catch(console.error);
