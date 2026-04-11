const fs = require('fs')
const { spawnSync } = require('child_process')
const dotenv = require('dotenv')

const envConfig = dotenv.parse(fs.readFileSync('.env'))

console.log('Syncing variables to Vercel production environment...')

for (const key in envConfig) {
  if (key === 'NEXT_PUBLIC_API_URL' || key === 'NEXT_PUBLIC_APP_URL') {
    // skip these as they need to reflect vercel URL
    continue
  }
  const val = envConfig[key]
  
  console.log(`Adding ${key}...`)
  
  // run: npx vercel env add [key] production --yes
  // we pass the value via stdin
  const v = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
    input: val,
    encoding: 'utf-8'
  })
  
  if (v.status !== 0) {
    console.log(`Failed to add ${key}:`, v.stderr, v.stdout)
  }
}

console.log('Finished syncing environment variables.')
