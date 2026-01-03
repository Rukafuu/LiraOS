
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

async function runSmokeTest() {
  console.log('🔥 Starting Smoke Test...\n');
  let exitCode = 0;

  try {
    // 1. Check Health
    console.log('1. Checking /health...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`/health failed with status ${healthRes.status}`);
    console.log('✅ /health is UP');

    // 2. Check /api/health (New Requirement)
    console.log('2. Checking /api/health...');
    const apiHealthRes = await fetch(`${BASE_URL}/api/health`);
    if (!apiHealthRes.ok) throw new Error(`/api/health failed with status ${apiHealthRes.status}`);
    console.log('✅ /api/health is UP');

    // 3. Register
    console.log('3. Testing Registration...');
    const testUser = {
      email: `smoke_${Date.now()}@example.com`,
      password: 'password123',
      username: 'smokeuser'
    };

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!regRes.ok) {
        const err = await regRes.text();
        throw new Error(`Registration failed: ${regRes.status} - ${err}`);
    }
    const regData = await regRes.json();
    console.log('✅ Registration successful');

    // 4. Login
    console.log('4. Testing Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });

    if (!loginRes.ok) {
        const err = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} - ${err}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error('No token received in login');
    console.log('✅ Login successful');

    // 5. Check Protected Route (Sessions)
    console.log('5. Testing Protected API (Sessions)...');
    const sessRes = await fetch(`${BASE_URL}/api/chat/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!sessRes.ok) throw new Error(`/api/chat/sessions failed with status ${sessRes.status}`);
    console.log('✅ /api/chat/sessions accessed');

  } catch (error) {
    console.error(`\n❌ Smoke Test FAILED: ${error.message}`);
    exitCode = 1;
  } finally {
    console.log('\n🏁 Smoke Test Complete.');
    process.exit(exitCode);
  }
}

runSmokeTest();
