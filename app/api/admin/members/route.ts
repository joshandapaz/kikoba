import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Admin: Get all members of a specific group
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')
    if (!groupId) return NextResponse.json({ error: 'groupId inahitajika' }, { status: 400 })

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { data: members, error } = await supabaseAdmin
      .from('group_members')
      .select('*, user:users(id, memberCode, username, email, phone, dateJoined, avatar_url)')
      .eq('groupId', groupId)
      .order('joinedAt', { ascending: true })

    if (error) throw error

    return NextResponse.json(members)
  } catch (err: any) {
    console.error('Admin members GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

// Admin: Change member role
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberId, role, groupId } = await req.json()
    if (!groupId) return NextResponse.json({ error: 'groupId inahitajika' }, { status: 400 })

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { error } = await supabaseAdmin
      .from('group_members')
      .update({ role })
      .eq('id', memberId)
      .eq('groupId', groupId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin members PUT error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

// Admin: Remove member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    const groupId = searchParams.get('groupId')
    
    if (!memberId || !groupId) return NextResponse.json({ error: 'Data inahitajika' }, { status: 400 })

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { error } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', memberId)
      .eq('groupId', groupId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin members DELETE error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

// Admin: Add new member via memberCode
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { memberCode, groupId } = await req.json()
    if (!memberCode || !groupId) {
      return NextResponse.json({ error: 'Tafadhali jaza sehemu zote' }, { status: 400 })
    }

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .eq('role', 'ADMIN')
      .maybeSingle()
    
    if (!adminMembership) {
      return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })
    }

    // Find user by code
    const { data: userToAdd } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('memberCode', memberCode.trim().toUpperCase())
      .single()

    if (!userToAdd) {
      return NextResponse.json({ error: 'Mtumiaji mwenye ID hii hajapatikana' }, { status: 404 })
    }

    // Check if duplicate
    const { data: existing } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('userId', userToAdd.id)
      .eq('groupId', groupId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Mtumiaji huyu tayari ni mwanachama wa kikundi hiki' }, { status: 400 })
    }

    // Add to group
    const { error: addError } = await supabaseAdmin
      .from('group_members')
      .insert({
        userId: userToAdd.id,
        groupId: groupId,
        role: 'MEMBER'
      })

    if (addError) throw addError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin members POST error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

