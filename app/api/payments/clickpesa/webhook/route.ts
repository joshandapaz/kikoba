import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('ClickPesa Webhook Received:', data)

    // ClickPesa webhooks typically include:
    // status: 'COMPLETED' or 'FAILED'
    // external_id: The ID we provided
    // transaction_id: ClickPesa's internal ID

    const { status, external_id, transaction_id, amount } = data

    if (!external_id) {
      return NextResponse.json({ error: 'External ID missing' }, { status: 400 })
    }

    // 1. Get the payment record
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('merchant_reference', external_id)
      .single()

    if (fetchError || !payment) {
      console.error('Payment not found:', external_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ message: 'Payment already processed' })
    }

    // 2. Update payment status
    const finalStatus = status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: finalStatus
        // metadata column removed because it doesn't exist
      })
      .eq('id', payment.id)

    if (updateError) throw updateError

    // 3. If completed, update balance
    if (finalStatus === 'COMPLETED') {
      // Decode context from merchant_reference
      // Format: CP-[UUID]__[WALLET_TYPE]__[GROUP_ID]
      const parts = (external_id || '').split('__')
      const walletType = parts[1] || 'PERSONAL'
      const groupId = parts[2] === 'none' ? null : parts[2]
      const userId = payment.user_id // Using snake_case from DB
      const amount = payment.amount

      // Step 1: ALWAYS update Personal Balance (Initial funding)
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('wallet_balance, username')
        .eq('id', userId)
        .single()

      if (userError || !user) throw new Error('User not found during balance update')

      const updatedPersonalBalance = (user.wallet_balance || 0) + amount
      await supabaseAdmin
        .from('users')
        .update({ wallet_balance: updatedPersonalBalance })
        .eq('id', userId)

      // Log Personal Deposit
      await supabaseAdmin.from('activities').insert({
        userId,
        action: `Pesa TZS ${amount.toLocaleString()} imewekwa kwenye mfuko binafsi (ClickPesa)`,
        amount
      })

      // NEW: Add to Transaction Ledger
      await supabaseAdmin.from('transactions').insert({
        userId,
        type: 'DEPOSIT',
        amount,
        description: 'Deposit via ClickPesa',
        referenceId: payment.id
      })

      // Step 2: IF walletType is GROUP, immediately transfer to Group
      if (walletType === 'GROUP' && groupId) {
        const { data: group, error: groupError } = await supabaseAdmin
          .from('groups')
          .select('wallet_balance, name')
          .eq('id', groupId)
          .single()

        if (!groupError && group) {
          // a. Deduct from Personal (after we just added it)
          await supabaseAdmin
            .from('users')
            .update({ wallet_balance: updatedPersonalBalance - amount })
            .eq('id', userId)

          // b. Add to Group
          await supabaseAdmin
            .from('groups')
            .update({ wallet_balance: (group.wallet_balance || 0) + amount })
            .eq('id', groupId)

          // c. Create Savings Record
          const { data: saving } = await supabaseAdmin.from('savings').insert({
            userId,
            groupId,
            amount,
            note: 'Mchango wa moja kwa moja kupitia ClickPesa'
          }).select().single()

          // d. Log Transfer Activity
          await supabaseAdmin.from('activities').insert({
            userId,
            groupId,
            action: `Changio la TZS ${amount.toLocaleString()} kwa kikundi "${group.name}" (kutoka mfuko binafsi)`,
            amount
          })

          // NEW: Add to Transaction Ledger (CONTRIBUTION)
          await supabaseAdmin.from('transactions').insert({
            userId,
            groupId,
            type: 'CONTRIBUTION',
            amount,
            description: `Contribution to ${group.name}`,
            referenceId: saving?.id
          })
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
