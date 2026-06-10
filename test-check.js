async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/auth/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
