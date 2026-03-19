const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');

const skipKeys = ['NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL'];

for (const line of lines) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...rest] = line.split('=');
  let value = rest.join('=');
  
  // Skip domains since we'll set them manually
  if (skipKeys.includes(key.trim())) continue;

  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  console.log(`Adding ${key}...`);
  try {
    // We create a temporary file to hold the value to avoid shell escaping issues on windows
    fs.writeFileSync('temp_val.txt', value);
    execSync(`npx vercel env add ${key.trim()} production < temp_val.txt`, { stdio: 'inherit' });
    execSync(`npx vercel env add ${key.trim()} preview < temp_val.txt`, { stdio: 'inherit' });
    execSync(`npx vercel env add ${key.trim()} development < temp_val.txt`, { stdio: 'inherit' });
  } catch(e) { 
    console.error(`Failed to add ${key}`);
  }
}
try { fs.unlinkSync('temp_val.txt'); } catch(e) {}
console.log('Finished uploading environment variables (excluding URLs).');
