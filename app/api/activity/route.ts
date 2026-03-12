import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    let query = supabaseAdmin
      .from('activities')
      .select('*, user:users(username)')
      .order('date', { ascending: false })
      .limit(50)

    if (groupId) {
      query = query.eq('groupId', groupId)
    }

    const { data: activities, error } = await query
    if (error) throw error

    return NextResponse.json(activities || [])
  } catch (err: any) {
    console.error('Activity GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

