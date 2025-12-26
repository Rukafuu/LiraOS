import db from './db/index.js';

try {
    const stmt = db.prepare('SELECT username, discordId, email FROM users WHERE discordId IS NOT NULL AND discordId != ""');
    const users = stmt.all();

    console.log("--- START USERS ---");
    if (users.length === 0) {
        console.log("No users with Discord IDs found.");
    } else {
        users.forEach(u => {
            console.log(`Found: ${u.username} | ${u.email} | ${u.discordId}`);
        });
    }
    console.log("--- END USERS ---");
} catch (e) {
    console.error("Error querying database:", e);
    // If column doesn't exist, we'll know
}
