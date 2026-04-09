export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'

import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestId, action } = await req.json() // action: 'APPROVE' | 'REJECT'
    const adminId = user.id

    // 1. Get the request and group details
    const { data: withdrawal, error: wError } = await supabaseAdmin
      .from('group_withdrawals')
      .select('*, group:groups(*)')
      .eq('id', requestId)
      .single()

    if (wError || !withdrawal) return NextResponse.json({ error: 'Ombi halijapatikana' }, { status: 404 })

    // 2. Check if current user is Admin of the group
    const { data: membership } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', adminId)
      .eq('groupId', withdrawal.groupId)
      .single()

    if (membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Huna mamlaka ya kuidhinisha ombi hili' }, { status: 403 })
    }

    if (action === 'REJECT') {
      await supabaseAdmin.from('group_withdrawals').update({ status: 'REJECTED' }).eq('id', requestId)
      return NextResponse.json({ success: true, message: 'Ombi limekataliwa' })
    }

    // 3. Process Approval (Internal Transfer)
    if (action === 'APPROVE') {
      if (withdrawal.status !== 'PENDING_ADMIN') {
        return NextResponse.json({ error: 'Ombi hili haliwezi kuidhinishwa kwa sasa' }, { status: 400 })
      }

      // Check balance again
      if (withdrawal.group.wallet_balance < withdrawal.amount) {
        return NextResponse.json({ error: 'Salio la kikundi halitoshi kukamilisha uhamisho' }, { status: 400 })
      }

      // TRANSACTION-LIKE operations (Supabase doesn't have multi-table transactions in JS easily without RPC, but we'll do sequential)
      // a. Deduct from group
      const { error: groupUpdateErr } = await supabaseAdmin
        .from('groups')
        .update({ wallet_balance: withdrawal.group.wallet_balance - withdrawal.amount })
        .eq('id', withdrawal.groupId)

      if (groupUpdateErr) throw groupUpdateErr

      // b. Add to requester's personal wallet
      const { data: requester } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', withdrawal.requestedBy).single()
      const currentRequesterBalance = requester?.wallet_balance || 0

      const { error: userUpdateErr } = await supabaseAdmin
        .from('users')
        .update({ wallet_balance: currentRequesterBalance + withdrawal.amount })
        .eq('id', withdrawal.requestedBy)

      if (userUpdateErr) throw userUpdateErr

      // c. Update request status
      await supabaseAdmin.from('group_withdrawals').update({ status: 'COMPLETED' }).eq('id', requestId)

      // d. Log Activity
      await supabaseAdmin.from('activities').insert({
        userId: withdrawal.requestedBy,
        groupId: withdrawal.groupId,
        action: `Uhamisho wa TZS ${withdrawal.amount.toLocaleString()} kutoka kikundi kwenda mfuko binafsi umeidhinishwa`,
        amount: withdrawal.amount
      })

      // NEW: Add to Transaction Ledger
      await supabaseAdmin.from('transactions').insert({
        userId: withdrawal.requestedBy,
        groupId: withdrawal.groupId,
        type: 'WITHDRAWAL',
        amount: withdrawal.amount,
        description: `Group withdrawal approved for ${withdrawal.reason}`,
        referenceId: withdrawal.id
      })

      return NextResponse.json({ success: true, message: 'Umidhinishaji umekamilika. Pesa zimehamishiwa kwenye mfuko wa mwanachama.' })
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 })

  } catch (error: any) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
