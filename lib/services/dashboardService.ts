import { supabase } from '@/lib/supabase'

export const dashboardService = {
  async getDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const userId = user.id

      // 1. Get user profile data
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_balance, phone, username')
        .eq('id', userId)
        .single()
      
      const walletBalance = userData?.wallet_balance || 0

      // 2. User savings (across all groups)
      const { data: userSavings } = await supabase
        .from('savings')
        .select('amount')
        .eq('userId', userId)
      
      const totalSavings = (userSavings || []).reduce((sum: number, s: any) => sum + s.amount, 0)

      // 3. User loans
      const { data: userLoans } = await supabase
        .from('loans')
        .select('*, payments:loan_payments(*)')
        .eq('userId', userId)

      const activeLoans = (userLoans || []).filter((l: any) => l.status === 'APPROVED')
      const loanBalance = activeLoans.reduce((sum: number, l: any) => {
        const total = l.amount + (l.amount * l.interestRate) / 100
        const paid = (l.payments || []).reduce((s: number, p: any) => s + p.amount, 0)
        return sum + Math.max(0, total - paid)
      }, 0)

      // 4. Transactions (personal)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(15)

      // 5. Personal Plans
      let personalPlans: any[] = []
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
        console.warn('Personal plans table missing', e)
      }

      return {
        userId,
        username: userData?.username || 'Mtumiaji',
        userStats: {
          walletBalance,
          totalSavings,
          activeLoans: activeLoans.length,
          loanBalance,
          registeredPhone: userData?.phone || undefined
        },
        recentTransactions: transactions || [],
        personalPlans: personalPlans || [],
      }
    } catch (err: any) {
      console.error('dashboardService error:', err)
      throw err
    }
  }
}
