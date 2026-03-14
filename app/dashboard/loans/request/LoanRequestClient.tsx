'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HandCoins, Calculator, ArrowRight, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

function LoanRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedGroupId = searchParams.get('groupId')
  
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<{ id: string, name: string }[]>([])
  
  // Form state
  const [groupId, setGroupId] = useState(preSelectedGroupId || '')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('3')
  const [error, setError] = useState('')
  
  // Constant for MVP
  const INTEREST_RATE = 10

  useEffect(() => {
    apiClient('/api/group').then(res => res.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data.map(g => ({ id: g.id, name: g.name })))
        // Only set default if not already set by preSelectedGroupId
        if (!preSelectedGroupId) {
          setGroupId(data[0].id)
        }
      }
    })
  }, [preSelectedGroupId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId) {
      setError('Tafadhali chagua kikundi kwanza')
      return
    }

    setLoading(true)
    setError('')

    const res = await apiClient('/api/loans', {
      method: 'POST',
      body: JSON.stringify({
        groupId,
        amount: Number(amount),
        reason,
        duration: Number(duration)
      })
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
    } else {
      router.push('/dashboard/loans?requested=1')
    }
  }

  const principal = Number(amount) || 0
  const interestAmount = (principal * INTEREST_RATE) / 100
  const totalRepayment = principal + interestAmount
  const monthlyInstallment = duration ? totalRepayment / Number(duration) : 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Omba Mkopo Mpya</h1>
        <p className="page-subtitle">Jaza fomu hapa chini kutuma maombi ya mkopo kwa kikundi chako</p>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Request Form */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.5px' }}>
            <HandCoins size={24} color="#FFF" /> Taarifa za Mkopo
          </h2>

          {error && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Kikundi cha Kukopa</label>
              <select 
                className="input-field" 
                value={groupId} 
                onChange={(e) => setGroupId(e.target.value)}
                disabled={groups.length === 0}
                required
                style={{ padding: '14px' }}
              >
                {groups.length === 0 ? (
                  <option value="">Huna kikundi chochote</option>
                ) : (
                  groups.map(g => (
                    <option key={g.id} value={g.id} style={{color:"#000"}}>{g.name}</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kiasi Unachoomba (TZS)</label>
              <input
                type="number"
                className="input-field"
                placeholder="Mfano: 100,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10000"
                required
                style={{ padding: '14px', fontSize: 16, fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sababu/Lengo la Mkopo</label>
              <textarea
                className="input-field"
                placeholder="Elezea kwa ufupi matumizi ya mkopo huu..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                style={{ padding: '14px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Muda wa Marejesho (Miezi)</label>
              <select 
                className="input-field" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                required
                style={{ padding: '14px' }}
              >
                <option value="1" style={{color:"#000"}}>Mwezi 1</option>
                <option value="2" style={{color:"#000"}}>Miezi 2</option>
                <option value="3" style={{color:"#000"}}>Miezi 3</option>
                <option value="6" style={{color:"#000"}}>Miezi 6</option>
                <option value="12" style={{color:"#000"}}>Miezi 12</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: 40, width: '100%', padding: '16px', fontSize: 16 }}
              disabled={loading || groups.length === 0}
            >
              {loading ? <span className="spinner" /> : <>Wasilisha Maombi <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>

        {/* Loan Calculator Sidebar */}
        <div className="card" style={{ position: 'sticky', top: '100px', padding: '32px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 800, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
            <Calculator size={20} /> Makadirio
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Kiasi cha Mkopo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{formatCurrency(principal)}</div>
            </div>
            
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Riba ({INTEREST_RATE}%)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>
                +{formatCurrency(interestAmount)}
              </div>
            </div>

            <div className="separator" style={{ borderTopStyle: 'dashed', opacity: 0.2 }} />
            
            <div>
              <div style={{ fontSize: 12, color: '#FFF', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>Jumla ya Kurejesha</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: '-1px' }}>
                {formatCurrency(totalRepayment)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Kila Mwezi</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>
                {formatCurrency(monthlyInstallment)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40, padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              💡 Je, wajua?
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              Mkopo wako utahitaji kupigiwa kura na kupata asilimia 60% ya kura za ndiyo kutoka kwa wanachama wenzako ili uidhinishwe.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

import { Suspense as ReactSuspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function LoanRequestClient() {
  return (
    <ReactSuspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Loader2 className="spinner" size={40} />
      </div>
    }>
      <LoanRequestForm />
    </ReactSuspense>
  )
}
