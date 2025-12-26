
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = 'c:/Users/conta/Documents/Lira/Chat/backend/data/lira.db';
const db = new Database(dbPath, { readonly: true });

try {
    // Check if column exists first by selecting * from one user
    const check = db.prepare('SELECT * FROM users LIMIT 1').get();
    if (!check) {
        console.log("No users found.");
    } else {
        // console.log("Columns:", Object.keys(check));
        
        if ('discordId' in check) {
             const stmt = db.prepare('SELECT username, email, discordId FROM users WHERE discordId IS NOT NULL');
             const users = stmt.all();
             users.forEach(u => {
                 if (u.discordId && u.discordId.length > 5) {
                    console.log(`User: ${u.username} | Email: ${u.email} | DiscordID: ${u.discordId}`);
                 }
             });
        } else {
            console.log("Column 'discordId' does not exist in users table.");
        }
    }
} catch (e) {
    console.error("Error:", e);
}
