import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * AzamPay IPN Webhook — Supabase Edge Function
 * 
 * AzamPay POSTs this payload on payment completion:
 * {
 *   transactionId: string
 *   externalId: string         <- our merchant_reference
 *   msisdn: string             <- customer phone
 *   amount: number
 *   currency: 'TZS'
 *   status: 'success' | 'failure'
 *   utilityref: string
 *   operator: string
 *   reference: string
 *   timestamp: string
 * }
 *
 * Register this URL in AzamPay portal:
 * https://bggiguzhkdxfwgfbuqfy.supabase.co/functions/v1/azampay-callback
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload = await req.json()
    console.log('[azampay-callback] Received:', JSON.stringify(payload))

    const { transactionId, externalId, msisdn, amount, status, utilityref, operator } = payload

    if (!externalId) {
      return new Response(JSON.stringify({ message: 'Missing externalId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isSuccess = status === 'success'

    // 1. Find payment record
    const { data: payment, error: findErr } = await supabase
      .from('payments')
      .select('*')
      .eq('merchant_reference', externalId)
      .single()

    if (findErr || !payment) {
      console.error('[azampay-callback] Payment not found:', externalId)
      return new Response(JSON.stringify({ message: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Avoid double-processing
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Update payment status
    await supabase
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
      const depositAmount = Number(amount)

      // 4a. Credit Personal Wallet
      if (walletType === 'PERSONAL' || !walletType) {
        const { data: user } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', userId)
          .single()

        await supabase
          .from('users')
          .update({ wallet_balance: (user?.wallet_balance || 0) + depositAmount })
          .eq('id', userId)

        await supabase.from('transactions').insert({
          userId,
          type: 'DEPOSIT',
          amount: depositAmount,
          description: `Amana ya AzamPay - ${operator || 'Mobile Money'}`,
          status: 'COMPLETED',
        })

        await supabase.from('activities').insert({
          userId,
          action: 'Ameingiza pesa kwenye mkoba',
          amount: depositAmount,
        })
      }

      // 4b. Credit Group Wallet
      if (walletType === 'GROUP' && groupId) {
        const { data: group } = await supabase
          .from('groups')
          .select('wallet_balance')
          .eq('id', groupId)
          .single()

        await supabase
          .from('groups')
          .update({ wallet_balance: (group?.wallet_balance || 0) + depositAmount })
          .eq('id', groupId)

        await supabase.from('savings').insert({
          userId,
          groupId,
          amount: depositAmount,
          note: `AzamPay deposit - ${operator || ''}`,
          date: new Date().toISOString(),
        })

        await supabase.from('transactions').insert({
          userId,
          groupId,
          type: 'SAVING',
          amount: depositAmount,
          description: 'Mchango wa kikoba - AzamPay',
          status: 'COMPLETED',
        })

        await supabase.from('activities').insert({
          userId,
          groupId,
          action: 'Amechangia kikoba kupitia AzamPay',
          amount: depositAmount,
        })
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[azampay-callback] Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
