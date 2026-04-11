import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function testFetch() {
  console.log('Testing Supabase Client Create...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('Testing Supabase Insert...')
    const { data, error } = await supabaseAdmin.from('payments').insert({
      user_id: 'c6b4ecca-c1e8-4ca8-a2a8-3873825e2f66',
      amount: 5000,
      status: 'PENDING',
      provider: 'AZAMPAY',
      merchant_reference: 'TEST_CP',
      metadata: { type: 'DEPOSIT' }
    })
    console.log('Supabase Insert Error:', error)
  } catch (err: any) {
    console.error('Supabase fetch failed:', err.message)
  }

  try {
    console.log('Testing Azampay Generate Token (LIVE)...')
    const AUTH_BASE_URL = 'https://authenticator.azampay.co.tz'
    const res = await fetch(`${AUTH_BASE_URL}/AppRegistration/GenerateToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: process.env.AZAMPAY_APP_NAME,
        clientId: process.env.AZAMPAY_CLIENT_ID,
        clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
      })
    })
    console.log('AzamPay Token Response:', res.status, await res.text())
  } catch (err: any) {
    console.error('AzamPay Token fetch failed:', err.message)
  }
}

testFetch()
