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
    
    const user = authData.user
    if (!user) throw new Error('Login failed, no user returned')
    
    console.log(`Logged in as ${user.email} (ID: ${user.id})`)
    console.log(`Initiating deposit of ${amount} for phone +${phone}`)

    const { data, error } = await supabase.functions.invoke('azampay-checkout', {
      body: {
        amount,
        phone,
        walletType: 'PERSONAL',
        userId: user.id
      }
    })

    if (error) {
      console.error('Edge Function Error:', error)
      if (error.context) {
        console.error('Error Body:', await error.context.text())
      }
      return
    }

    console.log('Edge Function Response:', data)

    if (data.success) {
      console.log('Successfully initiated MNO checkout via AzamPay!')
      console.log('Transaction ID:', data.externalId)
    } else {
      console.error('AzamPay returned failure:', data)
    }
  } catch (err) {
    console.error('Exception during test:', err)
  }
}

testDeposit()
