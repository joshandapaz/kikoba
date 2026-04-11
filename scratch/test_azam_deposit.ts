import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDeposit() {
  const phone = '255683267434'
  const amount = 5000

  console.log(`initiating deposit of ${amount} for phone +${phone}`)

  try {
    // We already know from check_users.ts that test@kikoba.com has a user id.
    // Let's query the specific user ID by phone or email.
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers()
    if (usersErr) throw usersErr
    
    // Fallback to the first available user if test user is missing
    const user = usersData.users.find(u => u.email === 'test@kikoba.com') || usersData.users[0]
    
    if (!user) throw new Error('No user found to test with')
    
    console.log('Sending request to Supabase Edge Function: azampay-checkout')
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
