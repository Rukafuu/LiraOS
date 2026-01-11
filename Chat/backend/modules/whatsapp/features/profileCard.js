import sharp from 'sharp';
import axios from 'axios';
import { simpleStore } from '../data/simpleStore.js';

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001';

async function getProfilePicUrl(userId) {
    try {
        const { data } = await axios.get(`${GATEWAY_URL}/api/users/photo`, {
            params: { userId }
        });
        return data.url;
    } catch { return null; }
}

async function getRoundImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        // Resize and circle mask
        return await sharp(buffer)
            .resize(200, 200)
            .composite([{
                input: Buffer.from(`
                    <svg><rect x="0" y="0" width="200" height="200" rx="100" ry="100" /> </svg>
                `),
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();
    } catch { return null; }
}

export async function generateProfileCard(userId, name) {
    try {
        const user = (await simpleStore.getUser(userId)) || { xp: 0, level: 1, coins: 0 };
        const safeName = (name || user.name || 'User').substring(0, 15);
        const xp = user.xp || 0;
        const level = Math.floor(xp / 1000) + 1;
        
        // 1. Get Avatar
        const pfpUrl = await getProfilePicUrl(userId);
        const avatarBuffer = pfpUrl ? await getRoundImage(pfpUrl) : null;

        // 2. Generate Base Card SVG (adjusted positions)
        const width = 800;
        const height = 400;
        
        // Avatar Placeholder if no image
        const avatarSvg = !avatarBuffer ? `
            <circle cx="150" cy="200" r="80" fill="#374151" />
            <text x="150" y="220" font-family="Arial" font-size="80" fill="#6b7280" text-anchor="middle">?</text>
        ` : '';

        const svgImage = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#111827" rx="20" />
            
            <!-- Header Gradient -->
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#db2777;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="${width}" height="120" fill="url(#grad1)" rx="20" />
            <rect x="0" y="100" width="${width}" height="20" fill="#111827" /> <!-- Cutoff for layered look -->

            <!-- Stats Text -->
            <text x="300" y="190" font-family="Arial" font-size="40" fill="#f3f4f6" font-weight="bold">${safeName}</text>
            <text x="300" y="230" font-family="Arial" font-size="24" fill="#9ca3af">Aventureiro(a) Lira</text>
            
            <text x="300" y="300" font-family="Arial" font-size="24" fill="#10b981">XP: ${xp} / ${(level) * 1000}</text>
            
            <!-- Level in Header -->
             <text x="750" y="80" font-family="Arial" font-size="60" fill="#ffffff" font-weight="bold" text-anchor="end">LVL ${level}</text>

            <!-- Progress Bar -->
            <rect x="300" y="320" width="450" height="20" rx="10" fill="#374151" />
            <rect x="300" y="320" width="${Math.min((xp % 1000) / 1000 * 450, 450)}" height="20" rx="10" fill="#8b5cf6" />
            
            ${avatarSvg}
        </svg>
        `;

        // 3. Composite Everything
        let finalImage = sharp(Buffer.from(svgImage));
        
        if (avatarBuffer) {
            finalImage = finalImage.composite([{
                input: avatarBuffer,
                top: 120, // Positioned slightly overlapping header
                left: 50
            }]);
        }

        return await finalImage.png().toBuffer();
            
    } catch (e) {
        console.error('Profile Gen Error:', e);
        return null;
    }
}
