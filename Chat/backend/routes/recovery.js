import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
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
  
  // If no SMTP configured, return code in response for DEV purposes
  if (!SMTP_HOST || !SMTP_USER) {
    console.log(`[Recovery] No SMTP configured. Dev Code: ${code}`);
    return res.json({ success: true, devMode: true, code }); 
  }

  const transportConfig = (SMTP_HOST.includes('gmail')) ? 
      {
          service: 'gmail',
          auth: { user: SMTP_USER, pass: SMTP_PASS }
      } : {
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
          tls: { rejectUnauthorized: false },
          family: 4 
      };

  const transporter = nodemailer.createTransport({
      ...transportConfig,
      connectionTimeout: 60000,
      socketTimeout: 60000
  });

  try {
     await transporter.sendMail({
       from: `"LiraOS System" <${SMTP_USER}>`,
       to: email,
       subject: "LiraOS Password Recovery",
       text: `Your recovery code is: ${code}\n\nUse this code to reset your password.`,
       html: `
         <div style="font-family: sans-serif; color: #fff; background: #000; padding: 20px;">
           <h2>Password Recovery</h2>
           <p>You requested a password reset for LiraOS.</p>
           <p>Your code is:</p>
           <h1 style="color: #a855f7;">${code}</h1>
         </div>
       `
     });
     console.log(`[Recovery] Email sent to ${email}`);
     res.json({ success: true });
  } catch (e) {
     console.error('[Recovery] SMTP Error:', e);
     // Fallback for dev if SMTP fails: return code so user isn't stuck
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
