/**
 * PesaPal v3 Integration Library
 * Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json
 */

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY?.trim()
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET?.trim()
const ENV = (process.env.PESAPAL_ENV?.trim() || 'SANDBOX') as 'SANDBOX' | 'LIVE'

const API_BASE_URL = ENV === 'LIVE'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3'

export class PesaPal {
  private static token: string | null = null
  private static tokenExpiry: number = 0
  private static ipnId: string | null = null

  // 1. Authentication
  static async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    if (this.token && now < this.tokenExpiry) {
      return this.token
    }

    console.log('[PesaPal] Requesting access token...')
    const res = await fetch(`${API_BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET
      })
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(`[PesaPal] Token Error: ${JSON.stringify(data)}`)
    }

    this.token = data.token
    // PesaPal tokens expire in 5 minutes (300 seconds), refresh early
    this.tokenExpiry = now + 250
    return this.token!
  }

  // 2. Register/Fetch IPN ID
  static async getIpnId(webhookUrl: string): Promise<string> {
    if (this.ipnId) return this.ipnId

    const token = await this.getAccessToken()

    // Try to find if we already registered this URL
    const getRes = await fetch(`${API_BASE_URL}/api/URLSetup/GetIpnList`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    })
    
    if (getRes.ok) {
        const listData = await getRes.json()
        const existing = listData?.find((ipn: any) => ipn.url === webhookUrl)
        if (existing) {
          this.ipnId = existing.ipn_id
          return this.ipnId!
        }
    }

    // Register a new one
    console.log('[PesaPal] Registering new IPN:', webhookUrl)
    const regRes = await fetch(`${API_BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        ipn_notification_type: 'POST'
      })
    })

    const regData = await regRes.json()
    if (!regRes.ok || regData.error) {
      throw new Error(`[PesaPal] IPN Registration Error: ${JSON.stringify(regData)}`)
    }

    this.ipnId = regData.ipn_id
    return this.ipnId!
  }

  // 3. Submit Order Request
  static async submitOrder(params: {
    id: string
    amount: number
    currency: string
    description: string
    callbackUrl: string
    webhookUrl: string
    cancellationUrl: string
    phone?: string
    email?: string
    firstName?: string
    lastName?: string
  }) {
    const token = await this.getAccessToken()
    const ipnId = await this.getIpnId(params.webhookUrl)

    const payload = {
      id: params.id,
      currency: params.currency,
      amount: params.amount,
      description: params.description,
      callback_url: params.callbackUrl,
      cancellation_url: params.cancellationUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: params.email || 'customer@kikoba.com',
        phone_number: params.phone || '',
        country_code: 'TZ',
        first_name: params.firstName || 'Kikoba',
        last_name: params.lastName || 'User',
      }
    }

    const res = await fetch(`${API_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `[PesaPal] Order Error: ${JSON.stringify(data)}`)
    }

    return {
      orderTrackingId: data.order_tracking_id,
      merchantReference: data.merchant_reference,
      redirectUrl: data.redirect_url,
      error: data.error
    }
  }

  // 4. Get Transaction Status
  static async getTransactionStatus(orderTrackingId: string) {
    const token = await this.getAccessToken()

    const res = await fetch(`${API_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(`[PesaPal] Check Status Error: ${JSON.stringify(data)}`)
    }

    return data
  }
}
