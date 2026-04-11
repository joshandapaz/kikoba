import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function run() {
  const { data } = await supabase.auth.signInWithPassword({
    email: 'test@kikoba.com',
    password: 'password123'
  })
  const token = data.session!.access_token
  
  // parse JWT manually
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))

  console.log(JSON.parse(jsonPayload))
}
run()
