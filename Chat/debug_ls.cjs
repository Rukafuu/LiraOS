const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\conta\\Documents\\Lira';

console.log(`Listando: ${targetPath}`);

try {
    const items = fs.readdirSync(targetPath);
    console.log(`Encontrados ${items.length} itens:`);
    items.forEach(item => {
        try {
            const fullPath = path.join(targetPath, item);
            const stats = fs.statSync(fullPath);
            const type = stats.isDirectory() ? '[DIR]' : '[FILE]';
            console.log(`${type} ${item}`);
        } catch (e) {
            console.log(`[ERR] ${item} (${e.message})`);
        }
    });
} catch (e) {
    console.error('Erro:', e.message);
    
    // Tentar caminho relativo
    console.log('\nTentando ../');
    try {
        const itemsRel = fs.readdirSync('../');
        console.log(`Encontrados ${itemsRel.length} itens (Relativo):`);
        console.log(itemsRel.join(', '));
    } catch (e2) {
        console.error('Erro relativo:', e2.message);
    }
}
