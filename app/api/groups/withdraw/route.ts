export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, reason, groupId } = await req.json()
    const userId = session.user.id

    if (!amount || amount <= 0) return NextResponse.json({ error: 'Kiasi hakitakiwi kuwa sifuri' }, { status: 400 })

    // 1. Check if user is a member of the group
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', userId)
      .eq('groupId', groupId)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Hujajisajili kwenye kikundi hiki' }, { status: 403 })
    }

    // 2. Check if group balance is sufficient
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('wallet_balance')
      .eq('id', groupId)
      .single()

    if (groupError || (group.wallet_balance || 0) < amount) {
      return NextResponse.json({ error: 'Salio la kikundi halitoshi' }, { status: 400 })
    }

    // 3. Create withdrawal request
    const { error: withdrawError } = await supabaseAdmin
      .from('group_withdrawals')
      .insert({
        groupId,
        requestedBy: userId,
        amount,
        reason,
        status: 'PENDING_ADMIN'
      })

    if (withdrawError) throw withdrawError

    return NextResponse.json({ success: true, message: 'Ombi la kutoa pesa limetumwa kwa Admin kwa ajili ya idhini.' })

  } catch (error: any) {
    console.error('Group withdraw error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
