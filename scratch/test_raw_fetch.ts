import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDeposit() {
  const phone = '255683267434'
  const amount = 5000

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@kikoba.com',
      password: 'password123'
    })
    if (authError) throw authError
    const user = authData.user!
    const token = authData.session!.access_token
    
    console.log(`Testing raw fetch with valid JWT and NO apikey header...`)

    const res = await fetch(`${supabaseUrl}/functions/v1/dummy-checkout-does-not-exist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': `${token}`
      },
      body: JSON.stringify({
        amount,
        phone,
        walletType: 'PERSONAL',
        userId: user.id
      })
    })

    const bodyText = await res.text()
    console.log('Status:', res.status, res.statusText)
    console.log('Response:', bodyText)

  } catch (err) {
    console.error('Exception during test:', err)
  }
}

testDeposit()
