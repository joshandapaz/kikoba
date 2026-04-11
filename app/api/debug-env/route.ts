import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    appName: process.env.AZAMPAY_APP_NAME,
    env: process.env.AZAMPAY_ENV,
    secretPrefix: process.env.AZAMPAY_CLIENT_SECRET?.substring(0, 5),
    secretSuffix: process.env.AZAMPAY_CLIENT_SECRET?.slice(-5),
    secretLength: process.env.AZAMPAY_CLIENT_SECRET?.length,
    appName: process.env.AZAMPAY_APP_NAME
  })
}
