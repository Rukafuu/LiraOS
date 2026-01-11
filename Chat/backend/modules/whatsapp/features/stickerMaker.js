import sharp from 'sharp';
import path from 'path';

export async function createSticker(imagePath) {
    try {
        const outputPath = imagePath.replace(/\.[^/.]+$/, ".webp");
        
        await sharp(imagePath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 50 })
            .toFile(outputPath);
            
        return outputPath;
    } catch (e) {
        console.error("Sticker Gen Error:", e);
        return null;
    }
}
