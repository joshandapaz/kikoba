import { NextRequest, NextResponse } from 'next/server'
import { PesaPal } from '@/lib/pesapal'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PesaPal IPN (Instant Payment Notification) Webhook
 * 
 * Expected payload (POST):
 * {
 *   "OrderTrackingId": "uuid",
 *   "OrderNotificationType": "IPNCHANGE",
 *   "OrderMerchantReference": "PP-XYZ__PERSONAL__none"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // In some cases PesaPal sends IPN as URL query parameters instead of body, but we requested POST. Let's parse JSON or Form.
    let payload: any = {}
    try {
      if (req.headers.get('content-type')?.includes('application/json')) {
        payload = await req.json()
      } else {
        const text = await req.text()
        const params = new URLSearchParams(text)
        payload = Object.fromEntries(params.entries())
      }
    } catch (e) {
      const urlParams = new URL(req.url).searchParams
      payload = {
        OrderTrackingId: urlParams.get('OrderTrackingId'),
        OrderMerchantReference: urlParams.get('OrderMerchantReference'),
        OrderNotificationType: urlParams.get('OrderNotificationType'),
      }
    }

    // Sometimes keys are lowercase depending on the PesaPal implementation version
    const orderTrackingId = payload.OrderTrackingId || payload.orderTrackingId || payload.OrderTrackingID
    const externalId = payload.OrderMerchantReference || payload.orderMerchantReference || payload.OrderMerchantReferenceID
    const notificationType = payload.OrderNotificationType || payload.orderNotificationType || payload.OrderNotificationTypeID

    console.log('[PesaPal Webhook] Received:', JSON.stringify({ orderTrackingId, externalId, notificationType }))

    if (!orderTrackingId || !externalId) {
      return NextResponse.json({ error: 'Missing identifying parameters' }, { status: 400 })
    }

    // 1. Find the payment record
    const { data: payment, error: findErr } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('merchant_reference', externalId)
      .single()

    if (findErr || !payment) {
      console.error('[PesaPal Webhook] Payment not found for reference:', externalId)
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    // 2. Avoid double-processing
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return NextResponse.json({
        orderNotificationType: notificationType,
        orderTrackingId: orderTrackingId,
        orderMerchantReference: externalId,
        status: 200
      }, { status: 200 })
    }

    // 3. Verify status with PesaPal directly (Anti-fraud measure)
    const verification = await PesaPal.getTransactionStatus(orderTrackingId)
    console.log('[PesaPal Webhook] Verified Status:', JSON.stringify(verification))

    // PesaPal status codes: "COMPLETED", "FAILED", "INVALID", "REVERSAL"
    const isSuccess = verification.status_code === 1 || verification.payment_status_description?.toUpperCase() === 'COMPLETED'
    const isFailed = verification.status_code === 2 || verification.status_code === 3 || verification.payment_status_description?.toUpperCase() === 'FAILED'

    if (!isSuccess && !isFailed) {
      // Pending or other intermediate state
      return NextResponse.json({ message: 'Status pending / ignored' }, { status: 200 })
    }

    // 4. Update payment status
    await supabaseAdmin
      .from('payments')
      .update({
        status: isSuccess ? 'COMPLETED' : 'FAILED',
        metadata: {
          ...payment.metadata,
          pesapalStatus: verification.payment_status_description,
          paymentMethod: verification.payment_method,
          currency: verification.currency,
        },
      })
      .eq('merchant_reference', externalId)

    if (isSuccess) {
      const amount = payment.amount
      const { walletType, groupId } = payment.metadata || {}
      const userId = payment.user_id

      // 5a. Credit Personal Wallet
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
          description: `Amana ya PesaPal - ${verification.payment_method || 'Mtandao/Kadi'}`,
          status: 'COMPLETED',
        })

        await supabaseAdmin.from('activities').insert({
          userId,
          action: 'Ameingiza pesa kwenye mkoba',
          amount: Number(amount),
        })
      }

      // 5b. Credit Group Wallet
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
          note: `PesaPal deposit - ${verification.payment_method || ''}`,
          date: new Date().toISOString(),
        })

        await supabaseAdmin.from('transactions').insert({
          userId,
          groupId,
          type: 'SAVING',
          amount: Number(amount),
          description: `Mchango wa kikoba - PesaPal`,
          status: 'COMPLETED',
        })

        await supabaseAdmin.from('activities').insert({
          userId,
          groupId,
          action: 'Amechangia kikoba kupitia PesaPal',
          amount: Number(amount),
        })
      }
    }

    // PesaPal requires this exact JSON format to acknowledge the IPN
    return NextResponse.json({
      orderNotificationType: notificationType,
      orderTrackingId,
      orderMerchantReference: externalId,
      status: 200
    }, { status: 200 })

  } catch (err: any) {
    console.error('[PesaPal Webhook Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
