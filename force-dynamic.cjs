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
        } else if (file.endsWith('route.js') || file.endsWith('page.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Remove edge runtime just in case
            content = content.replace(/export const runtime = ['"]edge['"];?\s*\n?/g, '');
            
            // Add force-dynamic if not present
            if (!content.includes("export const dynamic = 'force-dynamic';") && !content.includes('export const dynamic = "force-dynamic";')) {
                // If it's a client component, we shouldn't add it at the very top before 'use client'
                if (content.includes("'use client'") || content.includes('"use client"')) {
                    content = content.replace(/(['"]use client['"];?\s*\n?)/, "$1\nexport const dynamic = 'force-dynamic';\n");
                } else {
                    content = "export const dynamic = 'force-dynamic';\n" + content;
                }
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Added force-dynamic to:', fullPath);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'app'));
console.log('Done!');
