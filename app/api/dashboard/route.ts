import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id

    // 1. Get user's group membership
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('*, group:groups(*)')
      .eq('userId', userId)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ noGroup: true })
    }

    const group = membership.group as any
    const isAdmin = membership.role === 'ADMIN'

    // 2. User stats - Savings
    const { data: userSavings } = await supabaseAdmin
      .from('savings')
      .select('amount')
      .eq('userId', userId)
      .eq('groupId', group.id)
    
    const totalSavings = (userSavings || []).reduce((sum, s) => sum + s.amount, 0)

    // 3. User stats - Loans
    const { data: userLoans } = await supabaseAdmin
      .from('loans')
      .select('*, payments:loan_payments(*)')
      .eq('userId', userId)
      .eq('groupId', group.id)

    const activeLoans = (userLoans || []).filter((l: any) => l.status === 'APPROVED')
    const loanBalance = activeLoans.reduce((sum: number, l: any) => {
      const total = l.amount + (l.amount * l.interestRate) / 100
      const paid = (l.payments || []).reduce((s: number, p: any) => s + p.amount, 0)
      return sum + Math.max(0, total - paid)
    }, 0)

    // 4. Group stats (admin)
    const { data: allSavings } = await supabaseAdmin
      .from('savings')
      .select('amount')
      .eq('groupId', group.id)
    
    const { data: allLoans } = await supabaseAdmin
      .from('loans')
      .select('amount, status')
      .eq('groupId', group.id)
    
    const { count: membersCount } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', group.id)

    const groupSavingsTotal = (allSavings || []).reduce((s, sv) => s + sv.amount, 0)
    const approvedLoansTotal = (allLoans || [])
      .filter((l: any) => ['APPROVED', 'PAID'].includes(l.status))
      .reduce((s, l) => s + l.amount, 0)
    const pendingVotes = (allLoans || []).filter((l: any) => l.status === 'PENDING').length

    // 5. Recent activities
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('*, user:users(username)')
      .eq('groupId', group.id)
      .order('date', { ascending: false })
      .limit(8)

    return NextResponse.json({
      noGroup: false,
      isAdmin,
      group: { id: group.id, name: group.name, joinCode: group.joinCode },
      userStats: {
        totalSavings,
        activeLoans: activeLoans.length,
        loanBalance,
        pendingRequests: (userLoans || []).filter((l: any) => l.status === 'PENDING').length,
      },
      groupStats: {
        totalFunds: Math.max(0, groupSavingsTotal - approvedLoansTotal),
        totalSavings: groupSavingsTotal,
        totalLoansIssued: approvedLoansTotal,
        membersCount: membersCount || 0,
        pendingVotes,
      },
      recentActivities: activities || [],
    })
  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

