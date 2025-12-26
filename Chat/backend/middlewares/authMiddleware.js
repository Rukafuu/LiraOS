
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';

// Helper: Verify Token
export function verifyToken(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    
    const [h, b, s] = parts;
    const check = crypto.createHmac('sha256', AUTH_SECRET).update(`${h}.${b}`).digest('base64url');
    
    if (check !== s) return null;
    
    const payload = JSON.parse(Buffer.from(b, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// Helper: Sign Token
export function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// Middleware Express
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
  
  req.user = payload;
  req.userId = payload.sub;
  next();
}
