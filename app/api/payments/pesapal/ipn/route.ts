import { NextRequest, NextResponse } from 'next/server';
import { getPesaPalAuthToken, getTransactionStatus } from '@/lib/pesapal';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = await req.json();

    if (OrderNotificationType !== 'IPNCHANGE') {
      return NextResponse.json({ success: true }); // Acknowledge other notifications
    }

    // 1. Get PesaPal token
    const token = await getPesaPalAuthToken();
    if (!token) throw new Error('Failed to get PesaPal token');

    // 2. Fetch transaction status from PesaPal
    const status = await getTransactionStatus(token, OrderTrackingId);
    console.log('[IPN DEBUG] Transaction Status:', status);

    if (status.status_code === 1) { // 1 = Completed in PesaPal v3
      // 3. Find our matching payment record
      const { data: payment, error: fetchError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('merchant_reference', OrderMerchantReference)
        .single();

      if (fetchError || !payment) {
        console.error('Payment record not found for ref:', OrderMerchantReference);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      // 4. Prevent double processing
      if (payment.status === 'COMPLETED') {
        return NextResponse.json({ success: true, message: 'Already processed' });
      }

      // 5. Update user's wallet and payment status
      const amount = payment.amount;

      // Update User Wallet Balance
      const { data: userData, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('wallet_balance')
        .eq('id', payment.userId)
        .single();

      if (userFetchError) throw userFetchError;

      const newBalance = (userData?.wallet_balance || 0) + amount;

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', payment.userId);

      if (updateError) throw updateError;

      // Update Payment Record
      await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'COMPLETED',
          order_tracking_id: OrderTrackingId 
        })
        .eq('id', payment.id);

      // Record Activity
      await supabaseAdmin
        .from('activities')
        .insert({
          userId: payment.userId,
          action: 'DEPOSIT',
          amount: amount,
          date: new Date().toISOString()
        });
      
      console.log(`[PesaPal] Successful deposit of ${amount} for user ${payment.userId}`);
    } else if (status.status_code === 2) { // Failed
       await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'FAILED',
          order_tracking_id: OrderTrackingId 
        })
        .eq('merchant_reference', OrderMerchantReference);
    }

    // Acknowledge receipt to PesaPal
    return NextResponse.json({ 
      status: 200, 
      order_tracking_id: OrderTrackingId,
      merchant_reference: OrderMerchantReference 
    });

  } catch (err: any) {
    console.error('PesaPal IPN Error:', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
