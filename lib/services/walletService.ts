import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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

  async initiateDeposit(
    amount: number,
    phone?: string,
    walletType: 'PERSONAL' | 'GROUP' = 'PERSONAL',
    groupId?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const checkoutUrl = `${apiUrl}/api/payments/pesapal/checkout`

    const res = await fetch(checkoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        walletType,
        groupId,
        userId: user.id
      })
    })

    const data = await res.json()
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'PesaPal checkout failed')
    }

    return {
      success: true,
      redirectUrl: data.redirectUrl,
      externalId: data.externalId,
      message: data.message,
    }
  },

  async initiatePayout(amount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Check user balance
    const { data: profile } = await supabase
      .from('users')
      .select('wallet_balance, phone, username')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('User not found')
    if ((profile?.wallet_balance || 0) < amount) {
      throw new Error('Salio halitoshi kutoa pesa hii')
    }

    // Since PesaPal standard API focuses on Collections, automated B2C (Withdrawals) is handled 
    // manually via the PesaPal Merchant Dashboard. We will lock the funds and record the request.
    
    // 2. Reserve balance
    await supabase
      .from('users')
      .update({ wallet_balance: (profile.wallet_balance || 0) - amount })
      .eq('id', user.id)

    // 3. Record pending transaction for Admin to payout manually
    const externalId = `PP-WD-${uuidv4().substring(0, 8)}`
    
    await supabase.from('payments').insert({
      user_id: user.id,
      amount,
      status: 'PENDING',
      provider: 'PESAPAL_MANUAL',
      merchant_reference: externalId,
      metadata: { type: 'WITHDRAWAL', phone: profile.phone },
    })

    await supabase.from('transactions').insert({
      userId: user.id,
      type: 'WITHDRAWAL',
      amount,
      description: 'Ombi la kutoa pesa (Pending)',
      status: 'PENDING'
    })

    await supabase.from('activities').insert({
      userId: user.id,
      action: 'Ameomba kutoa pesa (PesaPal)',
      amount,
    })

    return {
      success: true,
      externalId,
      message: 'Ombi lako la kutoa pesa limepokelewa na linashughulikiwa na msimamizi.'
    }
  }
}
