
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, action, note } = await req.json()
    const userId = session.user.id

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Kiasi batili' }, { status: 400 })
    }

    // 1. Get current balance
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('wallet_balance, username')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Mtumiaji hajapatikana' }, { status: 404 })
    }

    let newBalance = user.wallet_balance || 0

    if (action === 'DEPOSIT') {
      newBalance += amount
    } else if (action === 'WITHDRAW') {
      if (newBalance < amount) {
        return NextResponse.json({ error: 'Salio halitoshi' }, { status: 400 })
      }
      newBalance -= amount
    } else {
      return NextResponse.json({ error: 'Kitendo batili' }, { status: 400 })
    }

    // 2. Update balance
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'Imeshindwa kusasisha salio' }, { status: 500 })
    }

    // 3. Log activity
    await supabaseAdmin
      .from('activities')
      .insert({
        userId,
        action: action === 'DEPOSIT' ? `Ameweka TZS ${amount.toLocaleString()} kwenye mfuko binafsi` : `Ametoa TZS ${amount.toLocaleString()} kwenye mfuko binafsi`,
        amount
      })

    // NEW: Add to Transaction Ledger
    await supabaseAdmin.from('transactions').insert({
      userId,
      type: action as string, // 'DEPOSIT' or 'WITHDRAWAL' (matches action for this API)
      amount,
      description: action === 'DEPOSIT' ? 'Individual wallet deposit' : 'Individual wallet withdrawal'
    })

    return NextResponse.json({ 
      success: true, 
      newBalance,
      message: action === 'DEPOSIT' ? 'Kiasi kimewekwa kwa mafanikio' : 'Kiasi kimetolewa kwa mafanikio'
    })

  } catch (err: any) {
    console.error('Wallet API error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}
