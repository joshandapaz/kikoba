import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const externalId = searchParams.get('external_id')

    if (!externalId) {
      return NextResponse.json({ error: 'External ID required' }, { status: 400 })
    }

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('status')
      .eq('merchant_reference', externalId)
      .single()

    if (error || !payment) {
      return NextResponse.json({ status: 'NOT_FOUND' })
    }

    return NextResponse.json({ status: payment.status })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
