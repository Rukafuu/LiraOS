import express from 'express';
import { getAuthUrl, getToken, saveGoogleToken } from '../services/googleAuthService.js';
import { verifyRefreshToken } from '../authStore.js'; // Assuming you use this to verify session

const router = express.Router();

// GET /api/auth/google/connect
// Redirects user to Google OAuth consent screen
router.get('/connect', (req, res) => {
  try {
    // NOTE: userId should come from a session or authenticated user context, not directly from req.
    // For this example, let's assume it's available or passed in a query param for simplicity,
    // but in a real app, it would be from req.user.id after authentication.
    const { userId } = req.query; // Temporarily get userId from query for testing
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const url = getAuthUrl(userId);
    console.log('[Google Auth] Generated URL:', url); // Log for verification
    res.json({ url });
  } catch (err) {
    console.error('[Google Auth] Connect Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google/callback
// Handles the code returned by Google
router.get('/callback', async (req, res) => {
  const { code, state } = req.query; // state can be used to pass userId securely
  
  // NOTE: In a proper flow, 'state' should contain the userId or we should handle this 
  // by having the frontend send the code to a POST endpoint with the user's auth token.
  // BUT: Google redirects directly to backend. 

  // Option 1: Capture code in frontend, then send to backend with Auth header (Better DX)
  // Option 2: Handle redirect in backend, requires cookie session or state param.

  // Let's assume we are doing Option 1 (Frontend Redirect Flow) which is easier for SPAs.
  // Wait, no. The 'code' comes to backend via browser redirect.
  
  // Let's implement a simple HTML response that closes itself and notifies opener
  // OR redirects back to frontend with status.

  try {
     // If we rely on frontend to initiate and catch the code:
     // The frontend window.open(url) -> user accepts -> google redirects to localhost:4000...
     // This route receives the code.
     
     // PROBLEM: We don't know WHICH user this is without a session cookie or state param.
     // HACK: Pass userId in state.
     
     if (!state) {
         return res.status(400).send('Missing state (userId)');
     }
     
     const userId = state; // Simple for now. Encrypt in prod.

     const tokens = await getToken(code);
     await saveGoogleToken(userId, tokens);

     // Redirect back to frontend success page
     res.send(`
       <script>
         window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
         window.close();
       </script>
       <h1>Conectado com sucesso! Pode fechar esta janela.</h1>
     `);
     
  } catch (e) {
    console.error('Google Auth Error:', e);
    res.status(500).send('Authentication failed');
  }
});

export default router;
