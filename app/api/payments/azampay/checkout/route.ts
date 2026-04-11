import { NextRequest, NextResponse } from 'next/server'
import { AzamPay } from '@/lib/azampay'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { amount, phone, walletType = 'PERSONAL', groupId, userId } = await req.json()

    if (!amount || !phone || !userId) {
      return NextResponse.json({ error: 'amount, phone, and userId are required' }, { status: 400 })
    }

    const externalId = `AZ-${uuidv4().substring(0, 12).toUpperCase()}__${walletType}__${groupId || 'none'}`

    // Record the pending payment
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount,
      status: 'PENDING',
      merchant_reference: externalId,
      metadata: { type: 'DEPOSIT', walletType, groupId },
    })

    // Initiate MNO checkout (triggers USSD push on user's phone)
    const result = await AzamPay.initiateMnoCheckout({ amount, phone, externalId })

    return NextResponse.json({
      success: true,
      externalId,
      provider: result.provider,
      message: 'Ombi la malipo limetumwa. Tafadhali angalia simu yako kukamilisha.',
      data: result,
    })
  } catch (err: any) {
    console.error('[AzamPay Checkout Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
