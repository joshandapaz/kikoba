export const dynamic = 'force-dynamic'
export function generateStaticParams() { return []; }
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/auth-server'

import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSupabaseUser(req)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: loanId } = await params
    const { vote } = await req.json()

    if (!['APPROVE', 'REJECT'].includes(vote)) {
      return NextResponse.json({ error: 'Kura si sahihi' }, { status: 400 })
    }

    // Fetch loan and group
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*, group:groups(*, members:group_members(*)), votes:loan_votes(*)')
      .eq('id', loanId)
      .single()

    if (loanError || !loan) return NextResponse.json({ error: 'Mkopo haupatikani' }, { status: 404 })
    const loanTyped = loan as any
    
    if (loanTyped.status !== 'PENDING') {
      return NextResponse.json({ error: 'Mkopo huu hauwezi kupigwa kura' }, { status: 400 })
    }
    if (loanTyped.userId === user.id) {
      return NextResponse.json({ error: 'Huwezi kupiga kura kwenye mkopo wako mwenyewe' }, { status: 400 })
    }

    // Check membership
    const isMember = loanTyped.group.members.some((m: any) => m.userId === user.id)
    if (!isMember) return NextResponse.json({ error: 'Wewe si mwanachama' }, { status: 403 })

    // Check duplicate vote
    const { data: existing } = await supabaseAdmin
      .from('loan_votes')
      .select('id')
      .eq('loanId', loanId)
      .eq('userId', user.id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Umeshapiga kura kwenye mkopo huu' }, { status: 400 })

    await supabaseAdmin
      .from('loan_votes')
      .insert({ loanId, userId: user.id, vote })

    // Auto-decide if enough votes
    const totalMembers = loanTyped.group.members.length
    const allVotes = [...loanTyped.votes, { vote }]
    const approvals = allVotes.filter((v: any) => v.vote === 'APPROVE').length
    const rejections = allVotes.filter((v: any) => v.vote === 'REJECT').length
    const threshold = Math.ceil(totalMembers * 0.6)

    if (approvals >= threshold) {
      await supabaseAdmin.from('loans').update({ status: 'APPROVED' }).eq('id', loanId)
      await supabaseAdmin.from('activities').insert({
        userId: user.id,
        groupId: loanTyped.groupId,
        action: 'Mkopo umeidhinishwa',
        amount: loanTyped.amount
      })
    } else if (rejections > totalMembers - threshold) {
      await supabaseAdmin.from('loans').update({ status: 'REJECTED' }).eq('id', loanId)
      await supabaseAdmin.from('activities').insert({
        userId: user.id,
        groupId: loanTyped.groupId,
        action: 'Mkopo umekataliwa',
        amount: loanTyped.amount
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}

