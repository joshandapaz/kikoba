import { supabase } from '@/lib/supabase'

export const loanService = {
  async getLoans(options: { groupId?: string, status?: string, mine?: boolean } = {}) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let query = supabase
      .from('loans')
      .select('*, user:users(id, username), group:groups(id, name), votes:loan_votes(*, user:users(id, username)), payments:loan_payments(*)')
      .order('createdAt', { ascending: false })

    if (options.mine) {
      query = query.eq('userId', user.id)
    }

    if (options.groupId) {
      query = query.eq('groupId', options.groupId)
    }

    if (options.status) {
      query = query.eq('status', options.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async applyForLoan(groupId: string, amount: number, reason: string, duration: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Check for active loan
    const { data: activeLoan } = await supabase
      .from('loans')
      .select('id')
      .eq('userId', user.id)
      .eq('groupId', groupId)
      .in('status', ['PENDING', 'APPROVED', 'PENDING_ADMIN'])
      .maybeSingle()

    if (activeLoan) throw new Error('Una mkopo unaoendelea katika kikundi hiki')

    // 2. Create Loan
    const { data: loan, error } = await supabase
      .from('loans')
      .insert({
        userId: user.id,
        groupId,
        amount,
        reason,
        duration,
        status: 'PENDING_ADMIN'
      })
      .select()
      .single()

    if (error) throw error

    // 3. Log Activity
    await supabase.from('activities').insert({
      userId: user.id,
      groupId,
      action: 'Ameomba mkopo',
      amount
    })

    return loan
  },

  async voteOnLoan(loanId: string, vote: 'APPROVE' | 'REJECT') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('loan_votes')
      .upsert({
        loanId,
        userId: user.id,
        vote
      })

    if (error) throw error
    return { success: true }
  },

  async handleAdminApproval(loanId: string, action: 'APPROVE' | 'REJECT') {
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) throw new Error('Unauthorized')

    // 1. Fetch loan
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*, group:groups(*)')
      .eq('id', loanId)
      .single()

    if (loanError || !loan) throw new Error('Mkopo haukupatikana')

    if (action === 'REJECT') {
      await supabase.from('loans').update({ status: 'REJECTED' }).eq('id', loanId)
      return { success: true, message: 'Mkopo umekataliwa' }
    }

    // 2. Approval Logic (Internal Wallet Transfer)
    const amount = loan.amount
    const borrowerId = loan.userId
    const groupId = loan.groupId

    // a. Check group wallet
    if ((loan.group.wallet_balance || 0) < amount) throw new Error('Salio la kikundi halitoshi')

    // b. Deduct from Group
    await supabase
      .from('groups')
      .update({ wallet_balance: (loan.group.wallet_balance || 0) - amount })
      .eq('id', groupId)

    // c. Add to Borrower
    const { data: borrower } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', borrowerId)
      .single()

    await supabase
      .from('users')
      .update({ wallet_balance: (borrower?.wallet_balance || 0) + amount })
      .eq('id', borrowerId)

    // d. Update status & Ledger
    await supabase.from('loans').update({ status: 'APPROVED' }).eq('id', loanId)

    await supabase.from('transactions').insert({
      userId: borrowerId,
      groupId,
      type: 'LOAN_DISBURSEMENT',
      amount,
      description: 'Mkopo umeidhinishwa na Admin',
      referenceId: loanId,
      status: 'COMPLETED'
    })

    return { success: true }
  },

  async getLoanById(loanId: string) {
    const { data, error } = await supabase
      .from('loans')
      .select('*, user:users(username), group:groups(name), payments:loan_payments(*)')
      .eq('id', loanId)
      .single()
    if (error) throw error
    return data
  },

  async repayLoan(loanId: string, amount: number, note?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Fetch loan
    const loan = await this.getLoanById(loanId)
    if (!loan) throw new Error('Mkopo haukupatikana')

    // 2. Check personal wallet balance
    const { data: profile } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if ((profile?.wallet_balance || 0) < amount) throw new Error('Salio lako binafsi halitoshi kurejesha mkopo huu')

    // 3. Perform Transfer
    // a. Deduct from User
    await supabase
      .from('users')
      .update({ wallet_balance: (profile?.wallet_balance || 0) - amount })
      .eq('id', user.id)

    // b. Add to Group
    const { data: group } = await supabase
      .from('groups')
      .select('wallet_balance')
      .eq('id', loan.groupId)
      .single()

    await supabase
      .from('groups')
      .update({ wallet_balance: (group?.wallet_balance || 0) + amount })
      .eq('id', loan.groupId)

    // 4. Record Payment
    await supabase.from('loan_payments').insert({
      loanId,
      amount,
      note,
      date: new Date().toISOString()
    })

    // 5. Update Loan Status if fully paid
    const currentBalance = calculateLoanBalance(loan.amount, loan.interestRate, loan.payments)
    if (currentBalance <= amount) {
      await supabase.from('loans').update({ status: 'PAID' }).eq('id', loanId)
    }

    // 6. Log Activity & Transaction
    await supabase.from('activities').insert({
      userId: user.id,
      groupId: loan.groupId,
      action: 'Amefanya marejesho ya mkopo',
      amount
    })

    await supabase.from('transactions').insert({
      userId: user.id,
      groupId: loan.groupId,
      type: 'LOAN_REPAYMENT',
      amount,
      description: 'Marejesho ya mkopo',
      status: 'COMPLETED'
    })

    return { success: true }
  }
}

// Helper (should be moved to utils or shared)
function calculateLoanBalance(principal: number, interestRate: number, payments: any[]) {
  const total = principal + (principal * interestRate) / 100
  const paid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, total - paid)
}
