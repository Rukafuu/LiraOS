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

let output = `--- DISK USAGE FOR: ${target} ---\n`;
const results = [];

files.forEach(file => {
    const fullPath = path.join(target, file);
    try {
        const stat = fs.lstatSync(fullPath);
        let size = 0;
        let type = 'FILE';
        if (stat.isDirectory()) {
            size = du(fullPath);
            type = 'DIR';
        } else {
            size = stat.size;
        }
        results.push({ name: file, size: size, type: type });
    } catch (e) {}
});

results.sort((a, b) => b.size - a.size);

results.slice(0, 15).forEach(item => {
    output += `[${item.type}] ${item.name}: ${(item.size / 1024 / 1024).toFixed(2)} MB\n`;
});
output += '------------------\n';

fs.writeFileSync('du_results.txt', output);
console.log('Done writing to du_results.txt');
