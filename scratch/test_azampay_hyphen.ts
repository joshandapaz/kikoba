import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function testAzamPayUrl() {
  // Pattern from recent docs/search: https://authenticator-sandbox.azampay.co.tz
  const url = 'https://authenticator-sandbox.azampay.co.tz/AppRegistration/GenerateToken'
  
  console.log(`Testing AzamPay Sandbox URL: ${url}`)
  
  try {
    const appName = "Kikoba-Smart"
    console.log(`Testing AzamPay Sandbox URL: ${url} (App: ${appName})`)
    
    const res = await axios.post(url, {
      appName,
      clientId: "582b227c-1775-4901-a5fc-e7a56b9f5933",
      clientSecret: "WfbhV3mHCsNmxV3MpEmStQOj17Jpw5V/edPx5OPvSjsGcC/exTMYPxvt2IdFpeJOeGskxUHCi/u0LPxVVvVyh0V2N9fp3EMcEh+95DFeAWhZuaL0iL0cMyu8hDvgOGpZ4n3RZxNCixAfkZo5A8KB3Q/hjtkRU7bEw4Wz2W+HwMJrm7p10PI9vxBov+IdISD8ID8LhKKtqUbeitRcEWA49cGwXh1Bzl2yEHLrYhAMjrtH/6WhwLPsJqCdT2zpw2jlsdJ2VMla5TLN0OxTLnzKCbW4Ynp8DK2zqTtcYCHUa+ku3e57TGDj5Jn3qqQemDF2ceXEQSAKkAMeYYDHAyYalCCeRZFNs9OdAP4k39jQ1abZ8JPcFm8XP/DcPKLUyOQ2OV6RtOatX41DCSgfMMlC9FA2cyTYnwIz5+Ak9JrooeL+5jU6QTEp0+TLoP8TUBPseUqrUQC5lKzQ86sppFRl6z01BKu0LYiq42GggYCGr9It77c9e/lurExEP2EUtDSJbT4YEVcaZpOcJDF0KidUi1J3h9N4Bs9W+nwfXaIduVhG1enNnkUEUtVWpf3jwSc7Ey2uKoQYeZvMu9myZs9F2tAI+YhB2Zj1n3NvHyVL+nbMdfZFehanB0hAaHQMNPyezn2sdNj3ZZCadPmdP+/zs7Sgq19Wt/ge3RRPeyQZ42s=",
    })
    console.log('SUCCESS! Token received.')
    console.log(JSON.stringify(res.data, null, 2))
  } catch (err: any) {
    if (err.response) {
      console.log(`Reached server, but error Status: ${err.response.status}`)
      console.log(JSON.stringify(err.response.data, null, 2))
    } else {
      console.log(`Failed to reach server: ${err.message}`)
    }
  }
}

testAzamPayUrl()
