const fs = require('fs');
const path = require('path');

function du(dir) {
    let size = 0;
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stat = fs.lstatSync(fullPath);
                if (stat.isDirectory()) {
                    size += du(fullPath);
                } else {
                    size += stat.size;
                }
            } catch (e) {}
        }
    } catch (e) {
        return 0;
    }
    return size;
}

const root = process.cwd();
const files = fs.readdirSync(root);

console.log('--- DISK USAGE ---');
files.forEach(file => {
    const fullPath = path.join(root, file);
    try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            const size = du(fullPath);
            console.log(`[DIR]  ${file}: ${(size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`[FILE] ${file}: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
        }
    } catch (e) {}
});
console.log('------------------');
