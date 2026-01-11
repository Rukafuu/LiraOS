// Lira RPA (Robotic Process Automation) Service
// Handles file organization, cleaning and system management

const fs = require('fs');
const path = require('path');
const os = require('os');
const { shell } = require('electron');

class RPAService {
    constructor() {
        this.desktopPath = path.join(os.homedir(), 'Desktop');
        this.downloadsPath = path.join(os.homedir(), 'Downloads');
        this.documentsPath = path.join(os.homedir(), 'Documents');
        
        // Mapping of extensions to target folders
        this.organizationMap = {
            'images': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
            'documents': ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv'],
            'executables': ['.exe', '.msi', '.bat', '.sh'],
            'archives': ['.zip', '.rar', '.7z', '.tar', '.gz'],
            'coding': ['.json', '.js', '.ts', '.html', '.css', '.py', '.cpp', '.c', '.go']
        };
    }

    /**
     * Lists files on the Desktop that need organizing
     */
    async scanDesktop() {
        try {
            const files = await fs.promises.readdir(this.desktopPath);
            const report = {
                total: files.length,
                categories: {
                    images: 0,
                    documents: 0,
                    executables: 0,
                    archives: 0,
                    coding: 0,
                    others: 0
                },
                filesToMove: []
            };

            for (const file of files) {
                const fullPath = path.join(this.desktopPath, file);
                const stats = await fs.promises.stat(fullPath);
                
                if (stats.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    let categorized = false;

                    for (const [category, extensions] of Object.entries(this.organizationMap)) {
                        if (extensions.includes(ext)) {
                            report.categories[category]++;
                            report.filesToMove.push({ file, category, ext });
                            categorized = true;
                            break;
                        }
                    }

                    if (!categorized) report.categories.others++;
                }
            }

            return report;
        } catch (err) {
            console.error('[RPA] Scan error:', err);
            throw err;
        }
    }

    /**
     * Performs the "Faxina" (Cleaning)
     * Moves files from Desktop to categorized folders in Documents/LiraOrganized
     */
    async performCleaning() {
        const report = await this.scanDesktop();
        const organizedDir = path.join(this.documentsPath, 'LiraOrganized');
        
        if (!fs.existsSync(organizedDir)) {
            fs.mkdirSync(organizedDir);
        }

        const stats = {
            moved: 0,
            errors: 0
        };

        for (const item of report.filesToMove) {
            try {
                const targetDir = path.join(organizedDir, item.category);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir);
                }

                const sourcePath = path.join(this.desktopPath, item.file);
                const targetPath = path.join(targetDir, item.file);

                // Check if file already exists in target
                let finalTargetPath = targetPath;
                if (fs.existsSync(targetPath)) {
                    const name = path.parse(item.file).name;
                    const ext = path.parse(item.file).ext;
                    finalTargetPath = path.join(targetDir, `${name}_${Date.now()}${ext}`);
                }

                await fs.promises.rename(sourcePath, finalTargetPath);
                stats.moved++;
            } catch (err) {
                console.error(`[RPA] Failed to move ${item.file}:`, err);
                stats.errors++;
            }
        }

        return stats;
    }

    /**
     * Opens the organized folder
     */
    openOrganizedFolder() {
        const organizedDir = path.join(this.documentsPath, 'LiraOrganized');
        if (fs.existsSync(organizedDir)) {
            shell.openPath(organizedDir);
        }
    }

    /**
     * Cleans temporary files (simplified)
     */
    async cleanTempFiles() {
        const tempPath = os.tmpdir();
        // In a real app, we would scan and delete cautiously.
        // For security, let's just return the size for now.
        return { message: 'Temp scan simulation completed.', path: tempPath };
    }
}

module.exports = new RPAService();
