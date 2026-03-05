import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getUserByEmail, createRecoverCode, consumeRecoverCode, setPassword } from '../user_store.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

// Email transporter (reuses FEEDBACK_EMAIL_* or SMTP_* config)
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  
  // Priority: FEEDBACK_EMAIL (Gmail App Password) > SMTP (legacy)
  const user = process.env.FEEDBACK_EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.FEEDBACK_EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Recovery] ⚠️ No email configured — set FEEDBACK_EMAIL_USER + FEEDBACK_EMAIL_PASS');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  console.log(`[Recovery] ✉️ Email transporter ready (${user})`);
  return transporter;
}

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
  const result = await createRecoverCode(user.email);
  
  if (!result) {
    return res.status(500).json({ error: 'failed_to_create_code' });
  }

  const { code } = result;
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #0a0a0f, #1a1a2e); padding: 40px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #fff; font-size: 24px; margin: 0;">🔐 LiraOS</h1>
        <p style="color: #888; font-size: 14px; margin-top: 8px;">Password Recovery</p>
      </div>
      <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #ccc; font-size: 14px; margin: 0 0 12px 0;">Your recovery code is:</p>
        <h1 style="color: #a855f7; font-size: 40px; letter-spacing: 6px; margin: 0; font-family: monospace;">${code}</h1>
      </div>
      <p style="color: #666; font-size: 12px; text-align: center;">This code expires in 15 minutes.<br/>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  // Try sending email
  const t = getTransporter();
  if (t) {
    try {
      const fromUser = process.env.FEEDBACK_EMAIL_USER || process.env.SMTP_USER;
      await t.sendMail({
        from: `"LiraOS Security" <${fromUser}>`,
        to: email,
        subject: '🔐 LiraOS — Password Recovery Code',
        html: htmlContent,
        text: `Your LiraOS recovery code is: ${code}\n\nThis code expires in 15 minutes.`
      });
      console.log(`[Recovery] ✉️ Email sent to ${email}`);
      return res.json({ success: true });
    } catch (e) {
      console.error('[Recovery] ⚠️ Email failed:', e.message);
      // Fall through to dev mode
    }
  }

  // Dev mode fallback: return code in response
  console.log(`[Recovery] 📧 No email sent. Dev Code: ${code}`);
  return res.json({ success: true, devMode: true, code });
});

// POST /api/recovery/complete
router.post('/complete', async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'missing_fields' });
  
  const user = await getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  if (await consumeRecoverCode(user.email, code)) {
    await setPassword(user.email, newPassword);
    console.log(`[Recovery] ✅ Password reset success for ${email}`);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'invalid_code' });
  }
});

// POST /api/recovery/import (Legacy)
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
