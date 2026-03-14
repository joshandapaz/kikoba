'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Phone, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      phone,
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Namba ya simu au nywila si sahihi. Jaribu tena.')
      console.error('Login Failed:', res.error)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
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
            Kikoba Smart
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
            Premium Savings & Loans
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Ingia kwenye akaunti</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Karibu tena 👋</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span>{error}</span>
            <button 
              onClick={() => (window as any).toggleErrorDetector?.()}
              style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', width: 'fit-content' }}
            >
              Fungua Kithibitishaji Hitilafu (Error Detector)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Namba ya Simu</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                className="input-field"
                style={{ paddingLeft: 40 }}
                type="text"
                placeholder="+255700000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nywila</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                className="input-field"
                style={{ paddingLeft: 40 }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <><span>Ingia</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-secondary)', fontSize: 15 }}>
          Huna akaunti?{' '}
          <Link href="/register" style={{ color: '#FFF', fontWeight: 800, textDecoration: 'none', borderBottom: '1px solid #FFF' }}>
            Jisajili hapa
          </Link>
        </div>

        {/* Demo credentials box */}
        <div style={{
          marginTop: 32, padding: '20px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: 16
        }}>
          <p style={{ fontSize: 12, color: '#FFF', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>🔑 Demo Login:</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Admin: admin@kikoba.com / password123</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Member: john@kikoba.com / password123</p>
        </div>
      </div>
    </div>
  )
}
