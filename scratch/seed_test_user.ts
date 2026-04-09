import { createClient } from '@supabase/supabase-js'
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedUser() {
  const email = 'test@kikoba.com'
  const password = 'password123'
  const username = 'test_kikoba' // Unique username
  const phone = '+255000000000'

  console.log('Seeding user:', email)

  // 1. Create or Find Auth User
  let { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: username }
  })

  let userId: string | undefined

  if (authError) {
    if (authError.message === 'A user with this email address has already been registered') {
      console.log('User already exists in Auth, fetching ID...')
      const { data: usersData } = await supabase.auth.admin.listUsers()
      userId = usersData.users.find(u => u.email === email)?.id
    } else {
      console.error('Auth User Creation Error:', authError)
      return
    }
  } else {
    userId = authData?.user?.id
  }

  if (!userId) {
    console.error('Could not find or create user ID')
    return
  }

  console.log('User ID:', userId)

  // 2. Create/Update Public Profile
  const { error: publicError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      username,
      phone,
      password: 'managed_by_supabase',
      wallet_balance: 50000,
      memberCode: 'KKB-TEST-01',
      dateJoined: new Date().toISOString()
    })

  if (publicError) {
    console.error('Public User Upsert Error:', publicError)
  } else {
    console.log('Successfully seeded test user!')
  }
}

seedUser()
