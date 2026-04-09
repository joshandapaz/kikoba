import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { ClickPesa } from '@/lib/clickpesa'

export const walletService = {
  async getWalletData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('users')
      .select('wallet_balance, phone')
      .eq('id', user.id)
      .single()

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })

    return {
      balance: profile?.wallet_balance || 0,
      phone: profile?.phone,
      transactions: transactions || []
    }
  },

  async initiateDeposit(amount: number, phone?: string, walletType: 'PERSONAL' | 'GROUP' = 'PERSONAL', groupId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const encodedExternalId = `CP-${uuidv4().substring(0, 8)}__${walletType}__${groupId || 'none'}`
    
    // 1. Fetch user profile for phone
    const { data: profile } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .single()

    const targetPhone = phone || profile?.phone
    if (!targetPhone) throw new Error('Namba ya simu haijapatikana')

    // 2. Record the payment record (Pending)
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount,
        status: 'PENDING',
        provider: 'CLICKPESA',
        merchant_reference: encodedExternalId,
        metadata: { type: 'DEPOSIT' }
      })

    if (insertError) throw insertError

    // 3. Initiate USSD Push via ClickPesa
    // Note: Reusing the existing ClickPesa library logic
    const result = await ClickPesa.initiateUssdPush({
      amount,
      phone: targetPhone,
      externalId: encodedExternalId
    })

    return {
      success: true,
      result,
      message: 'Ombi la malipo limetumwa. Tafadhali angalia simu yako kukamilisha.'
    }
  },

  async initiatePayout(amount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Check balance
    const { data: profile } = await supabase
      .from('users')
      .select('wallet_balance, phone')
      .eq('id', user.id)
      .single()

    if ((profile?.wallet_balance || 0) < amount) throw new Error('Salio halitoshi kutoa pesa hii')
    if (!profile?.phone) throw new Error('Tafadhali kwanza sajili namba ya simu kwenye wasifu wako')

    // 2. Initiate Payout via ClickPesa
    const externalId = `PO-${uuidv4().substring(0, 8)}`
    
    // For standalone, we simulate the withdrawal from wallet first
    // In production, this should wait for webhook confirmation
    await supabase.from('users').update({ wallet_balance: (profile.wallet_balance || 0) - amount }).eq('id', user.id)

    await supabase.from('transactions').insert({
      userId: user.id,
      amount,
      type: 'WITHDRAWAL',
      description: 'Cash out kwenda Mobile Money',
      status: 'PENDING'
    })

    const result = await ClickPesa.initiatePayout({
      amount,
      phone: profile.phone,
      externalId
    })

    return { success: true, message: 'Ombi la kutoa pesa limepokelewa', result }
  }
}
