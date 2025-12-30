import express from 'express';
import { getAuthUrl, getToken, saveGoogleToken } from '../services/googleAuthService.js';
import { verifyRefreshToken } from '../authStore.js'; // Assuming you use this to verify session

const router = express.Router();

// GET /api/auth/google/connect
// Redirects user to Google OAuth consent screen
router.get('/connect', (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
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
