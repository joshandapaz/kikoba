export const dynamic = 'force-static'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: loanId } = await params
    const { amount, note } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Kiasi cha malipo si sahihi' }, { status: 400 })
    }

    // Fetch loan and payments
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*, payments:loan_payments(*)')
      .eq('id', loanId)
      .single()

    if (loanError || !loan) return NextResponse.json({ error: 'Mkopo haupatikani' }, { status: 404 })
    const loanTyped = loan as any
    
    if (loanTyped.userId !== session.user.id) return NextResponse.json({ error: 'Hii si mkopo wako' }, { status: 403 })
    if (loanTyped.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Mkopo huu haujaidhinishwa bado' }, { status: 400 })
    }

    const totalWithInterest = loanTyped.amount + (loanTyped.amount * loanTyped.interestRate) / 100
    const totalPaid = (loanTyped.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)
    const remaining = totalWithInterest - totalPaid

    if (amount > remaining) {
      return NextResponse.json({ error: `Kiasi kikubwa zaidi ya deni. Lipa TZS ${remaining.toLocaleString()} tu` }, { status: 400 })
    }

    const { data: payment, error: payError } = await supabaseAdmin
      .from('loan_payments')
      .insert({ loanId, amount, note })
      .select()
      .single()

    if (payError) throw payError

    // Check if fully paid
    const newTotal = totalPaid + amount
    if (newTotal >= totalWithInterest) {
      await supabaseAdmin.from('loans').update({ status: 'PAID' }).eq('id', loanId)
      await supabaseAdmin.from('activities').insert({
        userId: session.user.id,
        groupId: loanTyped.groupId,
        action: 'Mkopo umelipwa kikamilifu',
        amount: loanTyped.amount
      })
    } else {
      await supabaseAdmin.from('activities').insert({
        userId: session.user.id,
        groupId: loanTyped.groupId,
        action: 'Amelipa sehemu ya mkopo',
        amount: amount
      })
    }

    return NextResponse.json(payment)
  } catch (err: any) {
    console.error('Repay error:', err)
    return NextResponse.json({ error: 'Hitilafu ya ndani' }, { status: 500 })
  }
}


export function generateStaticParams() { return []; }
