import { google } from 'googleapis';
import prisma from '../prismaClient.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// HARDCODED URI TO PREVENT MISMATCH
const REDIRECT_URI = 'https://liraos-production.up.railway.app/api/auth/google-calendar/callback';

console.log('[Google Auth Config] Client ID:', CLIENT_ID ? 'Set' : 'Missing');
console.log('[Google Auth Config] Redirect URI:', REDIRECT_URI);

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export const getAuthUrl = (userId) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ].join(" "),
    state: userId
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const getToken = async (code) => {
  try {
    console.log('[GoogleAuth] Exchanging code for token with URI:', REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('[GoogleAuth] Token exchange failed:', error.response?.data || error.message);
    throw error;
  }
};

export const saveGoogleToken = async (userId, tokens) => {
  if (tokens.refresh_token) {
    await prisma.user.update({
      where: { id: userId },
      data: { googleRefreshToken: tokens.refresh_token }
    });
    console.log(`Saved Google Refresh Token for user ${userId}`);
  } else {
    console.warn(`No refresh token returned for user ${userId}. User may need to revoke access.`);
  }
};

export const getCalendarClient = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true }
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('User not connected to Google Calendar');
  }

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};
