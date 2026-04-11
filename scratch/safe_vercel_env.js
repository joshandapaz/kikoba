const { spawnSync } = require('child_process')
const fs = require('fs')
const dotenv = require('dotenv')
const envConfig = dotenv.parse(fs.readFileSync('.env'))

const keys = ['AZAMPAY_APP_NAME', 'AZAMPAY_ENV', 'AZAMPAY_CLIENT_SECRET']

keys.forEach(key => {
  const val = envConfig[key]
  if (!val) {
    console.log(`Key ${key} not found in .env`)
    return
  }
  
  console.log(`Updating ${key} (length: ${val.length})...`)
  
  // Use spawn with input to avoid shell mangling
  // On windows, we use npx.cmd
  const res = spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, 'production', '--yes'], { stdio: 'inherit' })
  const addRes = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
    input: val,
    encoding: 'utf-8'
  })
  
  console.log(`Command result for ${key}:`, addRes.status, addRes.stdout, addRes.stderr)
})

