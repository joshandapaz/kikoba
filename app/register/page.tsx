'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handle(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Register with Email
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            phone: form.phone,
            full_name: form.username,
          }
        }
      })

      if (authError) {
        setError(authError.message || 'Hitilafu imetokea wakati wa usajili')
        return
      }

      router.push('/login?registered=1')
    } catch (err: any) {
      const errMsg = err?.message || String(err)
      setError(errMsg)
      console.error('Registration Exception:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.png" alt="Kikoba Logo" className="logo-img-lg" style={{ width: 160, margin: '0 auto' }} />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <label className="form-label">Namba ya Simu</label>
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
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label">Barua Pepe (Email)</label>
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

          <div className="form-group" style={{ marginTop: 18 }}>
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

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 24 }}>
            {loading ? <span className="spinner" /> : <><span>Jiunge Sasa</span><ArrowRight size={16} /></>}
          </button>
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
