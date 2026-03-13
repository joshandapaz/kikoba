const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export const dynamic')) {
        const newContent = "export const dynamic = 'force-static'\n" + content;
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

const apiPath = path.join(process.cwd(), 'app', 'api');
if (fs.existsSync(apiPath)) {
  walk(apiPath);
} else {
  console.log('API path not found');
}
