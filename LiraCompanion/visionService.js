// Lira Vision Service
// Handles screen capture for AI analysis

const { desktopCapturer, screen } = require('electron');

class VisionService {
    async captureScreen() {
        try {
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.size;

            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width, height }
            });

            const primarySource = sources[0]; // Usually the primary screen
            if (!primarySource) throw new Error('No screen source found');

            // Return as base64 JPEG
            return primarySource.thumbnail.toDataURL('image/jpeg', 80);
        } catch (err) {
            console.error('[Vision] Capture error:', err);
            throw err;
        }
    }
}

module.exports = new VisionService();
