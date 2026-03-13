export const dynamic = 'force-static'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, groupId } = await req.json()
    const userId = session.user.id

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Kiasi hakitakiwi kuwa sifuri' }, { status: 400 })

    // 1. Get user and group details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('wallet_balance, username')
      .eq('id', userId)
      .single()

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('wallet_balance, name')
      .eq('id', groupId)
      .single()

    if (userError || groupError) throw new Error('Hitilafu ya kupata taarifa')

    // 2. Check if user has sufficient balance
    if ((user.wallet_balance || 0) < amount) {
      return NextResponse.json({ error: 'Salio la Mfuko Binafsi halitoshi. Tafadhali ongeza pesa kwanza.' }, { status: 400 })
    }

    // 3. Perform internal transfer
    // a. Deduct from user
    const { error: userUpdateErr } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance: (user.wallet_balance || 0) - amount })
      .eq('id', userId)

    if (userUpdateErr) throw userUpdateErr

    // b. Add to group
    const { error: groupUpdateErr } = await supabaseAdmin
      .from('groups')
      .update({ wallet_balance: (group.wallet_balance || 0) + amount })
      .eq('id', groupId)

    if (groupUpdateErr) throw groupUpdateErr

    // 4. Create savings record (Contribution tracking)
    await supabaseAdmin.from('savings').insert({
      userId,
      groupId,
      amount,
      status: 'COMPLETED'
    })

    // 5. Log Activity
    await supabaseAdmin.from('activities').insert({
      userId,
      groupId,
      action: `Changio la TZS ${amount.toLocaleString()} kwa kikundi "${group.name}"`,
      amount
    })

    // NEW: Add to Transaction Ledger
    await supabaseAdmin.from('transactions').insert({
      userId,
      groupId,
      type: 'CONTRIBUTION',
      amount,
      description: `Contribution to ${group.name}`
    })

    return NextResponse.json({ success: true, message: 'Mchango wako umekamilika kwa mafanikio!' })

  } catch (error: any) {
    console.error('Group contribution error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
