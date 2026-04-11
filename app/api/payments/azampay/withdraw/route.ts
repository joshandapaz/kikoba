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
    const { amount, userId } = await req.json()

    if (!amount || !userId) {
      return NextResponse.json({ error: 'amount and userId are required' }, { status: 400 })
    }

    if (Number(amount) < 500) {
      return NextResponse.json({ error: 'Kiwango cha chini cha kutoa ni TZS 500' }, { status: 400 })
    }

    // 1. Fetch user profile to get phone & balance
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('wallet_balance, phone, username')
      .eq('id', userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'Mtumiaji hajapatikana' }, { status: 404 })
    }

    if (!user.phone) {
      return NextResponse.json({ error: 'Tafadhali kwanza sajili namba ya simu kwenye wasifu wako' }, { status: 400 })
    }

    if ((user.wallet_balance || 0) < Number(amount)) {
      return NextResponse.json({ error: 'Salio halitoshi kutoa pesa hii' }, { status: 400 })
    }

    const externalId = `WD-${uuidv4().substring(0, 12).toUpperCase()}`

    // 2. Record the pending withdrawal payment
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount: Number(amount),
      status: 'PENDING',
      provider: 'AZAMPAY',
      merchant_reference: externalId,
      metadata: { type: 'WITHDRAWAL' },
    })

    // 3. Reserve the balance immediately to prevent double-spend
    await supabaseAdmin
      .from('users')
      .update({ wallet_balance: (user.wallet_balance || 0) - Number(amount) })
      .eq('id', userId)

    try {
      // 4. Initiate disbursement via AzamPay
      const result = await AzamPay.disburse({
        amount: Number(amount),
        phone: user.phone,
        externalId,
        remarks: `Kutoa pesa - ${user.username || 'Kikoba User'}`,
      })

      // 5. Log the withdrawal transaction
      await supabaseAdmin.from('transactions').insert({
        userId,
        type: 'WITHDRAWAL',
        amount: Number(amount),
        description: `Kutoa pesa - AzamPay`,
        status: 'PENDING',
      })

      await supabaseAdmin.from('activities').insert({
        userId,
        action: 'Ametoa pesa kupitia AzamPay',
        amount: Number(amount),
      })

      return NextResponse.json({
        success: true,
        externalId,
        message: 'Ombi la kutoa pesa limepokelewa. Pesa itafika kwenye simu yako hivi karibuni.',
        data: result,
      })
    } catch (disbursementErr: any) {
      // Rollback balance if disbursement fails
      await supabaseAdmin
        .from('users')
        .update({ wallet_balance: user.wallet_balance })
        .eq('id', userId)

      await supabaseAdmin
        .from('payments')
        .update({ status: 'FAILED' })
        .eq('merchant_reference', externalId)

      console.error('[AzamPay Withdraw] Disbursement failed:', disbursementErr.message)
      return NextResponse.json({ error: disbursementErr.message || 'Kutoa pesa kumeshindwa' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('[AzamPay Withdraw Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
