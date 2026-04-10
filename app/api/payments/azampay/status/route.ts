import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Poll the status of an AzamPay payment by external_id.
 * Used by the callback page to show real-time status to the user.
 */
export async function GET(req: NextRequest) {
  const externalId = req.nextUrl.searchParams.get('external_id')

  if (!externalId) {
    return NextResponse.json({ error: 'external_id is required' }, { status: 400 })
  }

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('status, amount, metadata, created_at')
    .eq('merchant_reference', externalId)
    .single()

  if (error || !payment) {
    return NextResponse.json({ status: 'PENDING' })
  }

  return NextResponse.json({
    status: payment.status,
    amount: payment.amount,
    provider: payment.metadata?.operator,
    createdAt: payment.created_at,
  })
}
