'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Mail, Lock, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', otp: '' })
  const [step, setStep] = useState(1) // 1: Info, 2: OTP
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handle(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function sendOtp() {
    setError('')
    setLoading(true)
    try {
      const res = await apiClient('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: form.phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Imeshindwa kutuma nambari ya uhakiki')
        return
      }
      setStep(2)
      if (data.devCode) {
        console.log('Dev OTP:', data.devCode)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      sendOtp()
      return
    }

    setError('')
    setLoading(true)
    
    const res = await apiClient('/api/register', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Hitilafu imetokea')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(255,255,255,0.05)'
          }}>
            <Wallet size={36} color="#000" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFF', marginBottom: 8, letterSpacing: '-1px' }}>
            {step === 1 ? 'Jisajili Kikoba Smart' : 'Hakiki Namba Yako'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {step === 1 ? 'Unda akaunti yako ya bure leo' : `Tumetuma namba ya siri kwenda ${form.phone}`}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Nambari ya Simu</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input className="input-field" style={{ paddingLeft: 40 }}
                    placeholder="+255700000000"
                    value={form.phone}
                    onChange={e => handle('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Jina la Mtumiaji</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input className="input-field" style={{ paddingLeft: 40 }}
                      placeholder="john_doe"
                      value={form.username}
                      onChange={e => handle('username', e.target.value)}
                      required minLength={3}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Barua Pepe</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input className="input-field" style={{ paddingLeft: 40 }}
                      type="email" placeholder="mfano@email.com"
                      value={form.email}
                      onChange={e => handle('email', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nywila</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input className="input-field" style={{ paddingLeft: 40 }}
                    type="password" placeholder="Nywila (harfu 8+)"
                    value={form.password}
                    onChange={e => handle('password', e.target.value)}
                    required minLength={8}
                  />
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : <><span>Tuma Namba ya Uhakiki</span><ArrowRight size={16} /></>}
              </button>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginTop: 18 }}>
                <label className="form-label">Namba ya Uhakiki (OTP)</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input className="input-field" style={{ paddingLeft: 40, letterSpacing: 8, fontSize: 20, fontWeight: 900, textAlign: 'center' }}
                    placeholder="000000"
                    value={form.otp}
                    onChange={e => handle('otp', e.target.value)}
                    required maxLength={6}
                  />
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : <><span>Kamilisha Usajili</span><ArrowRight size={16} /></>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button 
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Tuma namba nyingine
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', marginLeft: 20, textDecoration: 'underline' }}
                >
                  Badili maelezo
                </button>
              </div>
            </>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: 15 }}>
          Una akaunti tayari?{' '}
          <Link href="/login" style={{ color: '#FFF', fontWeight: 800, textDecoration: 'none', borderBottom: '1px solid #FFF' }}>
            Ingia hapa
          </Link>
        </div>
      </div>
    </div>
  )
}
