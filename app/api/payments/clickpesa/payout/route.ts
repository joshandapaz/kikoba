export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'

import { ClickPesa } from '@/lib/clickpesa'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getSupabaseUser(req)
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()
    const userId = authUser.id
    const externalId = `WDL-${uuidv4().substring(0, 8)}`

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Kiasi kinatakiwa kuwa zaidi ya 0' }, { status: 400 })
    }

    // 1. Fetch user's registered phone number and current balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone, wallet_balance')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Mtumiaji hajapatikana' }, { status: 404 })
    }

    if (!userData.phone) {
      return NextResponse.json({ error: 'Hujasajili namba ya simu kwenye akaunti yako' }, { status: 400 })
    }

    if (userData.wallet_balance < amount) {
      return NextResponse.json({ error: 'Salio lako halitoshi kutoa kiasi hiki' }, { status: 400 })
    }

    // Encode context to avoid dependency on 'metadata' column
    const encodedExternalId = `WDL-${uuidv4().substring(0, 8)}__WITHDRAWAL__none`

    // 2. Record pending withdrawal
    const { error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        status: 'PENDING',
        merchant_reference: encodedExternalId
      })

    if (dbError) {
      return NextResponse.json({ error: 'Imeshindwa kurekodi muamala' }, { status: 500 })
    }

    // 3. Subtract balance immediately (pessimistic)
    // In a production app, you might only subtract after success or hold it in "escrow"
    const { error: balanceError } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance: userData.wallet_balance - amount })
      .eq('id', userId)

    if (balanceError) {
      return NextResponse.json({ error: 'Imeshindwa kusasisha salio' }, { status: 500 })
    }

    // 4. Initiate Payout via ClickPesa
    try {
      await ClickPesa.initiatePayout({
        amount,
        phone: userData.phone,
        externalId: encodedExternalId,
      })

      // Update activity log
      await supabaseAdmin
        .from('activities')
        .insert({
          userId,
          action: 'Umetoa pesa kwenda namba yako ya simu (ClickPesa)',
          amount,
          date: new Date().toISOString()
        })

      return NextResponse.json({ 
        success: true, 
        message: 'Maombi yako ya kutoa pesa yamepokelewa na yanashughulikiwa.' 
      })

    } catch (cpError: any) {
      // If CP initiation fails, refund the user
      await supabaseAdmin
        .from('users')
        .update({ wallet_balance: userData.wallet_balance })
        .eq('id', userId)

      await supabaseAdmin
        .from('payments')
        .update({ status: 'FAILED' })
        .eq('merchant_reference', externalId)

      console.error('ClickPesa Payout Initiation Failed:', cpError)
      return NextResponse.json({ error: cpError.message || 'ClickPesa payout failed' }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Payout implementation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
