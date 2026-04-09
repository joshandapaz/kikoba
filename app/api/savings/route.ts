export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'

import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    let query = supabaseAdmin
      .from('savings')
      .select('*, group:groups(name)')
      .eq('userId', user.id)
      .order('date', { ascending: false })

    if (groupId) {
      query = query.eq('groupId', groupId)
    }

    const { data: savings, error } = await query

    if (error) throw error

    const total = (savings || []).reduce((sum: number, s: any) => sum + s.amount, 0)
    return NextResponse.json({ savings: savings || [], total })
  } catch (err: any) {
    console.error('Savings GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, amount, note } = await req.json()
    if (!groupId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Tafadhali jaza taarifa sahihi' }, { status: 400 })
    }

    // Check membership
    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('userId', user.id)
      .eq('groupId', groupId)
      .single()

    if (!member) return NextResponse.json({ error: 'Wewe si mwanachama wa kikundi hiki' }, { status: 403 })

    // Create saving
    const { data: saving, error: saveError } = await supabaseAdmin
      .from('savings')
      .insert({
        userId: user.id,
        groupId,
        amount,
        note
      })
      .select()
      .single()

    if (saveError) throw saveError

    // Log activity
    await supabaseAdmin
      .from('activities')
      .insert({
        userId: user.id,
        groupId,
        action: 'Amechangia akiba',
        amount,
      })

    return NextResponse.json(saving)
  } catch (err: any) {
    console.error('Savings POST error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

