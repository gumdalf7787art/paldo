const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file === 'node_modules' || file === '.next' || file === '.git') continue;
            processDirectory(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("export const runtime = 'edge';") || content.includes('export const runtime = "edge";')) {
                content = content.replace(/export const runtime = ['"]edge['"];?\s*\n?/g, '');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Removed from:', fullPath);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'app'));
console.log('Done!');
