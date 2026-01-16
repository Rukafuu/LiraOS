import express from 'express';
import { google } from 'googleapis';
import { getAuthUrl, getToken, saveGoogleToken, oauth2Client } from '../services/googleAuthService.js';
import { getUserById } from '../user_store.js';
import { verifyToken, requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- Calendar Operations ---

// GET /api/auth/google-calendar/events
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
            timeMin: (new Date()).toISOString(), // From now
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });
        
        res.json(response.data.items);
    } catch (e) {
        console.error('Failed to fetch events', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/google-calendar/events (Create)
router.post('/events', requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const user = await getUserById(userId);
        if (!user?.googleRefreshToken) return res.status(400).json({ error: 'not_connected' });

        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const { summary, description, location, start, end } = req.body;
        
        const event = {
            summary,
            description,
            location,
            start: { dateTime: start }, // IOS String
            end: { dateTime: end },     // ISO String
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        res.json(response.data);
    } catch (e) {
        console.error('Create event error:', e);
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/auth/google-calendar/events/:eventId (Update)
router.put('/events/:eventId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const user = await getUserById(userId);
        if (!user?.googleRefreshToken) return res.status(400).json({ error: 'not_connected' });

        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const { eventId } = req.params;
        const { summary, description, location, start, end } = req.body;
        
        // Ensure we preserve fields if not sent, but google API usually replaces resource.
        // Better to use PATCH or fetch first. Let's assume frontend sends full object or we use patch.
        // Google uses 'patch' for partial updates.
        
        const patchBody = {};
        if (summary) patchBody.summary = summary;
        if (description) patchBody.description = description;
        if (location) patchBody.location = location;
        if (start) patchBody.start = { dateTime: start };
        if (end) patchBody.end = { dateTime: end };

        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            resource: patchBody,
        });

        res.json(response.data);
    } catch (e) {
        console.error('Update event error:', e);
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/auth/google-calendar/events/:eventId
router.delete('/events/:eventId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub || req.user.id;
        const user = await getUserById(userId);
        if (!user?.googleRefreshToken) return res.status(400).json({ error: 'not_connected' });

        oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const { eventId } = req.params;

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        res.json({ success: true });
    } catch (e) {
        console.error('Delete event error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- OAuth Flow ---

// GET /api/auth/google-calendar/connect
router.get('/connect', (req, res) => {
  try {
    const { userId } = req.query; 
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const url = getAuthUrl(userId);
    console.log('[Google Auth] Generated URL:', url); 
    res.json({ url });
  } catch (err) {
    console.error('[Google Auth] Connect Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google-calendar/callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
     if (!state) {
         return res.status(400).send('Missing state (userId)');
     }
     
     const userId = state;
     const tokens = await getToken(code);
     await saveGoogleToken(userId, tokens);

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
    res.status(500).send(`Authentication failed: ${e.message || JSON.stringify(e)}`);
  }
});

// DEBUG ROUTE
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
