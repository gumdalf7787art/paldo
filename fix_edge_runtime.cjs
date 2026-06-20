const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Prevent duplicate insertion
  if (!content.includes("export const runtime = 'edge';")) {
    // Add the edge runtime export at the top of the file
    content = "export const runtime = 'edge';\n" + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added edge runtime to: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file === 'route.js' || file === 'route.jsx') {
      processFile(fullPath);
    }
  }
}

console.log('Adding edge runtime configuration...');
walkDir(apiDir);
console.log('Edge runtime config complete.');
