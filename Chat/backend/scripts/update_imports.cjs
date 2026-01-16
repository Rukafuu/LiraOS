const fs = require('fs');
const path = require('path');

const files = [
    '../gamificationStore.js',
    '../services/discordService.js',
    '../routes/authGoogle.js',
    '../routes/chat.js',
    '../routes/discordRoutes.js',
    '../routes/auth.js',
    '../routes/moderation.js',
    '../routes/settings.js',
    '../routes/recovery.js',
    '../routes/trae.js'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Replace './authStore.js' and '../authStore.js'
        // New file is 'user_store.js', so imports should be './user_store.js' or '../user_store.js'
        
        const newContent = content
            .replace(/from '\.\/authStore\.js'/g, "from './user_store.js'")
            .replace(/from '\.\.\/authStore\.js'/g, "from '../user_store.js'")
            .replace(/from '\.\/authStore'/g, "from './user_store.js'")
            .replace(/from '\.\.\/authStore'/g, "from '../user_store.js'");
            
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${file}`);
        } else {
            console.log(`No changes needed for ${file}`);
        }
    } else {
        console.warn(`File not found: ${file}`);
    }
});
