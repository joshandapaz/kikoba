import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClickPesa } from '@/lib/clickpesa'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, phone, walletType = 'PERSONAL', groupId } = await req.json()
    const userId = session.user.id
    // Encode context into externalId to avoid dependency on 'metadata' column
    const encodedExternalId = `CP-${uuidv4().substring(0, 8)}__${walletType}__${groupId || 'none'}`
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // 1. Fetch user to get their registered phone number if not provided
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('phone, username')
      .eq('id', userId)
      .single()

    const targetPhone = phone || userProfile?.phone || ''
    
    if (!targetPhone) {
      return NextResponse.json({ error: 'Namba ya simu haijapatikana. Tafadhali jaza namba ya simu.' }, { status: 400 })
    }

    // 2. Record the transaction first
    try {
      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId, // Using snake_case as confirmed in database schema
          amount,
          status: 'PENDING',
          provider: 'CLICKPESA',
          merchant_reference: encodedExternalId,
          metadata: { type: 'DEPOSIT' }
        })

      if (insertError) {
        console.error('Database insertion error:', insertError)
        return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 })
      }
    } catch (insertErr) {
      console.error('Critical Database error:', insertErr)
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 })
    }

    // 3. Initiate ClickPesa USSD Push
    const result = await ClickPesa.initiateUssdPush({
      amount,
      phone: targetPhone,
      externalId: encodedExternalId
    })

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'USSD Push initiated. Please check your phone to confirm.'
    })

  } catch (error: any) {
    console.error('ClickPesa initiate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
