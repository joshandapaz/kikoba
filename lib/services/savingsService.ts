import { supabase } from '@/lib/supabase'

export const savingsService = {
  async getSavings(groupId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let query = supabase
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
    return { savings: savings || [], total }
  },

  async contribute(groupId: string, amount: number, note?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Check Personal Wallet Balance
    const { data: dbUser } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if ((dbUser?.wallet_balance || 0) < amount) throw new Error('Salio lako binafsi halitoshi')

    // 2. Perform Transfer (Personal -> Group)
    // a. Deduct from User
    await supabase
      .from('users')
      .update({ wallet_balance: (dbUser?.wallet_balance || 0) - amount })
      .eq('id', user.id)

    // b. Add to Group
    const { data: group } = await supabase
      .from('groups')
      .select('wallet_balance')
      .eq('id', groupId)
      .single()

    await supabase
      .from('groups')
      .update({ wallet_balance: (group?.wallet_balance || 0) + amount })
      .eq('id', groupId)

    // 3. Record Saving
    const { data: saving, error } = await supabase
      .from('savings')
      .insert({
        userId: user.id,
        groupId,
        amount,
        note,
        date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 4. Log Activity & Transaction
    await supabase.from('activities').insert({
      userId: user.id,
      groupId,
      action: 'Amechangia akiba',
      amount
    })

    await supabase.from('transactions').insert({
      userId: user.id,
      groupId,
      type: 'SAVING',
      amount,
      description: `Savings contribution to group`,
      status: 'COMPLETED'
    })

    return saving
  }
}
