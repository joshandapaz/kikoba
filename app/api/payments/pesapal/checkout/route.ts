import { NextRequest, NextResponse } from 'next/server'
import { PesaPal } from '@/lib/pesapal'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { amount, walletType = 'PERSONAL', groupId, userId } = await req.json()

    if (!amount || !userId) {
      return NextResponse.json({ error: 'amount and userId are required' }, { status: 400 })
    }

    // Determine the base URL for callbacks dynamically based on the environment
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host') || 'localhost:5172'
    const baseUrl = `${proto}://${host}`

    const webhookUrl = `${baseUrl}/api/payments/pesapal/webhook`
    const callbackUrl = `${baseUrl}/dashboard?payment=success`
    const cancellationUrl = `${baseUrl}/dashboard?payment=cancelled`

    // Generate unique external ID for our records
    const externalId = `PP-${uuidv4().substring(0, 12).toUpperCase()}__${walletType}__${groupId || 'none'}`

    // Fetch user details to pre-fill PesaPal form
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('phone, email, username')
      .eq('id', userId)
      .single()

    // Submit Order to PesaPal
    const result = await PesaPal.submitOrder({
      id: externalId,
      amount: Number(amount),
      currency: 'TZS',
      description: `Amuna kwenye mfuko wa Kikoba ${walletType === 'GROUP' ? 'cha kikundi' : 'binafsi'}`,
      callbackUrl,
      cancellationUrl,
      webhookUrl,
      email: user?.email,
      phone: user?.phone,
      firstName: user?.username || 'Kikoba',
      lastName: 'User'
    })

    // Record the pending payment with the orderTrackingId returned by PesaPal
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount,
      status: 'PENDING',
      provider: 'PESAPAL',
      merchant_reference: externalId,
      order_tracking_id: result.orderTrackingId,
      metadata: { type: 'DEPOSIT', walletType, groupId },
    })

    return NextResponse.json({
      success: true,
      externalId,
      redirectUrl: result.redirectUrl,
      orderTrackingId: result.orderTrackingId,
      provider: 'PESAPAL',
      message: 'Utaelekezwa PesaPal kukamilisha malipo yako.',
    })
  } catch (err: any) {
    console.error('[PesaPal Checkout Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
