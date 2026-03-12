import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch groups where user is a member
    const { data: memberships } = await supabaseAdmin
      .from('group_members')
      .select('role, group:groups(*)')
      .eq('userId', session.user.id)

    if (!memberships) return NextResponse.json([])

    const groupsWithStats = await Promise.all(memberships.map(async (m: any) => {
      const g = m.group
      
      const { count: membersCount } = await supabaseAdmin
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('groupId', g.id)

      const { count: savingsCount } = await supabaseAdmin
        .from('savings')
        .select('*', { count: 'exact', head: true })
        .eq('groupId', g.id)

      const { count: loansCount } = await supabaseAdmin
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('groupId', g.id)

      return {
        ...g,
        userRole: m.role,
        _count: {
          members: membersCount || 0,
          savings: savingsCount || 0,
          loans: loansCount || 0
        }
      }
    }))
    
    return NextResponse.json(groupsWithStats)
  } catch (err: any) {
    console.error('Group GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, description, memberCodes } = await req.json()
    if (!name) return NextResponse.json({ error: 'Jina la kikundi linahitajika' }, { status: 400 })

    // Generate random joinCode
    const joinCode = 'JNC-' + Math.random().toString(36).substring(2, 6).toUpperCase()

    // Create group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name,
        description,
        joinCode,
        createdBy: session.user.id
      })
      .select()
      .single()


    if (groupError) throw groupError

    // Add creator as ADMIN
    await supabaseAdmin
      .from('group_members')
      .insert({
        userId: session.user.id,
        groupId: group.id,
        role: 'ADMIN'
      })

    // Log activity
    await supabaseAdmin
      .from('activities')
      .insert({
        userId: session.user.id,
        groupId: group.id,
        action: `Ameunda kikundi: ${name}`
      })

    // Add other members if codes provided
    if (memberCodes && typeof memberCodes === 'string') {
      const codes = memberCodes.split(',').map((c: string) => c.trim().toUpperCase()).filter(Boolean)
      
      if (codes.length > 0) {
        const { data: usersToAdd } = await supabaseAdmin
          .from('users')
          .select('id')
          .in('memberCode', codes)

        if (usersToAdd && usersToAdd.length > 0) {
          const membersData = usersToAdd.map((u: any) => ({
            userId: u.id,
            groupId: group.id,
            role: 'MEMBER'
          }))


          await supabaseAdmin.from('group_members').insert(membersData)
        }
      }
    }

    return NextResponse.json(group)
  } catch (err: any) {
    console.error('Group POST error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

