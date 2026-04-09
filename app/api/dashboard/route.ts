export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id

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
    const groupBalance = group.wallet_balance || 0

    // 1.5 Get user's wallet balance
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('wallet_balance, phone')
      .eq('id', userId)
      .single()
    
    const walletBalance = userData?.wallet_balance || 0

    // 2. User stats - Savings
    const { data: userSavings } = await supabaseAdmin
      .from('savings')
      .select('amount')
      .eq('userId', userId)
      .eq('groupId', group.id)
    
    const totalSavings = (userSavings || []).reduce((sum: number, s: any) => sum + s.amount, 0)

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

    const groupSavingsTotal = (allSavings || []).reduce((s: number, sv: any) => s + sv.amount, 0)
    const approvedLoansTotal = (allLoans || [])
      .filter((l: any) => ['APPROVED', 'PAID'].includes(l.status))
      .reduce((s: number, l: any) => s + l.amount, 0)
    const pendingVotes = (allLoans || []).filter((l: any) => l.status === 'PENDING').length

    // 5. Recent activities (Showing group activities OR personal wallet activities)
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('*, user:users(username)')
      .or(`groupId.eq.${group.id},and(userId.eq.${userId},groupId.is.null)`)
      .order('date', { ascending: false })
      .limit(10)

    // NEW: Fetch structured transactions
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*, user:users(username)')
      .or(`groupId.eq.${group.id},userId.eq.${userId}`)
      .order('createdAt', { ascending: false })
      .limit(10)

    // 6. Active Group Withdrawal Requests
    const { data: withdrawalRequests } = await supabaseAdmin
      .from('group_withdrawals')
      .select('*, requested_by_user:users(username), votes:group_withdrawal_votes(*)')
      .eq('groupId', group.id)
      .eq('status', 'PENDING')

    return NextResponse.json({
      userId,
      noGroup: false,
      isAdmin,
      group: { id: group.id, name: group.name, joinCode: group.joinCode },
      userStats: {
        walletBalance,
        totalSavings,
        activeLoans: activeLoans.length,
        loanBalance,
        pendingRequests: (userLoans || []).filter((l: any) => l.status === 'PENDING').length,
        registeredPhone: userData?.phone || undefined
      },
      groupStats: {
        totalFunds: Math.max(0, groupSavingsTotal - approvedLoansTotal),
        totalSavings: groupSavingsTotal,
        totalLoansIssued: approvedLoansTotal,
        membersCount: membersCount || 0,
        pendingVotes,
        groupBalance,
      },
      withdrawalRequests: withdrawalRequests || [],
      recentActivities: activities || [],
      recentTransactions: transactions || [],
    })
  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

