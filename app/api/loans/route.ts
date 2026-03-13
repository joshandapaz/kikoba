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
    const status = searchParams.get('status')
    const mine = searchParams.get('mine')

    let query = supabaseAdmin
      .from('loans')
      .select('*, user:users(id, username), group:groups(id, name), votes:loan_votes(*, user:users(id, username)), payments:loan_payments(*)')
      .order('createdAt', { ascending: false })

    if (mine === 'true') {
      query = query.eq('userId', session.user.id)
    }

    if (groupId) {
      query = query.eq('groupId', groupId)
    } else {
      // If no groupId, we need to filter loans from groups the user is a member of
      const { data: userGroups } = await supabaseAdmin
        .from('group_members')
        .select('groupId')
        .eq('userId', session.user.id)
      
      const groupIds = (userGroups || []).map(g => g.groupId)
      if (groupIds.length > 0) {
        query = query.in('groupId', groupIds)
      } else {
        return NextResponse.json([])
      }
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: loans, error } = await query
    if (error) throw error

    return NextResponse.json(loans || [])
  } catch (err: any) {
    console.error('Loans GET error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { groupId, amount, reason, duration } = await req.json()
    if (!groupId || !amount || !reason || !duration) {
      return NextResponse.json({ error: 'Tafadhali jaza sehemu zote' }, { status: 400 })
    }

    // Check membership
    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .single()

    if (!member) return NextResponse.json({ error: 'Wewe si mwanachama wa kikundi hiki' }, { status: 403 })

    // Check for existing active loan
    const { data: activeLoan } = await supabaseAdmin
      .from('loans')
      .select('id')
      .eq('userId', session.user.id)
      .eq('groupId', groupId)
      .in('status', ['PENDING', 'APPROVED'])
      .limit(1)
      .maybeSingle()

    if (activeLoan) {
      return NextResponse.json({ error: 'Una mkopo unaoendelea, subiri ulipe kwanza' }, { status: 400 })
    }

    // Check group balance
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('wallet_balance')
      .eq('id', groupId)
      .single()

    if ((group?.wallet_balance || 0) < amount) {
      return NextResponse.json({ error: 'Salio la mfuko wa kikundi halitoshi kutoa mkopo huu' }, { status: 400 })
    }

    // Create loan
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .insert({
        userId: session.user.id,
        groupId,
        amount,
        reason,
        duration,
        status: 'PENDING_ADMIN'
      })
      .select()
      .single()

    if (loanError) throw loanError

    // Log activity
    await supabaseAdmin
      .from('activities')
      .insert({
        userId: session.user.id,
        groupId,
        action: 'Ameomba mkopo',
        amount
      })

    return NextResponse.json(loan)
  } catch (err: any) {
    console.error('Loans POST error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

