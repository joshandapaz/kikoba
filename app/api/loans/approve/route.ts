export const dynamic = 'force-static'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { loanId, action } = await req.json() // action: 'APPROVE' or 'REJECT'
    const adminId = session.user.id

    if (!loanId || !action) {
      return NextResponse.json({ error: 'Data haijakamailika' }, { status: 400 })
    }

    // 1. Fetch loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*, group:groups(*)')
      .eq('id', loanId)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Mkopo haukupatikana' }, { status: 404 })
    }

    // 2. Verify admin permission
    const { data: adminMember } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('userId', adminId)
      .eq('groupId', loan.groupId)
      .eq('role', 'ADMIN')
      .single()

    if (!adminMember) {
      return NextResponse.json({ error: 'Huna mamlaka ya kuidhinisha mkopo huu' }, { status: 403 })
    }

    if (loan.status !== 'PENDING_ADMIN') {
      return NextResponse.json({ error: 'Mkopo huu tayari umeshughulikiwa' }, { status: 400 })
    }

    if (action === 'REJECT') {
      await supabaseAdmin.from('loans').update({ status: 'REJECTED' }).eq('id', loanId)
      return NextResponse.json({ success: true, message: 'Mkopo umekataliwa' })
    }

    // 3. Approval Flow: Internal Transfer
    const amount = loan.amount
    const borrowerId = loan.userId
    const groupId = loan.groupId

    // a. Check group balance
    if ((loan.group.wallet_balance || 0) < amount) {
      return NextResponse.json({ error: 'Salio la mfuko wa kikundi halitoshi kutoa mkopo huu' }, { status: 400 })
    }

    // b. Deduct from Group Wallet
    const { error: groupErr } = await supabaseAdmin
      .from('groups')
      .update({ wallet_balance: (loan.group.wallet_balance || 0) - amount })
      .eq('id', groupId)

    if (groupErr) throw groupErr

    // c. Add to Borrower Personal Wallet
    const { data: borrower } = await supabaseAdmin
      .from('users')
      .select('wallet_balance')
      .eq('id', borrowerId)
      .single()

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({ wallet_balance: (borrower.wallet_balance || 0) + amount })
      .eq('id', borrowerId)

    if (userErr) throw userErr

    // d. Update loan status
    await supabaseAdmin.from('loans').update({ status: 'APPROVED' }).eq('id', loanId)

    // e. Log Activity
    await supabaseAdmin.from('activities').insert({
      userId: borrowerId,
      groupId,
      action: `Mkopo wa TZS ${amount.toLocaleString()} umeidhinishwa na kutumwa kwenye mfuko wako binafsi`,
      amount
    })

    // NEW: Add to Transaction Ledger
    await supabaseAdmin.from('transactions').insert({
      userId: borrowerId,
      groupId,
      type: 'LOAN_DISBURSEMENT',
      amount,
      description: 'Loan disbursement approved by Admin',
      referenceId: loanId
    })

    return NextResponse.json({ success: true, message: 'Mkopo umeidhinishwa na pesa zimetumwa kwa mwanachama' })

  } catch (error: any) {
    console.error('Loan approval error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
