import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function generateMemberCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KKB-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '255' + clean.substring(1)
  if (clean.length === 9 && !clean.startsWith('255')) clean = '255' + clean
  return clean
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, phone } = await req.json()

    if (!username || !email || !password || !phone) {
      return NextResponse.json({ error: 'Tafadhali jaza sehemu zote.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Nywila lazima iwe na herufi 8 au zaidi.' }, { status: 400 })
    }

    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so no email verification needed
      user_metadata: {
        username,
        phone: normalizePhone(phone),
        full_name: username,
      }
    })

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'Barua pepe hii tayari ina akaunti. Ingia badala yake.' }, { status: 409 })
      }
      console.error('[Register] Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id
    const memberCode = generateMemberCode()
    const hashedPassword = await bcrypt.hash(password, 10)

    // Step 2: Create user profile row in users table
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: userId,
      memberCode,
      username,
      email,
      password: hashedPassword,
      phone: normalizePhone(phone),
      wallet_balance: 0,
    })

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('[Register] Profile insert error:', profileError)
      return NextResponse.json({ error: `Hitilafu kwenye kuunda wasifu: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Akaunti imeundwa. Ingia sasa.' })

  } catch (err: any) {
    console.error('[Register] Exception:', err)
    return NextResponse.json({ error: err.message || 'Hitilafu ya seva.' }, { status: 500 })
  }
}
