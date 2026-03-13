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
      
      // Clean existing if we ran before to avoid duplicates
      content = content.replace(/export const dynamic = 'force-static'\n/g, '');
      content = content.replace(/\nexport function generateStaticParams[\s\S]*?\}\n/g, '');
      
      let prefix = "export const dynamic = 'force-static'\n";
      
      if (fullPath.includes('[') && fullPath.includes(']')) {
        let paramName = 'id';
        const match = fullPath.match(/\[([^\]]+)\]/);
        if (match) {
          paramName = match[1];
          if (paramName.startsWith('...')) {
            paramName = paramName.substring(3);
            prefix += `export function generateStaticParams() { return [{ ${paramName}: ['placeholder'] }]; }\n`;
          } else {
            prefix += `export function generateStaticParams() { return []; }\n`;
          }
        }
      }
      
      const newContent = prefix + content;
      fs.writeFileSync(fullPath, newContent);
      console.log(`Updated ${fullPath}`);
    }
  });
}

const apiPath = path.join(process.cwd(), 'app', 'api');
if (fs.existsSync(apiPath)) {
  walk(apiPath);
} else {
  console.log('API path not found');
}
