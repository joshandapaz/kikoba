export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'

import { supabaseAdmin } from '@/lib/supabase'
import { ClickPesa } from '@/lib/clickpesa'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { withdrawalId, vote } = await req.json()
    const userId = user.id

    // 1. Get withdrawal details and group id
    const { data: withdrawal, error: withdrawError } = await supabaseAdmin
      .from('group_withdrawals')
      .select('*, group:groups(*)')
      .eq('id', withdrawalId)
      .single()

    if (withdrawError || !withdrawal) return NextResponse.json({ error: 'Ombi halijapatikana' }, { status: 404 })
    if (withdrawal.status !== 'PENDING') return NextResponse.json({ error: 'Ombi hili limeshapitishwa au kukataliwa' }, { status: 400 })

    // 2. record the vote
    const { error: voteError } = await supabaseAdmin
      .from('group_withdrawal_votes')
      .upsert({
        withdrawalId,
        userId,
        vote
      })
    
    if (voteError) throw voteError

    // 3. Count votes and check threshold
    const { count: totalMembers } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', withdrawal.groupId)

    const { count: yesVotes } = await supabaseAdmin
      .from('group_withdrawal_votes')
      .select('*', { count: 'exact', head: true })
      .eq('withdrawalId', withdrawalId)
      .eq('vote', 'YES')

    const threshold = Math.floor((totalMembers || 0) / 2) + 1

    if ((yesVotes || 0) >= threshold) {
      // 4. Threshold met! Execute Payout
      const adminId = withdrawal.requestedBy
      const { data: admin } = await supabaseAdmin.from('users').select('phone').eq('id', adminId).single()
      
      if (!admin?.phone) throw new Error('Simu ya Admin haijapatikana')

      const externalId = `GRP-WDL-${uuidv4().substring(0, 8)}`
      
      try {
        // Update status to PROCESSING first
        await supabaseAdmin.from('group_withdrawals').update({ status: 'APPROVED' }).eq('id', withdrawalId)

        // Initiate ClickPesa Payout
        await ClickPesa.initiatePayout({
          amount: withdrawal.amount,
          phone: admin.phone,
          externalId
        })

        // Subtract from group balance
        await supabaseAdmin
          .from('groups')
          .update({ wallet_balance: withdrawal.group.wallet_balance - withdrawal.amount })
          .eq('id', withdrawal.groupId)

        // Create payment record
        await supabaseAdmin.from('payments').insert({
          userId: adminId,
          amount: withdrawal.amount,
          status: 'COMPLETED', // Or track via payout webhook if supported
          provider: 'CLICKPESA',
          external_id: externalId,
          metadata: { groupId: withdrawal.groupId, type: 'GROUP_WITHDRAWAL' }
        })

        return NextResponse.json({ success: true, message: 'Kura zimetimia! Pesa imetumwa kwa Admin.' })

      } catch (cpError: any) {
        console.error('ClickPesa Payout Error:', cpError)
        await supabaseAdmin.from('group_withdrawals').update({ status: 'FAILED' }).eq('id', withdrawalId)
        return NextResponse.json({ error: 'Kura zimetimia lakini mchakato wa kutuma pesa umefeli.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Kura yako imerekodiwa.' })

  } catch (error: any) {
    console.error('Voting error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
