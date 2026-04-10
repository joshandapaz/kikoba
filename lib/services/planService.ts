import { supabase } from '@/lib/supabase'

export const planService = {
  /** Fetch all personal plans for the current user */
  async getPersonalPlans() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: plans, error } = await supabase
      .from('personal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // If table doesn't exist yet (before SQL is run), return empty array instead of crashing entirely.
    if (error) {
      if (error.code === '42P01') return [] // undefined_table
      throw error
    }
    
    return plans || []
  },

  /** Create a new personal plan */
  async createPlan(title: string, targetAmount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('personal_plans')
      .insert({
        user_id: user.id,
        title,
        target_amount: targetAmount,
        saved_amount: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Deposit money into a plan from wallet */
  async depositToPlan(planId: string, amount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get current user wallet
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (userError || !dbUser) throw new Error('User not found')
    if (dbUser.wallet_balance < amount) throw new Error('Salio halitoshi kwenye mfuko wako binafsi')

    // 2. Get current plan
    const { data: plan, error: planError } = await supabase
      .from('personal_plans')
      .select('saved_amount, target_amount')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) throw new Error('Mpango haujapatikana')

    // 3. Update User Wallet
    await supabase
      .from('users')
      .update({ wallet_balance: dbUser.wallet_balance - amount })
      .eq('id', user.id)

    // 4. Update Plan Amount
    await supabase
      .from('personal_plans')
      .update({ saved_amount: plan.saved_amount + amount })
      .eq('id', planId)

    // 5. Log transaction
    await supabase.from('transactions').insert({
      userId: user.id,
      amount: amount,
      type: 'DEPOSIT',
      description: 'Amana kwenye mpango binafsi',
      status: 'COMPLETED'
    })

    return { success: true }
  }
}
