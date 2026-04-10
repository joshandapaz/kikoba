'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // KEY FIX: Check if user is already logged in. If yes, skip login.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError('Barua pepe au nywila si sahihi. Jaribu tena.')
      console.error('Login Failed:', authError.message)
    } else {
      router.replace('/dashboard')
    }
  }

  // Show full-screen loading while checking session
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#FFF',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Kikoba Logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>Inapakia...</p>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.png" alt="Kikoba Logo" className="logo-img-lg" style={{ width: 180, margin: '0 auto' }} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Ingia kwenye akaunti</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Karibu tena 👋</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Barua Pepe (Email)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                className="input-field"
                style={{ paddingLeft: 40 }}
                type="email"
                placeholder="mfano@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
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
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Email: test@kikoba.com</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nywila (Password): password123</p>
        </div>
      </div>
    </div>
  )
}
