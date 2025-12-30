import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { getUserByEmail, createRecoverCode, consumeRecoverCode, setPassword } from '../authStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

// SMTP Settings
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// POST /api/recovery/init
router.post(['/init', '/init-new'], async (req, res) => {
  const { email } = req.body || {};
  console.log(`[Recovery] Init request for email: ${email}`);
  
  if (!email) {
    console.log('[Recovery] Missing email');
    return res.status(400).json({ error: 'missing_email' });
  }
  
  const user = await getUserByEmail(email);
  if (!user) {
    console.log(`[Recovery] Email not found in database: ${email}`);
    return res.status(404).json({ error: 'email_not_found' });
  }
  
  console.log(`[Recovery] User found: ${user.email} (ID: ${user.id})`);
  const { code } = await createRecoverCode(user.email);
  
  const htmlContent = `
    <div style="font-family: sans-serif; color: #fff; background: #000; padding: 20px; border-radius: 10px;">
      <h2 style="color: #fff;">Password Recovery</h2>
      <p style="color: #ccc;">You requested a password reset for LiraOS.</p>
      <p style="color: #ccc;">Your code is:</p>
      <h1 style="color: #a855f7; font-size: 32px; letter-spacing: 2px;">${code}</h1>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore.</p>
    </div>
  `;

  // 1. Try Resend API (HTTP - Reliable)
  if (process.env.RESEND_API_KEY) {
      console.log('[Recovery] Attempting to send via Resend API...');
      try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { data, error } = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'LiraOS <onboarding@resend.dev>',
              to: email,
              subject: 'LiraOS Password Recovery',
              html: htmlContent
          });

          if (error) {
              console.error('[Recovery] Resend API Error:', error);
              throw new Error(error.message);
          }

          console.log(`[Recovery] Email sent via Resend to ${email} (ID: ${data?.id})`);
          return res.json({ success: true });
      } catch (e) {
          console.error('[Recovery] Resend Failed, falling back to SMTP...', e);
          // Continue to SMTP fallback below
      }
  }

  // 2. SMTP Logic (Legacy/Fallback)
  // If no SMTP configured, return code in response for DEV purposes
  if (!SMTP_HOST || !SMTP_USER) {
    console.log(`[Recovery] No SMTP configured. Dev Code: ${code}`);
    return res.json({ success: true, devMode: true, code }); 
  }

  // Force explicit SMTP configuration to bypass 'service: gmail' defaults which might fail in cloud environments
  const transportConfig = {
      host: 'smtp.gmail.com',
      port: 465, // SSL Port (often less blocked than 587)
      secure: true, // Use SSL
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: {
          rejectUnauthorized: false
      }
  };

  const transporter = nodemailer.createTransport({
      ...transportConfig,
      connectionTimeout: 5000, // Fail fast (5s) if blocked
      socketTimeout: 5000
  });

  try {
     await transporter.sendMail({
       from: `"LiraOS System" <${SMTP_USER}>`,
       to: email,
       subject: "LiraOS Password Recovery",
       text: `Your recovery code is: ${code}\n\nUse this code to reset your password.`,
       html: htmlContent
     });
     console.log(`[Recovery] Email sent via SMTP to ${email}`);
     res.json({ success: true });
  } catch (e) {
     console.error('[Recovery] SMTP Error:', e);
     // Fallback for dev if delivery fails: return code so user isn't stuck
     res.status(500).json({ error: 'email_send_failed', devCode: code, details: e.message });
  }
});

// POST /api/recovery/complete
router.post('/complete', async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'missing_fields' });
  
  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  if (await consumeRecoverCode(user.email, code)) {
    await setPassword(user.email, newPassword);
    console.log(`[Recovery] Password reset success for ${email}`);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'invalid_code' });
  }
});

// POST /api/recovery/import (Legacy/Existing)
// Note: This route requires auth, but recovery routes above should NOT require auth.
// So we apply requireAuth ONLY to import.
router.post('/import', requireAuth, (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;
    console.log(`[Recovery] Importing data for user ${userId}`, Object.keys(data));
    res.json({ success: true, message: 'Data imported successfully (stub)' });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
