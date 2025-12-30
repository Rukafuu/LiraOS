import express from 'express';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

import { createUser, getUserByEmail, getUserById, updateUser, verifyPassword, updateLoginStats, issueRefreshToken, verifyRefreshToken, revokeRefreshToken, createRecoverCode, consumeRecoverCode } from '../authStore.js';
import { signToken, verifyToken } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || `http://localhost:4000`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID || '';
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET || '';

// Params builder
function buildQuery(params) {
  const usp = new URLSearchParams(params);
  return usp.toString();
}

// --- Traditional Auth ---

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body || {};
  console.log(`[Register] Attempt for email: ***, username: ${username}`);
  
  if (!email || !username || !password) {
    console.log('[Register] Missing fields');
    return res.status(400).json({ error: 'missing_fields' });
  }
  
  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    console.log(`[Register] Email already exists (masked)`);
    return res.status(409).json({ error: 'email_exists' });
  }
  
  const created = await createUser(email, username, password);
  if (!created) {
    console.log(`[Register] Failed to create user: ${email}`);
    return res.status(409).json({ error: 'email_exists' });
  }
  
  console.log(`[Register] User created successfully: ${created.id}`);
  const jwt = signToken({ sub: created.id, email: created.email, name: created.username, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const rt = await issueRefreshToken(created.id);
  res.json({ token: jwt, refreshToken: rt.token, user: { id: created.id, email: created.email, username: created.username, avatar: created.avatar, loginCount: created.loginCount, lastLogin: created.lastLogin } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = await getUserByEmail(email || '');
  if (!u) return res.status(401).json({ error: 'invalid_credentials' });
  if (!await verifyPassword(u, password || '')) return res.status(401).json({ error: 'invalid_credentials' });
  const updated = await updateLoginStats(u.email);
  const jwt = signToken({ sub: updated.id, email: updated.email, name: updated.username, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const rt = await issueRefreshToken(updated.id);
  res.json({ token: jwt, refreshToken: rt.token, user: { id: updated.id, email: updated.email, username: updated.username, avatar: updated.avatar, loginCount: updated.loginCount, lastLogin: updated.lastLogin } });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'missing_refresh_token' });
  const entry = await verifyRefreshToken(refreshToken);
  if (!entry) return res.status(401).json({ error: 'invalid_refresh_token' });
  // entry checks id and logic
  // verifyRefreshToken handled expiry check if unimplemented?
  // authStore implementation: returns null if expired.
  // So if entry exists, it is valid. (My authStore implementation checks expiresAt)
  // Wait, my authStore.js I wrote checks expiry.
  // Existing route checked expiry manually `if (Date.now() > entry.expiresAt)`.
  // My authStore `verifyRefreshToken` returns object IF valid.
  // I should check if it needs manual check.
  // My implementation: `if (Date.now() > Number(rt.expiresAt)) return null;`
  // So if entry is returned, it is valid.
  // But I will keep the check purely defensively or simply trust it.
  
  const jwt = signToken({ sub: entry.userId, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  res.json({ token: jwt });
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'missing_refresh_token' });
  const ok = await revokeRefreshToken(refreshToken);
  res.json({ success: ok });
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  const u = await getUserByEmail(payload.email || '');
  if (!u) return res.status(404).json({ error: 'not_found' });
  res.json({ id: u.id, email: u.email, username: u.username, avatar: u.avatar, loginCount: u.loginCount, lastLogin: u.lastLogin });
});

router.put('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });
  
  const updates = req.body || {};
  const ok = await updateUser(payload.sub, updates);
  if (!ok) return res.status(500).json({ error: 'update_failed' });
  
  // Return updated user
  const u = await getUserById(payload.sub);
  if (!u) return res.status(404).json({ error: 'user_not_found' });
  res.json({ id: u.id, email: u.email, username: u.username, avatar: u.avatar, loginCount: u.loginCount, lastLogin: u.lastLogin });
});

// --- OAuth: Google ---

router.get('/google/init', (req, res) => {
  const returnTo = String(req.query.return_to || FRONTEND_URL);
  const stateObj = { nonce: crypto.randomBytes(8).toString('hex'), return_to: returnTo };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  const params = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state
  };
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${buildQuery(params)}`;
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const stateRaw = req.query.state;
    const stateObj = stateRaw ? JSON.parse(Buffer.from(String(stateRaw), 'base64url').toString('utf-8')) : {};
    const returnTo = String(stateObj.return_to || FRONTEND_URL);
    
    if (!code) {
      console.error('[OAuth Google] Missing authorization code');
      return res.status(400).send('Missing code');
    }
    
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: buildQuery({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${OAUTH_REDIRECT_BASE}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenRes.ok) {
      console.error('[OAuth Google] Token exchange failed');
      return res.status(401).send('Token exchange failed');
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const info = await infoRes.json();
    
    console.log(`[OAuth Google] User: ${info.name}, Email: ***`);
    
    const displayName = info.name || (info.email || '').split('@')[0] || 'Google User';
    
    // Try to find existing user
    let acct = info.email ? await getUserByEmail(info.email) : null;
    
    // If user doesn't exist, create one
    if (!acct) {
      if (info.email) {
        console.log(`[OAuth Google] Creating new user: ${info.email}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(info.email, displayName, randomPw);
          console.log(`[OAuth Google] User created successfully: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth Google] Failed to create user:', createError.message);
          // Try to find user again in case of race condition
          acct = await getUserByEmail(info.email);
        }
      } else {
        // No email available - create user with Google ID as identifier
        const fallbackEmail = `google_${info.sub}@oauth.liraos.local`;
        console.log(`[OAuth Google] No email from Google, using fallback: ${fallbackEmail}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(fallbackEmail, displayName, randomPw);
          console.log(`[OAuth Google] Fallback user created: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth Google] Failed to create fallback user:', createError.message);
          acct = await getUserByEmail(fallbackEmail);
        }
      }
    } else {
      console.log(`[OAuth Google] Existing user found: ${acct.id}`);
    }

    // If we still don't have an account, something went very wrong
    if (!acct) {
      console.error('[OAuth Google] Failed to create or find user account');
      return res.redirect(`${returnTo}/?error=account_creation_failed`);
    }
    
    // Update login stats
    const updated = await updateLoginStats(acct.email);
    if (!updated) {
      console.warn('[OAuth Google] Failed to update login stats');
    }
    
    // Issue refresh token
    const rt = await issueRefreshToken(updated?.id || acct.id);
    
    // Create JWT token
    const finalUser = updated || acct;
    const token = signToken({ 
      sub: finalUser.id, 
      email: finalUser.email, 
      name: finalUser.username, 
      exp: Date.now() + 7 * 24 * 3600 * 1000 
    });
    
    // Redirect with all necessary data
    const redirect = `${returnTo}/?oauth=google&token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(rt.token)}&email=${encodeURIComponent(finalUser.email)}&name=${encodeURIComponent(finalUser.username)}&uid=${encodeURIComponent(finalUser.id)}`;
    
    console.log(`[OAuth Google] Success! Redirecting user ${finalUser.id}`);
    res.redirect(redirect);
    
  } catch (e) {
    console.error('[OAuth Google] Unexpected error:', e);
    res.status(500).send('OAuth failed');
  }
});

// --- OAuth: GitHub ---

router.get('/github/init', (req, res) => {
  const returnTo = String(req.query.return_to || FRONTEND_URL);
  const stateObj = { nonce: crypto.randomBytes(8).toString('hex'), return_to: returnTo };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  const params = {
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_BASE}/auth/github/callback`,
    scope: 'read:user user:email',
    state
  };
  const url = `https://github.com/login/oauth/authorize?${buildQuery(params)}`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const stateRaw = req.query.state;
    const stateObj = stateRaw ? JSON.parse(Buffer.from(String(stateRaw), 'base64url').toString('utf-8')) : {};
    const returnTo = String(stateObj.return_to || FRONTEND_URL);
    
    if (!code) {
      console.error('[OAuth GitHub] Missing authorization code');
      return res.status(400).send('Missing code');
    }
    
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: buildQuery({
        code,
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        redirect_uri: `${OAUTH_REDIRECT_BASE}/auth/github/callback`
      })
    });
    
    if (!tokenRes.ok) {
      console.error('[OAuth GitHub] Token exchange failed');
      return res.status(401).send('Token exchange failed');
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'LiraOS' }
    });
    const user = await userRes.json();
    
    // Get user emails
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'LiraOS' }
    });
    const emails = await emailRes.json();
    const primaryEmail = Array.isArray(emails) ? (emails.find(e => e.primary)?.email || emails[0]?.email) : '';
    
    console.log(`[OAuth GitHub] User: ${user.login}, Email: ***`);
    
    // Generate display name
    const displayName = user.name || user.login || (primaryEmail || '').split('@')[0] || 'GitHub User';
    
    // Try to find existing user by email
    let acct = primaryEmail ? await getUserByEmail(primaryEmail) : null;
    
    // If user doesn't exist, create one
    if (!acct) {
      if (primaryEmail) {
        console.log(`[OAuth GitHub] Creating new user: ${primaryEmail}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(primaryEmail, displayName, randomPw);
          console.log(`[OAuth GitHub] User created successfully: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth GitHub] Failed to create user:', createError.message);
          // Try to find user again in case of race condition
          acct = await getUserByEmail(primaryEmail);
        }
      } else {
        // No email available - create user with GitHub ID as identifier
        const fallbackEmail = `github_${user.id}@oauth.liraos.local`;
        console.log(`[OAuth GitHub] No email from GitHub, using fallback: ${fallbackEmail}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(fallbackEmail, displayName, randomPw);
          console.log(`[OAuth GitHub] Fallback user created: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth GitHub] Failed to create fallback user:', createError.message);
          acct = await getUserByEmail(fallbackEmail);
        }
      }
    } else {
      console.log(`[OAuth GitHub] Existing user found: ${acct.id}`);
    }
    
    // If we still don't have an account, something went very wrong
    if (!acct) {
      console.error('[OAuth GitHub] Failed to create or find user account');
      return res.redirect(`${returnTo}/?error=account_creation_failed`);
    }
    
    // Update login stats
    const updated = await updateLoginStats(acct.email);
    if (!updated) {
      console.warn('[OAuth GitHub] Failed to update login stats');
    }
    
    // Issue refresh token
    const rt = await issueRefreshToken(updated?.id || acct.id);
    
    // Create JWT token
    const finalUser = updated || acct;
    const token = signToken({ 
      sub: finalUser.id, 
      email: finalUser.email, 
      name: finalUser.username, 
      exp: Date.now() + 7 * 24 * 3600 * 1000 
    });
    
    // Redirect with all necessary data
    const redirect = `${returnTo}/?oauth=github&token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(rt.token)}&email=${encodeURIComponent(finalUser.email)}&name=${encodeURIComponent(finalUser.username)}&uid=${encodeURIComponent(finalUser.id)}`;
    
    console.log(`[OAuth GitHub] Success! Redirecting user ${finalUser.id}`);
    res.redirect(redirect);
    
  } catch (e) {
    console.error('[OAuth GitHub] Unexpected error:', e);
    res.status(500).send('OAuth failed');
  }
});

