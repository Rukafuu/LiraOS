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

const target = path.join(process.cwd(), 'Chat');
const files = fs.readdirSync(target);

console.log(`--- DISK USAGE FOR: ${target} ---`);
files.forEach(file => {
    const fullPath = path.join(target, file);
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
