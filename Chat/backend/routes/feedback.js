import express from 'express';
import { addFeedback, getFeedback } from '../feedbackStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter (lazy init)
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  
  const user = process.env.FEEDBACK_EMAIL_USER;
  const pass = process.env.FEEDBACK_EMAIL_PASS;
  const to = process.env.FEEDBACK_EMAIL_TO;

  if (!user || !pass || !to) {
    console.warn('[Feedback] Email not configured — set FEEDBACK_EMAIL_USER, FEEDBACK_EMAIL_PASS, FEEDBACK_EMAIL_TO');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  return transporter;
}

// Format email body
function formatEmailBody(userId, feedback, type, rating, context, errorLogs) {
  const ratingEmoji = rating ? ['', '😕', '😐', '🙂', '😊', '🤩'][rating] : 'N/A';
  const typeLabel = { bug: '🐛 Bug Report', feature: '💡 Feature Request', general: '💬 General' }[type] || type;

  let body = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 NEW LIRA FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Type: ${typeLabel}
⭐ Rating: ${ratingEmoji} (${rating || 'N/A'}/5)
👤 User ID: ${userId || 'Anonymous'}
🕐 Time: ${context?.timestamp || new Date().toISOString()}

━━━ USER MESSAGE ━━━
${feedback}

━━━ CONTEXT ━━━
• URL: ${context?.currentPath || 'N/A'}
• Viewport: ${context?.viewport || 'N/A'}
• Language: ${context?.language || 'N/A'}
• Platform: ${context?.platform || 'N/A'}
• User Agent: ${context?.userAgent || 'N/A'}
`;

  if (errorLogs && errorLogs.length > 0) {
    body += `
━━━ ERROR LOGS (${errorLogs.length} entries) ━━━
${errorLogs.join('\n')}
`;
  } else {
    body += `
━━━ ERROR LOGS ━━━
No errors captured ✨
`;
  }

  return body;
}

// Auth is optional (guests can submit too)
router.post('/', async (req, res) => {
  try {
    // Try to get userId from auth if present
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const { verifyToken } = await import('../middlewares/authMiddleware.js');
        const decoded = verifyToken(authHeader.replace('Bearer ', ''));
        userId = decoded?.userId || decoded?.id;
      }
    } catch { /* guest user, no auth */ }

    const { 
      feedback, 
      type = 'general',
      context = {},
      rating,
      errorLogs = []
    } = req.body;

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // 1. Save to DB
    const entry = await addFeedback(userId, feedback, type, rating, { ...context, errorLogs });

    // 2. Send email notification
    const t = getTransporter();
    if (t) {
      const to = process.env.FEEDBACK_EMAIL_TO;
      const typeEmoji = type === 'bug' ? '🐛' : type === 'feature' ? '💡' : '💬';
      const subject = `${typeEmoji} LiraOS Feedback: ${type.toUpperCase()} — ${feedback.substring(0, 50)}${feedback.length > 50 ? '...' : ''}`;

      try {
        await t.sendMail({
          from: `"LiraOS Feedback" <${process.env.FEEDBACK_EMAIL_USER}>`,
          to,
          subject,
          text: formatEmailBody(userId, feedback, type, rating, context, errorLogs)
        });
        console.log(`[Feedback] ✉️ Email sent to ${to}`);
      } catch (emailErr) {
        console.error('[Feedback] ⚠️ Email failed (feedback still saved):', emailErr.message);
      }
    }

    res.json({ 
      success: true, 
      message: 'Thank you for your feedback!',
      id: entry?.id 
    });
  } catch (e) {
    console.error('Failed to save feedback:', e);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Get all feedback (admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const feedbacks = await getFeedback();
    res.json(feedbacks);
  } catch (e) {
    console.error('Failed to read feedback:', e);
    res.status(500).json({ error: 'Failed to read feedback' });
  }
});

export default router;
