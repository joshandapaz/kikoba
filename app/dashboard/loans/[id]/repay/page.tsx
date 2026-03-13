'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, calculateLoanBalance } from '@/lib/utils'
import { HandCoins, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { use } from 'react'

export default function RepayLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loan, setLoan] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/loans?mine=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const currentLoan = data.find(l => l.id === id)
          if (currentLoan) setLoan(currentLoan)
        }
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="spinner" style={{ margin: '64px auto', display: 'block' }} />
  if (!loan) return <div className="empty-state">Mkopo haukupatikana.</div>

  const balance = calculateLoanBalance(loan.amount, loan.interestRate, loan.payments)
  const totalAmount = loan.amount + (loan.amount * loan.interestRate) / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/loans/${id}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), note })
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      setSubmitting(false)
    } else {
      router.push('/dashboard/loans')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Fanya Marejesho</h1>
        <p className="page-subtitle">Lipa deni lako la mkopo kupunguza salio</p>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        <div className="card" style={{ marginBottom: '32px', padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>Kikundi</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{loan.group.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>Mkopo na Riba</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{formatCurrency(totalAmount)}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '48px', padding: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Deni Linalobaki</div>
            <div style={{ fontSize: '56px', fontWeight: 900, color: '#FFF', letterSpacing: '-2px' }}>
              {formatCurrency(balance)}
            </div>
          </div>

          {balance === 0 ? (
           <div style={{ textAlign: 'center', padding: '48px', background: '#FFF', borderRadius: '20px', border: '1px solid #FFF', boxShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
             <CheckCircle2 size={64} color="#000" strokeWidth={3} style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#000', marginBottom: '12px', letterSpacing: '-0.5px' }}>Hongera!</h3>
             <p style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>Umemaliza kulipa mkopo huu kikamilifu.</p>
           </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 32 }}>
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Kiasi Unacholipa Sasa (TZS)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Mfano: 20000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1000"
                  max={balance}
                  required
                  style={{ padding: '16px', fontSize: '18px', fontWeight: 800 }}
                />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'right', fontWeight: 500 }}>
                  Unaweza kulipa kuanzia TZS 1,000 hadi <span style={{ color: '#FFF', fontWeight: 700 }}>TZS {balance.toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="form-label">Maelezo (Si lazima)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: Malipo ya kwanza"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ padding: '16px' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ marginTop: '40px', width: '100%', padding: '18px', fontSize: 16 }}
                disabled={submitting || !amount || Number(amount) <= 0 || Number(amount) > balance}
              >
                {submitting ? <span className="spinner" /> : <>Fanya Malipo <ArrowRight size={20} /></>}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  )
}


export function generateStaticParams() { return [{ id: '1' }]; }
