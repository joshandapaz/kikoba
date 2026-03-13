const CLIENT_ID = process.env.CLICKPESA_CLIENT_ID
const API_KEY = process.env.CLICKPESA_API_KEY
const BASE_URL = process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com'

export class ClickPesa {
  private static token: string | null = null
  private static tokenExpiry: number = 0

  private static async getAccessToken() {
    const now = Math.floor(Date.now() / 1000)
    if (this.token && now < this.tokenExpiry) {
      return this.token
    }

    console.log('Generating ClickPesa Access Token...')
    const response = await fetch(`${BASE_URL}/third-parties/generate-token`, {
      method: 'POST',
      headers: {
        'client-id': CLIENT_ID!,
        'api-key': API_KEY!,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Failed to generate ClickPesa token: ${err}`)
    }

    const data = await response.json()
    // The ClickPesa API returns the token with "Bearer " prefix sometimes, we clean it to be consistent
    this.token = data.token.startsWith('Bearer ') ? data.token.substring(7) : data.token
    this.tokenExpiry = now + 3540 
    return this.token
  }

  static async initiateUssdPush(params: {
    amount: number
    phone: string
    externalId: string
  }) {
    const token = await this.getAccessToken()

    // ClickPesa requires pure digits, starting with 255, no plus sign
    let formattedPhone = params.phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '255' + formattedPhone.substring(1)
    if (formattedPhone.startsWith('7') || formattedPhone.startsWith('6')) formattedPhone = '255' + formattedPhone

    const body = {
      amount: params.amount,
      currency: 'TZS',
      order_reference: params.externalId,
      phone_number: formattedPhone,
      description: 'Deposit to Kikoba Wallet',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/clickpesa/webhook`
    }

    console.log('--- ClickPesa USSD Push Request ---')
    console.log('Endpoint:', `${BASE_URL}/third-parties/payments/initiate-ussd-push-request`)
    console.log('Payload:', JSON.stringify(body, null, 2))

    const response = await fetch(`${BASE_URL}/third-parties/payments/initiate-ussd-push-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()
    console.log('--- ClickPesa USSD Push Response ---')
    console.log('Status:', response.status)
    console.log('Data:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      throw new Error(result.message || 'ClickPesa USSD push failed')
    }

    return result
  }

  static async initiatePayout(params: {
    amount: number
    phone: string
    externalId: string
  }) {
    const token = await this.getAccessToken()

    let formattedPhone = params.phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '255' + formattedPhone.substring(1)
    if (formattedPhone.startsWith('7') || formattedPhone.startsWith('6')) formattedPhone = '255' + formattedPhone

    const body = {
      amount: params.amount,
      currency: 'TZS',
      external_id: params.externalId,
      phone_number: formattedPhone,
      description: 'Withdrawal from Kikoba Group'
    }

    console.log('--- ClickPesa Payout Request ---')
    console.log('Payload:', JSON.stringify(body, null, 2))

    const response = await fetch(`${BASE_URL}/third-parties/payouts/create-mobile-money-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await response.json()
    console.log('--- ClickPesa Payout Response ---')
    console.log('Status:', response.status)
    console.log('Data:', JSON.stringify(result, null, 2))

    if (!response.ok) {
      throw new Error(result.message || 'ClickPesa payout failed')
    }

    return result
  }
}
