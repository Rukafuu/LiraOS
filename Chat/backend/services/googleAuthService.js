import { google } from 'googleapis';
import prisma from '../prismaClient.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 
                     (process.env.OAUTH_REDIRECT_BASE ? `${process.env.OAUTH_REDIRECT_BASE}/api/auth/google/callback` : 'http://localhost:4000/api/auth/google/callback');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

export const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh_token
    scope: scopes,
    prompt: 'consent' // Force user to re-authorize to ensure we get a refresh token
  });
};

export const getToken = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
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
