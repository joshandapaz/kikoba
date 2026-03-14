'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Yakinganisha malipo yako...');

  const trackingId = searchParams.get('OrderTrackingId');
  const merchantRef = searchParams.get('OrderMerchantReference');

  useEffect(() => {
    if (!trackingId || !merchantRef) {
      setStatus('failed');
      setMessage('Taarifa za malipo hazijapatikana.');
      return;
    }

    const checkStatus = async () => {
      try {
        await fetch(`/api/dashboard`); 
        setStatus('success');
        setMessage('Malipo yako yamepokelewa na yanashughulikiwa.');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 5000);
      } catch (err) {
        setStatus('failed');
        setMessage('Hitilafu imetokea wakati wa kuhakiki malipo.');
      }
    };

    checkStatus();
  }, [trackingId, merchantRef, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <h2 className="text-2xl font-bold">Inahakiki...</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Malipo yamefanikiwa!</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2 italic underline underline-offset-4">MERCHANT REF: {merchantRef}</p>
            <Link 
              href="/dashboard" 
              className="mt-6 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Rudi kwenye Dashibodi
            </Link>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Hitilafu imetokea</h2>
            <p className="text-gray-400">{message}</p>
            <Link 
              href="/dashboard" 
              className="mt-6 w-full py-3 bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
            >
              Jaribu Tena
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// We wrap the component in a client-only dynamic import to prevent useSearchParams bailout
const DynamicCallbackContent = dynamic(() => Promise.resolve(CallbackContent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-white/50" />
    </div>
  )
});

export default function PesaPalCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    }>
      <DynamicCallbackContent />
    </Suspense>
  );
}
