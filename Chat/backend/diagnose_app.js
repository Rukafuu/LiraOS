
const BASE_URL = 'http://localhost:4000';

async function runDiagnosis() {
  console.log('Starting System Diagnosis...\n');
  const results = {
    health: null,
    register: null,
    login: null,
    sessions: null,
    memories: null,
    apiHealth: null
  };

  // 1. Check Health
  try {
    const res = await fetch(`${BASE_URL}/health`);
    results.health = { status: res.status, ok: res.ok };
    if (res.ok) console.log('✅ /health is UP');
    else console.error('❌ /health failed', res.status);
  } catch (e) {
    console.error('❌ /health error:', e.message);
    results.health = { error: e.message };
  }

  // 2. Register
  const testUser = {
    email: `diag_${Date.now()}@example.com`,
    password: 'password123',
    username: 'diaguser'
  };

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    results.register = { status: res.status, ok: res.ok };

    if (res.ok) {
      console.log('✅ Registration successful');
    } else {
      console.error('❌ Registration failed', data);
    }
  } catch (e) {
    console.error('❌ Registration error:', e.message);
    results.register = { error: e.message };
  }

  // 3. Login
  let token = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const data = await res.json();
    results.login = { status: res.status, ok: res.ok };

    if (res.ok && data.token) {
      token = data.token;
      console.log('✅ Login successful');
    } else {
      console.error('❌ Login failed', data);
    }
  } catch (e) {
    console.error('❌ Login error:', e.message);
    results.login = { error: e.message };
  }

  if (token) {
    const headers = { 'Authorization': `Bearer ${token}` };

    // 4. Check Sessions
    try {
      const res = await fetch(`${BASE_URL}/api/chat/sessions`, { headers });
      const data = await res.json();
      results.sessions = { status: res.status, ok: res.ok, count: Array.isArray(data) ? data.length : 'unknown' };
      if (res.ok) console.log('✅ /api/chat/sessions accessed');
      else console.error('❌ /api/chat/sessions failed', res.status);
    } catch (e) {
      console.error('❌ /api/chat/sessions error:', e.message);
    }

    // 5. Check Memories
    try {
      const res = await fetch(`${BASE_URL}/api/memories`, { headers });
      const data = await res.json();
      results.memories = { status: res.status, ok: res.ok };
      if (res.ok) console.log('✅ /api/memories accessed');
      else console.error('❌ /api/memories failed', res.status);
    } catch (e) {
      console.error('❌ /api/memories error:', e.message);
    }

    // 6. Check /api/health (Protected)
    // Note: Previous manual checks showed 404 for authorized /api/health, let's verify programmatically
    try {
        const res = await fetch(`${BASE_URL}/api/health`, { headers });
        results.apiHealth = { status: res.status, ok: res.ok };
        if (res.ok) console.log('✅ /api/health accessed (Authorized)');
        else console.warn(`⚠️ /api/health returned ${res.status} (Expected if route doesn't exist)`);
    } catch (e) {
        console.error('❌ /api/health error:', e.message);
    }
  } else {
    console.warn('⚠️ Skipping authenticated checks due to login failure');
  }

  console.log('\nDiagnosis Complete.');
  console.log(JSON.stringify(results, null, 2));
}

runDiagnosis();
