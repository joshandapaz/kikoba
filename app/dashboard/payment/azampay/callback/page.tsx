'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

function AzamPayCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [amount, setAmount] = useState<number | null>(null)
  const [provider, setProvider] = useState<string | null>(null)

  const externalId = searchParams.get('external_id')

  useEffect(() => {
    if (!externalId) {
      setStatus('failed')
      return
    }

    let attempts = 0
    const MAX_ATTEMPTS = 15

    const poll = async () => {
      try {
        // Use Supabase Edge Function when deployed statically (GitHub Pages)
        const statusUrl = process.env.NEXT_PUBLIC_EXPORT === 'true'
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/azampay-status?external_id=${externalId}`
          : `/api/payments/azampay/status?external_id=${externalId}`
        const res = await fetch(statusUrl)
        const data = await res.json()

        if (data.status === 'COMPLETED') {
          setStatus('success')
          setAmount(data.amount)
          setProvider(data.provider)
          setTimeout(() => router.push('/dashboard'), 5000)
        } else if (data.status === 'FAILED') {
          setStatus('failed')
        } else if (attempts < MAX_ATTEMPTS) {
          attempts++
          setTimeout(poll, 3000)
        } else {
          setStatus('failed')
        }
      } catch {
        if (attempts < MAX_ATTEMPTS) {
          attempts++
          setTimeout(poll, 3000)
        } else {
          setStatus('failed')
        }
      }
    }

    poll()
  }, [externalId, router])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 32,
        padding: 40,
        backdropFilter: 'blur(20px)',
      }}>

        {/* AzamPay Logo Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,184,148,0.1)',
          border: '1px solid rgba(0,184,148,0.3)',
          borderRadius: 999,
          padding: '6px 16px',
          marginBottom: 32,
        }}>
          <Smartphone size={14} color="#00b894" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#00b894', textTransform: 'uppercase', letterSpacing: 1 }}>
            AzamPay
          </span>
        </div>

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(0,184,148,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Loader2 size={40} color="#00b894" className="spinner" />
              </div>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#FFF', margin: 0 }}>
              Tunathibitisha Malipo...
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Tafadhali angalia simu yako na kukamilisha muamala wa AzamPay.
            </p>
            <div style={{
              display: 'flex', gap: 6, marginTop: 8,
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#00b894',
                  opacity: 0.3,
                  animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(0,255,135,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={48} color="#00FF87" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFF', margin: 0 }}>
              Malipo Yamefanikiwa! 🎉
            </h1>
            {amount && (
              <div style={{
                fontSize: 32, fontWeight: 900,
                background: 'linear-gradient(90deg, #00FF87, #00b894)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {formatCurrency(amount)}
              </div>
            )}
            {provider && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
                Kupitia {provider} • AzamPay
              </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              Utaelekezwa kwenye dashibodi baada ya sekunde 5...
            </p>
            <Link href="/dashboard" className="btn-primary" style={{
              marginTop: 8, display: 'block', width: '100%',
              borderRadius: 20, padding: '16px 0',
              background: '#00b894', color: '#FFF',
              fontWeight: 800, fontSize: 15, textAlign: 'center',
              textDecoration: 'none',
            }}>
              Rudi Kwenye Dashibodi
            </Link>
          </div>
        )}

        {status === 'failed' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,77,77,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={48} color="#FF4D4D" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFF', margin: 0 }}>
              Malipo Yameshindwa
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Samahani, malipo yako hayakufanyika. Tafadhali jaribu tena au wasiliana na msaada.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, width: '100%' }}>
              <Link href="/dashboard" style={{
                flex: 1, padding: '14px 0', borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#FFF', fontWeight: 700, fontSize: 14,
                textAlign: 'center', textDecoration: 'none',
              }}>
                Rudi Nyumbani
              </Link>
              <button onClick={() => window.location.reload()} style={{
                flex: 1, padding: '14px 0', borderRadius: 16,
                background: '#00b894', border: 'none',
                color: '#FFF', fontWeight: 800, fontSize: 14,
                cursor: 'pointer',
              }}>
                Jaribu Tena
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const DynamicContent = dynamic(() => Promise.resolve(AzamPayCallbackContent), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={48} className="spinner" color="var(--primary)" />
    </div>
  ),
})

export default function AzamPayCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="spinner" color="var(--primary)" />
      </div>
    }>
      <DynamicContent />
    </Suspense>
  )
}
