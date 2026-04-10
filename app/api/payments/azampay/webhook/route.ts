import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * AzamPay IPN (Instant Payment Notification) Webhook
 * 
 * AzamPay POSTs a JSON payload to this endpoint after a transaction completes.
 * Expected payload:
 * {
 *   transactionId: string
 *   externalId: string        <- our merchant_reference
 *   msisdn: string            <- customer phone
 *   amount: number
 *   currency: 'TZS'
 *   description: string
 *   status: 'success' | 'failure'
 *   utilityref: string
 *   operator: string
 *   reference: string
 *   timestamp: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log('[AzamPay Webhook] Received:', JSON.stringify(payload, null, 2))

    const {
      transactionId,
      externalId,
      msisdn,
      amount,
      status,
      utilityref,
      operator,
    } = payload

    if (!externalId) {
      return NextResponse.json({ message: 'Missing externalId' }, { status: 400 })
    }

    const isSuccess = status === 'success'

    // 1. Find the payment record
    const { data: payment, error: findErr } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('merchant_reference', externalId)
      .single()

    if (findErr || !payment) {
      console.error('[AzamPay Webhook] Payment not found for externalId:', externalId)
      return NextResponse.json({ message: 'Payment record not found' }, { status: 404 })
    }

    // 2. Avoid double-processing
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    // 3. Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: isSuccess ? 'COMPLETED' : 'FAILED',
        metadata: {
          ...payment.metadata,
          transactionId,
          utilityref,
          operator,
          msisdn,
          azampayStatus: status,
        },
      })
      .eq('merchant_reference', externalId)

    if (isSuccess) {
      const { walletType, groupId } = payment.metadata || {}
      const userId = payment.user_id

      // 4a. Credit Personal Wallet
      if (walletType === 'PERSONAL' || !walletType) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('wallet_balance')
          .eq('id', userId)
          .single()

        await supabaseAdmin
          .from('users')
          .update({ wallet_balance: (user?.wallet_balance || 0) + Number(amount) })
          .eq('id', userId)

        await supabaseAdmin.from('transactions').insert({
          userId,
          type: 'DEPOSIT',
          amount: Number(amount),
          description: `Amana ya AzamPay - ${operator || 'Mobile Money'}`,
          status: 'COMPLETED',
        })

        await supabaseAdmin.from('activities').insert({
          userId,
          action: 'Ameingiza pesa kwenye mkoba',
          amount: Number(amount),
        })
      }

      // 4b. Credit Group Wallet
      if (walletType === 'GROUP' && groupId) {
        const { data: group } = await supabaseAdmin
          .from('groups')
          .select('wallet_balance')
          .eq('id', groupId)
          .single()

        await supabaseAdmin
          .from('groups')
          .update({ wallet_balance: (group?.wallet_balance || 0) + Number(amount) })
          .eq('id', groupId)

        await supabaseAdmin.from('savings').insert({
          userId,
          groupId,
          amount: Number(amount),
          note: `AzamPay deposit - ${operator || ''}`,
          date: new Date().toISOString(),
        })

        await supabaseAdmin.from('transactions').insert({
          userId,
          groupId,
          type: 'SAVING',
          amount: Number(amount),
          description: `Mchango wa kikoba - AzamPay`,
          status: 'COMPLETED',
        })

        await supabaseAdmin.from('activities').insert({
          userId,
          groupId,
          action: 'Amechangia kikoba kupitia AzamPay',
          amount: Number(amount),
        })
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 })
  } catch (err: any) {
    console.error('[AzamPay Webhook Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
