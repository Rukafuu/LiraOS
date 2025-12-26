const fs = require('fs');
const path = require('path');

const keep = [
    '.git',
    '.gitignore',
    'Chat',
    'DEPLOY_GUIDE.md',
    '.env',
    '.env.production.example',
    '_archive',
    '_assets',
    'nuke_trash.cjs'
];

const root = process.cwd();
const files = fs.readdirSync(root);

console.log('--- NUKING TRASH ---');

files.forEach(file => {
    if (!keep.includes(file)) {
        const fullPath = path.join(root, file);
        console.log(`Deleting: ${file}`);
        try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`✅ Deleted: ${file}`);
        } catch (e) {
             console.error(`❌ Failed to delete ${file}: ${e.message}`);
        }
    } else {
        console.log(`Skipping: ${file}`);
    }
});
