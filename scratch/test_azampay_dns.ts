import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function checkUrl(url: string) {
  try {
    console.log(`Checking ${url}...`)
    const res = await axios.post(url, {
      appName: process.env.AZAMPAY_APP_NAME,
      clientId: process.env.AZAMPAY_CLIENT_ID,
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
    })
    console.log(`Success on ${url}!`)
    console.log(res.data)
  } catch (err: any) {
    if (err.response) {
      console.log(`Failed on ${url} but reached server. Status: ${err.response.status}`)
    } else {
      console.log(`Failed on ${url} completely: ${err.message}`)
    }
  }
}

async function runTests() {
  await checkUrl('https://sandbox.azampay.co.tz/AppRegistration/GenerateToken')
  await checkUrl('https://sandboxauthenticator.azampay.co.tz/AppRegistration/GenerateToken')
  await checkUrl('https://authenticator.azampay.co.tz/sandbox/AppRegistration/GenerateToken')
  await checkUrl('https://authenticator.azampay.co.tz/AppRegistration/GenerateToken')
}

runTests()
