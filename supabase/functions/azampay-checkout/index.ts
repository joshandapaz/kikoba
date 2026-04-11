import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AZAMPAY_APP_NAME = (Deno.env.get('AZAMPAY_APP_NAME') || 'Kikoba').trim()
const AZAMPAY_CLIENT_ID = Deno.env.get('AZAMPAY_CLIENT_ID')?.trim()!
const AZAMPAY_CLIENT_SECRET = Deno.env.get('AZAMPAY_CLIENT_SECRET')?.trim()!
const AZAMPAY_API_KEY = Deno.env.get('AZAMPAY_API_KEY')?.trim()!
const AZAMPAY_ENV = (Deno.env.get('AZAMPAY_ENV') || 'SANDBOX').trim()

const AUTH_URL = AZAMPAY_ENV === 'LIVE'
  ? 'https://authenticator.azampay.co.tz'
  : 'https://authenticator-sandbox.azampay.co.tz'

const API_URL = AZAMPAY_ENV === 'LIVE'
  ? 'https://api.azampay.co.tz'
  : 'https://sandbox.azampay.co.tz'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '255' + clean.substring(1)
  if (clean.startsWith('7') || clean.startsWith('6')) clean = '255' + clean
  return clean
}

function detectProvider(phone: string): string {
  const local = phone.startsWith('255') ? phone.substring(3) : phone
  // Vodacom (074, 075, 076, 066)
  if (/^(74|75|76|66)/.test(local)) return 'Mpesa'
  // Tigo (065, 067, 071)
  if (/^(65|67|71)/.test(local)) return 'Tigo'
  // Airtel (068, 069, 078, 079)
  if (/^(68|69|78|79)/.test(local)) return 'Airtel'
  // Halotel (061, 062)
  if (/^(61|62)/.test(local)) return 'Halopesa'
  return 'Tigo' // fallback
}

let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiry) return cachedToken

  const res = await fetch(`${AUTH_URL}/AppRegistration/GenerateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: AZAMPAY_APP_NAME,
      clientId: AZAMPAY_CLIENT_ID,
      clientSecret: AZAMPAY_CLIENT_SECRET,
    }),
  })

  const data = await res.json()
  if (!data.data?.accessToken) throw new Error(`Token error: ${JSON.stringify(data)}`)
  cachedToken = data.data.accessToken
  tokenExpiry = now + 3300
  return cachedToken!
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { amount, phone, walletType = 'PERSONAL', groupId, userId } = await req.json()

    if (!amount || !phone || !userId) {
      return new Response(JSON.stringify({ error: 'amount, phone, userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique external ID
    const externalId = `AZ-${crypto.randomUUID().substring(0, 12).toUpperCase()}__${walletType}__${groupId || 'none'}`
    const normalizedPhone = normalizePhone(phone)
    const provider = detectProvider(normalizedPhone)

    // Record pending payment
    await supabase.from('payments').insert({
      user_id: userId,
      amount,
      status: 'PENDING',
      provider: 'AZAMPAY',
      merchant_reference: externalId,
      metadata: { type: 'DEPOSIT', walletType, groupId },
    })

    // Get AzamPay token and initiate MNO checkout
    const token = await getToken()

    const checkoutRes = await fetch(`${API_URL}/azampay/mno/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': AZAMPAY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber: normalizedPhone,
        amount: String(amount),
        currency: 'TZS',
        externalId,
        provider,
        additionalProperties: {},
      }),
    })

    const result = await checkoutRes.json()

    if (!checkoutRes.ok || !result.success) {
      throw new Error(result.message || 'MNO checkout failed')
    }

    return new Response(JSON.stringify({
      success: true,
      externalId,
      provider,
      message: 'Ombi la malipo limetumwa. Tafadhali angalia simu yako kukamilisha.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[azampay-checkout]', err)
    return new Response(JSON.stringify({ error: err.message || 'The string did not match the expected pattern' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
