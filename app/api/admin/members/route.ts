import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Admin: Get all members of user's group
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('groupId')
      .eq('userId', session.user.id)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { data: members, error } = await supabaseAdmin
      .from('group_members')
      .select('*, user:users(id, memberCode, username, email, phone, dateJoined)')
      .eq('groupId', adminMembership.groupId)
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

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('groupId')
      .eq('userId', session.user.id)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { memberId, role } = await req.json()
    
    const { error } = await supabaseAdmin
      .from('group_members')
      .update({ role })
      .eq('id', memberId)
      .eq('groupId', adminMembership.groupId) // Safety check

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

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('groupId')
      .eq('userId', session.user.id)
      .eq('role', 'ADMIN')
      .maybeSingle()

    if (!adminMembership) return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId inahitajika' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', memberId)
      .eq('groupId', adminMembership.groupId) // Safety check

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

    const { data: adminMembership } = await supabaseAdmin
      .from('group_members')
      .select('groupId')
      .eq('userId', session.user.id)
      .eq('role', 'ADMIN')
      .maybeSingle()
    
    if (!adminMembership) {
      return NextResponse.json({ error: 'Ruhusa inahitajika' }, { status: 403 })
    }

    const { memberCode } = await req.json()
    if (!memberCode) {
      return NextResponse.json({ error: 'Tafadhali weka ID ya mwanachama' }, { status: 400 })
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
      .eq('groupId', adminMembership.groupId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Mtumiaji huyu tayari ni mwanachama wa kikundi hiki' }, { status: 400 })
    }

    // Add to group
    const { error: addError } = await supabaseAdmin
      .from('group_members')
      .insert({
        userId: userToAdd.id,
        groupId: adminMembership.groupId,
        role: 'MEMBER'
      })

    if (addError) throw addError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin members POST error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

