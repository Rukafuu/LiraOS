import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let resendInstance = null;
let nodemailerTransporter = null;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_USER = process.env.FEEDBACK_EMAIL_USER || process.env.SMTP_USER;
const SMTP_PASS = process.env.FEEDBACK_EMAIL_PASS || process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'LiraOS <onboarding@resend.dev>';

/**
 * Get or initialize Resend instance
 */
function getResend() {
    if (!RESEND_API_KEY) return null;
    if (!resendInstance) {
        resendInstance = new Resend(RESEND_API_KEY);
    }
    return resendInstance;
}

/**
 * Get or initialize Nodemailer transporter
 */
function getNodemailer() {
    if (!SMTP_USER || !SMTP_PASS) return null;
    if (!nodemailerTransporter) {
        nodemailerTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            tls: { rejectUnauthorized: false }
        });
    }
    return nodemailerTransporter;
}

/**
 * Centralized function to send emails using Resend (priority) or Nodemailer (fallback)
 */
export async function sendEmail({ to, subject, html, text }) {
    console.log(`[EmailService] Attempting to send email to ${to}`);

    // 1. Try Resend
    const resend = getResend();
    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: EMAIL_FROM,
                to: [to],
                subject,
                html,
                text
            });
            if (error) {
                console.error('[EmailService] Resend Error:', error);
            } else {
                console.log(`[EmailService] Email sent via Resend: ${data.id}`);
                return { success: true, method: 'resend' };
            }
        } catch (e) {
            console.error('[EmailService] Resend exception:', e);
        }
    }

    // 2. Try Nodemailer Fallback
    const transporter = getNodemailer();
    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"LiraOS Security" <${SMTP_USER}>`,
                to,
                subject,
                html,
                text
            });
            console.log(`[EmailService] Email sent via Nodemailer`);
            return { success: true, method: 'nodemailer' };
        } catch (e) {
            console.error('[EmailService] Nodemailer Error:', e);
        }
    }

    console.warn('[EmailService] No email delivery method available.');
    return { success: false, error: 'no_delivery_method' };
}
