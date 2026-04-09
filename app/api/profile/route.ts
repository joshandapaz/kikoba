export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user_auth = await getSupabaseUser(req)
    if (!user_auth?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try selecting all fields including avatar_url
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .eq('id', user_auth.id)
      .single()

    let user = userData

    // If avatar_url column doesn't exist (error code 42703), fallback to selecting without it
    if (error && error.code === '42703') {
      const { data: fallbackData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, memberCode, username, email, phone, dateJoined')
        .eq('id', user.id)
        .single()
      
      if (userError) throw userError
      user = fallbackData
    } else if (error) {
      throw error
    }

    return NextResponse.json(user)
  } catch (err: any) {
    console.error('Profile GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user_auth = await getSupabaseUser(req)
    if (!user_auth?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username, phone, avatarUrl } = await req.json()
    
    const updateData: any = {}
    if (username) updateData.username = username
    if (phone !== undefined) updateData.phone = phone
    if (avatarUrl) updateData.avatar_url = avatarUrl

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .single()

    let user = updatedUser

    // Fallback if avatar_url column is missing
    if (error && error.code === '42703') {
      const fallbackData = { ...updateData }
      delete fallbackData.avatar_url
      
      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .update(fallbackData)
        .eq('id', user.id)
        .select('id, memberCode, username, email, phone, dateJoined')
        .single()
      
      if (fallbackError) throw fallbackError
      user = fallbackUser
    } else if (error) {
      throw error
    }

    return NextResponse.json(user)
  } catch (err: any) {
    console.error('Profile PUT error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

