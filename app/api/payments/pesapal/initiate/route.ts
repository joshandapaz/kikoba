import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPesaPalAuthToken, registerIPN, submitOrder } from '@/lib/pesapal';
import { supabaseAdmin } from '@/lib/supabase';


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, phone } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Kiasi kisicho sahihi' }, { status: 400 });
    }

    const token = await getPesaPalAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Imeshindwa kuwasiliana na PesaPal' }, { status: 500 });
    }

    // Register IPN for this transaction (In production, this could be global/one-time)
    const callbackBase = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const ipnId = await registerIPN(token, `${callbackBase}/api/payments/pesapal/ipn`);
    if (!ipnId) {
      return NextResponse.json({ error: 'Imeshindwa kusajili IPN' }, { status: 500 });
    }

    // Generate a unique merchant reference for this transaction
    const merchant_reference = crypto.randomUUID();

    // 3. Store payment attempt
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        merchant_reference,
        userId: session.user.id,
        amount: parseFloat(amount),
        status: 'PENDING'
      });

    if (paymentError) throw paymentError;

    // 4. Create order request
    const orderRequest = {
      id: merchant_reference,
      currency: 'TZS',
      amount: parseFloat(amount),
      description: `Kikoba Deposit - ${session.user.name}`,
      callback_url: `${callbackBase}/api/payments/pesapal/callback`,
      notification_id: ipnId,
      billing_address: {
        email_address: session.user.email || 'user@kikoba.com',
        phone_number: phone || (session.user as any).phone || '',
        country_code: 'TZ',
        first_name: session.user.name?.split(' ')[0] || 'Member',
        last_name: session.user.name?.split(' ')[1] || 'Kikoba',
      },
    };

    const result = await submitOrder(token, orderRequest);
    if (!result) {
      return NextResponse.json({ error: 'Imeshindwa kuanzisha malipo' }, { status: 500 });
    }

    // Log the initiation in activities (optional, or wait for IPN)
    // For now, return the redirect URL
    return NextResponse.json({ 
      success: true, 
      redirectUrl: result.redirect_url,
      merchantReference: merchant_reference
    });

  } catch (err: any) {
    console.error('PesaPal Initiation Error:', err);
    return NextResponse.json({ error: 'Hitilafu imetokea' }, { status: 500 });
  }
}
