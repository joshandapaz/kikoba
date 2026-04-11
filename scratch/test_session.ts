import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSession() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@kikoba.com',
    password: 'password123'
  })
  if (authError) {
    console.error('Login error:', authError)
    return
  }
  const session = authData.session
  console.log('Got session?', !!session)
  if (session) {
    console.log('Access token starts with:', session.access_token.substring(0, 10))
  }
}

testSession()
