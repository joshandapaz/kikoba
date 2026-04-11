import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Standard client acting like the web app
const supabase = createClient(supabaseUrl, supabaseAnonKey)



async function testDeposit() {
  const phone = '255683267434'
  const amount = 5000

  try {
    console.log('Logging in to get JWT...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@kikoba.com',
      password: 'password123'
    })

    if (authError) throw authError
    
    // We need to test the actual endpoint that the Vercel API is exposing
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const checkoutUrl = `${apiUrl}/api/payments/azampay/checkout`

    console.log(`Endpoint: ${checkoutUrl}`)
    console.log(`Initiating Vercel API checkout for phone +${phone}`)

    const res = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        phone,
        walletType: 'PERSONAL',
        userId: authData.user.id,
      })
    })

    if (!res.ok) {
        console.log(`API returned non-okay status: ${res.status}`)
        console.log(await res.text())
        return
    }

    const data = await res.json()
    console.log('API Response:', data)

  } catch (err) {
    console.error('Exception during test:', err)
  }
}

testDeposit()
