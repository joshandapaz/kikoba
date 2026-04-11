/**
 * AzamPay Integration Library
 * Handles authentication, MNO (Mobile Money) checkout, and disbursement
 * Docs: https://developerdocs.azampay.co.tz
 */

const CLIENT_ID = process.env.AZAMPAY_CLIENT_ID?.trim()
const CLIENT_SECRET = process.env.AZAMPAY_CLIENT_SECRET?.trim()
const API_KEY = process.env.AZAMPAY_API_KEY?.trim()
const APP_NAME = (process.env.AZAMPAY_APP_NAME || 'Kikoba').trim()
const ENV = (process.env.AZAMPAY_ENV?.trim() || 'SANDBOX') as 'SANDBOX' | 'LIVE'

const AUTH_BASE_URL =
  ENV === 'LIVE'
    ? 'https://authenticator.azampay.co.tz'
    : 'https://authenticator-sandbox.azampay.co.tz'

const API_BASE_URL =
  ENV === 'LIVE'
    ? 'https://api.azampay.co.tz'
    : 'https://sandbox.azampay.co.tz'

// Determine MNO provider from phone number prefix (Tanzania)
function detectProvider(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  // Normalize to local part (e.g., 74..., 65...)
  const local = clean.startsWith('255') ? clean.substring(3) : clean.startsWith('0') ? clean.substring(1) : clean

  // Vodacom (074, 075, 076, 066)
  if (/^(74|75|76|66)/.test(local)) return 'Mpesa'
  // Tigo (065, 067, 071)
  if (/^(65|67|71)/.test(local)) return 'Tigo'
  // Airtel (068, 069, 078, 079)
  if (/^(68|69|78|79)/.test(local)) return 'Airtel'
  // Halotel (061, 062)
  if (/^(61|62)/.test(local)) return 'Halopesa'
  // TTCL (073)
  if (/^(73)/.test(local)) return 'Tigo' // Fallback to Tigo or keep as is if AzamPay supports others

  return 'Tigo' // default fallback
}

// Normalize phone to 255XXXXXXXXX
function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '255' + clean.substring(1)
  if (clean.startsWith('7') || clean.startsWith('6')) clean = '255' + clean
  return clean
}

export class AzamPay {
  private static token: string | null = null
  private static tokenExpiry: number = 0

  // ─── AUTH ────────────────────────────────────────────────────────────────────

  static async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    if (this.token && now < this.tokenExpiry) {
      return this.token
    }

    console.log('[AzamPay] Generating access token...')

    const response = await fetch(`${AUTH_BASE_URL}/AppRegistration/GenerateToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName: APP_NAME,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`[AzamPay] Token generation failed: ${err}`)
    }

    const data = await response.json()

    if (!data.data?.accessToken) {
      throw new Error(`[AzamPay] Token missing in response: ${JSON.stringify(data)}`)
    }

    this.token = data.data.accessToken
    // Token expires in 1 hour; we refresh 5 min early
    this.tokenExpiry = now + 3300
    return this.token!
  }

  // ─── MNO CHECKOUT (USSD PUSH) ────────────────────────────────────────────────

  static async initiateMnoCheckout(params: {
    amount: number
    phone: string
    externalId: string
    currency?: string
  }) {
    const token = await this.getAccessToken()
    const phone = normalizePhone(params.phone)
    const provider = detectProvider(phone)

    const body = {
      accountNumber: phone,
      amount: String(params.amount),
      currency: params.currency || 'TZS',
      externalId: params.externalId,
      provider,
      additionalProperties: {},
    }

    console.log('[AzamPay] MNO Checkout Request:', JSON.stringify(body, null, 2))

    const response = await fetch(`${API_BASE_URL}/azampay/mno/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    console.log('[AzamPay] MNO Checkout Response:', response.status, JSON.stringify(result, null, 2))

    if (!response.ok || !result.success) {
      throw new Error(result.message || `[AzamPay] MNO checkout failed (${response.status})`)
    }

    return { ...result, provider }
  }

  // ─── DISBURSEMENT (PAYOUT) ───────────────────────────────────────────────────

  static async disburse(params: {
    amount: number
    phone: string
    externalId: string
    remarks?: string
  }) {
    const token = await this.getAccessToken()
    const phone = normalizePhone(params.phone)
    const bankName = detectProvider(phone)

    const body = {
      source: {
        countryCode: 'TZ',
        fullName: APP_NAME,
        bankName: 'AzamPay',
        accountNumber: '',
        currency: 'TZS',
      },
      destination: {
        countryCode: 'TZ',
        fullName: '',
        bankName,
        accountNumber: phone,
        currency: 'TZS',
      },
      transferDetails: {
        type: 'MNO',
        amount: params.amount,
        date: new Date().toISOString().split('T')[0],
      },
      externalReferenceId: params.externalId,
      remarks: params.remarks || 'Withdrawal from Kikoba',
    }

    console.log('[AzamPay] Disburse Request:', JSON.stringify(body, null, 2))

    const response = await fetch(`${API_BASE_URL}/azampay/disburse`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    console.log('[AzamPay] Disburse Response:', response.status, JSON.stringify(result, null, 2))

    if (!response.ok || !result.success) {
      throw new Error(result.message || `[AzamPay] Disbursement failed (${response.status})`)
    }

    return result
  }

  // ─── TRANSACTION STATUS ──────────────────────────────────────────────────────

  static async getTransactionStatus(params: { reference: string; bankName: string }) {
    const token = await this.getAccessToken()

    const response = await fetch(`${API_BASE_URL}/azampay/gettransactionstatus`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const result = await response.json()
    return result
  }
}
