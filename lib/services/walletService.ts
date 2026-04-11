import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { ClickPesa } from '@/lib/clickpesa'
import { AzamPay } from '@/lib/azampay'

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
    groupId?: string,
    provider: 'CLICKPESA' | 'AZAMPAY' = 'AZAMPAY'
  ) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Fetch user profile for phone
    const { data: profile } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .single()

    const targetPhone = phone || profile?.phone
    if (!targetPhone) throw new Error('Namba ya simu haijapatikana')

    // 2. Use AzamPay (default) or ClickPesa
    if (provider === 'AZAMPAY') {
      // Use the newly deployed Vercel API route to completely bypass the Kong Gateway 401 Invalid JWT bug
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const checkoutUrl = `${apiUrl}/api/payments/azampay/checkout`

      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone: targetPhone,
          walletType,
          groupId,
          userId: user.id,
        })
      })

      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'AzamPay checkout failed')
      }

      return {
        success: true,
        externalId: data.externalId,
        provider: 'AZAMPAY',
        message: data.message || 'Ombi la malipo limetumwa. Tafadhali angalia simu yako kukamilisha.',
      }
    } else {
      // ClickPesa fallback
      const externalId = `CP-${uuidv4().substring(0, 8)}__${walletType}__${groupId || 'none'}`

      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount,
          status: 'PENDING',
          provider: 'CLICKPESA',
          merchant_reference: externalId,
          metadata: { type: 'DEPOSIT' },
        })
      if (insertError) throw insertError

      const result = await ClickPesa.initiateUssdPush({ amount, phone: targetPhone, externalId })

      return {
        success: true,
        externalId,
        provider: 'CLICKPESA',
        result,
        message: 'Ombi la malipo limetumwa. Tafadhali angalia simu yako kukamilisha.',
      }
    }
  },

  async initiatePayout(amount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    const withdrawUrl = `${apiUrl}/api/payments/azampay/withdraw`

    const res = await fetch(withdrawUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        userId: user.id,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Kutoa pesa kumeshindwa')
    }

    return {
      success: true,
      externalId: data.externalId,
      message: data.message || 'Ombi la kutoa pesa limepokelewa. Pesa itafika kwenye simu yako hivi karibuni.',
    }
  }
}
