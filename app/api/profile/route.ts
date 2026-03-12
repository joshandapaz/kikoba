import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .eq('id', session.user.id)
      .single()

    if (error) throw error
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

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id, memberCode, username, email, phone, dateJoined, avatar_url')
      .single()

    if (error) throw error
    return NextResponse.json(user)
  } catch (err: any) {
    console.error('Profile PUT error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

