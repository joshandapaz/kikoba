const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (!content.includes('export const dynamic')) {
        content = "export const dynamic = 'force-static'\n" + content;
        changed = true;
      }
      
      if (fullPath.includes('[') && fullPath.includes(']') && !content.includes('export function generateStaticParams')) {
        content = content + "\nexport function generateStaticParams() { return []; }\n";
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
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