// --- OAuth: Patreon ---

router.get('/patreon/init', (req, res) => {
  const returnTo = String(req.query.return_to || FRONTEND_URL);
  const stateObj = { nonce: crypto.randomBytes(8).toString('hex'), return_to: returnTo };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  const params = {
    client_id: PATREON_CLIENT_ID,
    redirect_uri: `${OAUTH_REDIRECT_BASE}/auth/patreon/callback`,
    response_type: 'code',
    scope: 'identity identity[email] identity.memberships',
    state
  };
  const url = `https://www.patreon.com/oauth2/authorize?${buildQuery(params)}`;
  res.redirect(url);
});

router.get('/patreon/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const stateRaw = req.query.state;
    const stateObj = stateRaw ? JSON.parse(Buffer.from(String(stateRaw), 'base64url').toString('utf-8')) : {};
    const returnTo = String(stateObj.return_to || FRONTEND_URL);
    
    if (!code) {
      console.error('[OAuth Patreon] Missing authorization code');
      return res.status(400).send('Missing code');
    }
    
    // Exchange code for access token
    const tokenRes = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: buildQuery({
        code,
        client_id: PATREON_CLIENT_ID,
        client_secret: PATREON_CLIENT_SECRET,
        redirect_uri: `${OAUTH_REDIRECT_BASE}/auth/patreon/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenRes.ok) {
      console.error('[OAuth Patreon] Token exchange failed');
      return res.status(401).send('Token exchange failed');
    }
    
    const tokenData = await tokenRes.json();
    
    // Get user info from Patreon API v2
    const userRes = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields%5Buser%5D=email,full_name,image_url', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    const user = userData.data;
    
    console.log(`[OAuth Patreon] User: ${user.attributes.full_name}, Email: ***`);
    
    const email = user.attributes.email;
    const displayName = user.attributes.full_name || (email || '').split('@')[0] || 'Patreon User';
    const avatar = user.attributes.image_url;
    
    // Try to find existing user
    let acct = email ? await getUserByEmail(email) : null;
    
    // If user doesn't exist, create one
    if (!acct) {
      if (email) {
        console.log(`[OAuth Patreon] Creating new user: ${email}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(email, displayName, randomPw);
          // Update avatar if available
          if (avatar && acct) {
            await updateUser(acct.id, { avatar });
          }
          console.log(`[OAuth Patreon] User created successfully: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth Patreon] Failed to create user:', createError.message);
          acct = await getUserByEmail(email);
        }
      } else {
        // No email available - create user with Patreon ID as identifier
        const fallbackEmail = `patreon_${user.id}@oauth.liraos.local`;
        console.log(`[OAuth Patreon] No email from Patreon, using fallback: ${fallbackEmail}`);
        const randomPw = crypto.randomBytes(16).toString('hex');
        try {
          acct = await createUser(fallbackEmail, displayName, randomPw);
          if (avatar && acct) {
            await updateUser(acct.id, { avatar });
          }
          console.log(`[OAuth Patreon] Fallback user created: ${acct.id}`);
        } catch (createError) {
          console.error('[OAuth Patreon] Failed to create fallback user:', createError.message);
          acct = await getUserByEmail(fallbackEmail);
        }
      }
    } else {
      console.log(`[OAuth Patreon] Existing user found: ${acct.id}`);
      // Update avatar if available
      if (avatar) {
        await updateUser(acct.id, { avatar });
      }
    }

    // If we still don't have an account, something went very wrong
    if (!acct) {
      console.error('[OAuth Patreon] Failed to create or find user account');
      return res.redirect(`${returnTo}/?error=account_creation_failed`);
    }
    
    // Check if user is an active patron and update plan
    if (userData.included && Array.isArray(userData.included)) {
      const memberships = userData.included.filter(item => item.type === 'member');
      if (memberships.length > 0) {
        // User has active memberships - determine tier
        const activeMembership = memberships.find(m => m.attributes.patron_status === 'active_patron');
        if (activeMembership) {
          const amountCents = activeMembership.attributes.currently_entitled_amount_cents;
          let tier = 'free';
          
          if (amountCents >= 20000) tier = 'singularity';
          else if (amountCents >= 10000) tier = 'supernova';
          else if (amountCents >= 5000) tier = 'antares';
          else if (amountCents >= 2000) tier = 'sirius';
          else if (amountCents >= 500) tier = 'vega';
          
          console.log(`[OAuth Patreon] Active patron detected: ${tier} tier ($${amountCents/100})`);
          await updateUser(acct.id, { plan: tier });
          acct = await getUserById(acct.id); // Refresh account data
        }
      }
    }
    
    // Update login stats
    const updated = await updateLoginStats(acct.email);
    if (!updated) {
      console.warn('[OAuth Patreon] Failed to update login stats');
    }
    
    // Issue refresh token
    const rt = await issueRefreshToken(updated?.id || acct.id);
    
    // Create JWT token
    const finalUser = updated || acct;
    const token = signToken({ 
      sub: finalUser.id, 
      email: finalUser.email, 
      name: finalUser.username, 
      exp: Date.now() + 7 * 24 * 3600 * 1000 
    });
    
    // Redirect with all necessary data
    const redirect = `${returnTo}/?oauth=patreon&token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(rt.token)}&email=${encodeURIComponent(finalUser.email)}&name=${encodeURIComponent(finalUser.username)}&uid=${encodeURIComponent(finalUser.id)}`;
    
    console.log(`[OAuth Patreon] Success! Redirecting user ${finalUser.id}`);
    res.redirect(redirect);
    
  } catch (e) {
    console.error('[OAuth Patreon] Unexpected error:', e);
    res.status(500).send('OAuth failed');
  }
});

export default router;
