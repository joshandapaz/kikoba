import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * AzamPay Payment Status Polling — Supabase Edge Function
 * GET /functions/v1/azampay-status?external_id=AZ-XXXX
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const externalId = url.searchParams.get('external_id')

    if (!externalId) {
      return new Response(JSON.stringify({ error: 'external_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('status, amount, metadata, created_at')
      .eq('merchant_reference', externalId)
      .single()

    return new Response(JSON.stringify({
      status: payment?.status || 'PENDING',
      amount: payment?.amount,
      provider: payment?.metadata?.operator,
      createdAt: payment?.created_at,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
