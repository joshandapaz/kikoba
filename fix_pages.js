const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === 'page.tsx' || file === 'page.js') {
      if (fullPath.includes('[') && fullPath.includes(']')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes('export function generateStaticParams')) {
          // Detect the param name
          const match = fullPath.match(/\[([^\]]+)\]/);
          if (match) {
            let paramName = match[1];
            let dummy = '1';
            if (paramName.startsWith('...')) {
              paramName = paramName.substring(3);
              dummy = "['placeholder']";
            } else {
              dummy = "'1'";
            }
            
            content = content + `\n\nexport function generateStaticParams() { return [{ ${paramName}: ${dummy} }]; }\n`;
            fs.writeFileSync(fullPath, content);
            console.log(`Updated dynamic page: ${fullPath}`);
          }
        }
      }
    }
  });
}

const appPath = path.join(process.cwd(), 'app');
if (fs.existsSync(appPath)) {
  walk(appPath);
} else {
  console.log('App path not found');
}
