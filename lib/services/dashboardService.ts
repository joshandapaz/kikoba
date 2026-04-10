import { supabase } from '@/lib/supabase'

export const dashboardService = {
  async getDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const userId = user.id

      // 1. Get user's group membership
      const { data: membership, error: memberError } = await supabase
        .from('group_members')
        .select('*, group:groups(*)')
        .eq('userId', userId)
        .maybeSingle()

      if (memberError || !membership) {
        return { noGroup: true }
      }

      const group = membership.group as any
      const isAdmin = membership.role === 'ADMIN'
      const groupBalance = group.wallet_balance || 0

      // 1.5 Get user's wallet balance
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_balance, phone')
        .eq('id', userId)
        .single()
      
      const walletBalance = userData?.wallet_balance || 0

      // 2. User stats - Savings
      const { data: userSavings } = await supabase
        .from('savings')
        .select('amount')
        .eq('userId', userId)
        .eq('groupId', group.id)
      
      const totalSavings = (userSavings || []).reduce((sum: number, s: any) => sum + s.amount, 0)

      // 3. User stats - Loans
      const { data: userLoans } = await supabase
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
      const { data: allSavings } = await supabase
        .from('savings')
        .select('amount')
        .eq('groupId', group.id)
      
      const { data: allLoans } = await supabase
        .from('loans')
        .select('amount, status')
        .eq('groupId', group.id)
      
      const { count: membersCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('groupId', group.id)

      const groupSavingsTotal = (allSavings || []).reduce((s: number, sv: any) => s + sv.amount, 0)
      const approvedLoansTotal = (allLoans || [])
        .filter((l: any) => ['APPROVED', 'PAID'].includes(l.status))
        .reduce((s: number, l: any) => s + l.amount, 0)
      const pendingVotes = (allLoans || []).filter((l: any) => l.status === 'PENDING').length

      // 5. Recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*, user:users(username)')
        .or(`groupId.eq.${group.id},and(userId.eq.${userId},groupId.is.null)`)
        .order('date', { ascending: false })
        .limit(10)

      // Fetch structured transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, user:users(username)')
        .or(`groupId.eq.${group.id},userId.eq.${userId}`)
        .order('createdAt', { ascending: false })
        .limit(10)

      // 6. Active Group Withdrawal Requests
      const { data: withdrawalRequests } = await supabase
        .from('group_withdrawals')
        .select('*, requested_by_user:users(username), votes:group_withdrawal_votes(*)')
        .eq('groupId', group.id)
        .eq('status', 'PENDING')

      // 7. Personal Plans
      let personalPlans = []
      try {
        const { data: ppData, error: ppError } = await supabase
          .from('personal_plans')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          
        if (!ppError && ppData) {
          personalPlans = ppData
        }
      } catch (e) {
        // Table might not exist yet if user hasn't run SQL
        console.warn('Personal plans table missing', e)
      }

      return {
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
        personalPlans: personalPlans || [],
      }
    } catch (err: any) {
      console.error('dashboardService error:', err)
      throw err
    }
  }
}
