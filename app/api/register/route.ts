import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, phone } = await req.json()
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Tafadhali jaza sehemu zote' }, { status: 400 })
    }

    // Check for existing user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email au jina la mtumiaji tayari limetumika' }, { status: 400 })
    }

    // Generate a unique 6-character member code
    let memberCode = ''
    let isUnique = false
    while (!isUnique) {
      memberCode = 'KKB-' + Math.random().toString(36).substring(2, 6).toUpperCase()
      const { data: existingCode } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('memberCode', memberCode)
        .single()
      if (!existingCode) isUnique = true
    }

    const hashed = await bcrypt.hash(password, 10)
    
    // Create user
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        email,
        password: hashed,
        phone,
        memberCode
      })
      .select()
      .single()

    if (createError) throw createError

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

