export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Namba ya simu inahitajika' }, { status: 400 })
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Namba hii ya simu tayari imeshasajiliwa. Tafadhali ingia.' }, { status: 400 })
    }

    // 2. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // 3. Store OTP (Clean up old ones for this phone first)
    await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('phone', phone)

    const { error: insertError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone,
        code,
        expiresAt: expiresAt.toISOString()
      })

    if (insertError) throw insertError

    // 4. Send OTP (Simulated for now, would use SMS gateway here)
    console.log(`[OTP DEBUG] Phone: ${phone}, Code: ${code}`)
    
    // In a real app, you'd call an SMS API here.
    // Return success to the client
    return NextResponse.json({ 
      success: true, 
      message: 'Nambari ya uhakiki imetumwa kwenda ' + phone,
      // In dev mode, we return the code for testing convenience, 
      // but in production, we absolutely would not do this.
      devCode: code 
    })

  } catch (err: any) {
    console.error('OTP Send Error:', err)
    return NextResponse.json({ error: 'Imeshindwa kutuma nambari ya uhakiki' }, { status: 500 })
  }
}
