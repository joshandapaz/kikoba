export const dynamic = 'force-static'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try selecting all fields including avatar_url
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .eq('id', session.user.id)
      .single()

    // If avatar_url column doesn't exist (error code 42703), fallback to selecting without it
    if (error && error.code === '42703') {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, memberCode, username, email, phone, dateJoined')
        .eq('id', session.user.id)
        .single()
      
      if (userError) throw userError
      user = userData
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username, phone, avatarUrl } = await req.json()
    
    const updateData: any = {}
    if (username) updateData.username = username
    if (phone !== undefined) updateData.phone = phone
    if (avatarUrl) updateData.avatar_url = avatarUrl

    let { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .single()

    // Fallback if avatar_url column is missing
    if (error && error.code === '42703') {
      const fallbackData = { ...updateData }
      delete fallbackData.avatar_url
      
      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .update(fallbackData)
        .eq('id', session.user.id)
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

