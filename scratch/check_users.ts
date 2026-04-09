import { createClient } from '@supabase/supabase-js'
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
  // Check auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Auth Users Error:', authError)
  } else {
    console.log('Auth Users count:', authUsers.users.length)
    authUsers.users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Created: ${u.created_at}`)
    })
  }

  // Check public.users table
  const { data: publicUsers, error: publicError } = await supabase.from('users').select('*')
  if (publicError) {
    console.error('Public Users Error:', publicError)
  } else {
    console.log('Public Users count:', publicUsers.length)
    publicUsers.forEach(u => {
      console.log(`ID: ${u.id}, Username: ${u.username}, Phone: ${u.phone}`)
    })
  }
}

checkUsers()
