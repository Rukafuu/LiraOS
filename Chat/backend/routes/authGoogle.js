// Force deploy: fix middleware import
import express from 'express';
import { google } from 'googleapis';
import { getAuthUrl, getToken, saveGoogleToken, oauth2Client } from '../services/googleAuthService.js';
import { getUserById } from '../authStore.js';
import { verifyToken, requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/auth/google-calendar/events
// Helper route to list calendar events for the connected user
router.get('/events', requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const user = await getUserById(userId);
        
        if (!user || !user.googleRefreshToken) {
            return res.status(400).json({ error: 'not_connected' });
        }

        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        res.json(response.data.items);
    } catch (e) {
        console.error('Failed to fetch events', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/google-calendar/connect
// Redirects user to Google OAuth consent screen
router.get('/connect', (req, res) => {
  try {
    const { userId } = req.query; 
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    // We pass userId via state to persist it across the OAuth flow
    const url = getAuthUrl(userId);
    console.log('[Google Auth] Generated URL:', url); 
    res.json({ url });
  } catch (err) {
    console.error('[Google Auth] Connect Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google-calendar/callback
// Handles the code returned by Google
router.get('/callback', async (req, res) => {
  const { code, state } = req.query; // state contains userId
  
  try {
     if (!state) {
         return res.status(400).send('Missing state (userId)');
     }
     
     const userId = state;

     const tokens = await getToken(code);
     await saveGoogleToken(userId, tokens);

     // Redirect back to frontend success page
     res.send(`
       <script>
         if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
         } else {
            document.body.innerHTML = "<h1>Conectado com sucesso! Pode fechar esta janela.</h1>";
         }
       </script>
       <h1>Conectado com sucesso! Pode fechar esta janela.</h1>
     `);
     
  } catch (e) {
    console.error('Google Auth Error:', e);
    // Show exact error to user for debugging
    res.status(500).send(`Authentication failed: ${e.message || JSON.stringify(e)}`);
  }
});

// DEBUG ROUTE - REMOVE IN PRODUCTION LATER
router.get('/debug', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || 'NOT_SET';
  const safeClientId = clientId.length > 10 ? clientId.substring(0,10) + '...' : clientId;
  const usedUri = 'https://liraos-production.up.railway.app/api/auth/google-calendar/callback';
  
  res.json({
    client_id_prefix: safeClientId,
    redirect_uri_configured_in_backend: usedUri,
    message: "Verifique se 'client_id_prefix' bate com o inicio do seu ID no Google Console, e se a 'redirect_uri' está IDÊNTICA na lista de URIs permitidas."
  });
});

export default router;
