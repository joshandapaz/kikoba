'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const externalId = searchParams.get('external_id')

  useEffect(() => {
    const checkStatus = async () => {
      if (!externalId) {
        setStatus('failed')
        return
      }

      try {
        let attempts = 0
        const poll = async () => {
          const res = await fetch(`/api/payments/status?external_id=${externalId}`)
          const data = await res.json()
          
          if (data.status === 'COMPLETED') {
            setStatus('success')
          } else if (data.status === 'FAILED') {
            setStatus('failed')
          } else if (attempts < 10) {
            attempts++
            setTimeout(poll, 2000)
          } else {
            setStatus('failed')
          }
        }
        poll()
      } catch (err) {
        console.error(err)
        setStatus('failed')
      }
    }

    checkStatus()
  }, [externalId])

  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '0 20px',
      textAlign: 'center'
    }}>
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <Loader2 size={64} className="spinner" color="var(--primary)" />
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Tunathibitisha Malipo...</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tafadhali subiri kidogo tunapopokea taarifa kutoka ClickPesa.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <CheckCircle2 size={80} color="#10b981" />
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Malipo Yamekamilika! 🎉</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Salio lako limeongezwa mafanikio kwa kutumia ClickPesa. Unaweza kuendelea na shughuli zingine.</p>
          <Link href="/dashboard" className="btn-primary" style={{ marginTop: 16 }}>
            Rudi Kwenye Dashibodi
          </Link>
        </div>
      )}

      {status === 'failed' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <XCircle size={80} color="#ef4444" />
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Malipo Yameshindwa</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Samahani, tumeshindwa kuthibitisha malipo yako ya ClickPesa. Tafadhali jaribu tena au wasiliana na msaada.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Link href="/dashboard" className="btn-secondary">Rudi Nyumbani</Link>
            <button onClick={() => window.location.reload()} className="btn-primary">Jaribu Tena</button>
          </div>
        </div>
      )}
    </div>
  )
}

const DynamicCallbackContent = dynamic(() => Promise.resolve(CallbackContent), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={64} className="spinner" color="var(--primary)" />
    </div>
  )
})

export default function ClickPesaCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={64} className="spinner" color="var(--primary)" />
      </div>
    }>
      <DynamicCallbackContent />
    </Suspense>
  )
}
