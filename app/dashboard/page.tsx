'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  PiggyBank, HandCoins, TrendingUp,
  Activity, Wallet, ArrowUpRight, ArrowDownLeft, X, Smartphone, CreditCard, Loader2, Target, Plus
} from 'lucide-react'
import Link from 'next/link'
import { dashboardService } from '@/lib/services/dashboardService'
import { walletService } from '@/lib/services/walletService'
import { planService } from '@/lib/services/planService'

interface DashboardData {
  userId: string
  username: string
  userStats: { walletBalance: number; totalSavings: number; activeLoans: number; loanBalance: number; registeredPhone?: string }
  recentTransactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string }>
  personalPlans: Array<{ id: string; title: string; target_amount: number; saved_amount: number }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [isTransacting, setIsTransacting] = useState(false)

  const [showGateway, setShowGateway] = useState(false)
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')

  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planTarget, setPlanTarget] = useState('')
  
  const [showDepositPlan, setShowDepositPlan] = useState<string | null>(null)
  const [planDepositAmount, setPlanDepositAmount] = useState('')

  const handleTransaction = (action: 'DEPOSIT' | 'WITHDRAW') => {
    if (!amount || Number(amount) <= 0) return
    setTransactionType(action)
    setShowGateway(true)
  }

  const handleCreatePlan = async () => {
    if (!planTitle || !planTarget) return
    setIsTransacting(true)
    try {
      await planService.createPlan(planTitle, Number(planTarget))
      setShowCreatePlan(false)
      setPlanTitle('')
      setPlanTarget('')
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsTransacting(false)
    }
  }

  const handleDepositToPlan = async () => {
    if (!showDepositPlan || !planDepositAmount) return
    setIsTransacting(true)
    try {
      await planService.depositToPlan(showDepositPlan, Number(planDepositAmount))
      setShowDepositPlan(null)
      setPlanDepositAmount('')
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsTransacting(false)
    }
  }

  const executeTransaction = async (provider: string) => {
    setShowGateway(false)
    setIsTransacting(true)
    try {
      if (transactionType === 'DEPOSIT') {
        const result = await walletService.initiateDeposit(Number(amount), undefined, 'PERSONAL')
        if (result.success) {
          alert(result.message)
          setAmount('')
          setShowDeposit(false)
          fetchData()
        } else {
          alert('Imeshindwa kuanzisha malipo')
        }
      } else {
        const result = await walletService.initiatePayout(Number(amount))
        if (result.success) {
          alert(result.message)
          setAmount('')
          setShowWithdraw(false)
          fetchData()
        } else {
          alert('Imeshindwa kutoa pesa')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Kuna tatizo limetokea. Tafadhali jaribu tena.')
    } finally {
      setIsTransacting(false)
    }
  }

  const fetchData = async () => {
    try {
      const d = await dashboardService.getDashboardData()
      setData(d as any)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'var(--text-secondary)' }}>Inapakia...</p>
    </div>
  )

  if (!data) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ color: '#FF4D4D', marginBottom: 16 }}>Imeshindwa kupakia data</p>
      <button onClick={() => fetchData()} className="btn-secondary">Jaribu Tena</button>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="topbar">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Habari, {data.username} 👋</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Kikoba Smart</div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 40 }}>
        {/* Wallet Hero */}
        <div className="wallet-hero" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Salio la Mfuko Binafsi</div>
              <div className="hero-balance" style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-2px', marginBottom: 20 }}>{formatCurrency(data.userStats.walletBalance)}</div>
            </div>
            <Wallet size={36} opacity={0.4} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setShowDeposit(true)} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 16, background: 'var(--accent)', color: '#000', flex: 1, minWidth: 120 }}>Weka Pesa</button>
            <button onClick={() => setShowWithdraw(true)} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: 16, borderColor: 'rgba(255,255,255,0.2)', flex: 1, minWidth: 120 }}>Toa</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          <Link href="/dashboard/savings" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ padding: 20 }}>
              <div className="icon-bg" style={{ marginBottom: 12, width: 40, height: 40 }}><PiggyBank size={20} color="#FFF" /></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Akiba Yangu</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(data.userStats.totalSavings)}</div>
            </div>
          </Link>
          
          <div className="stat-card" style={{ padding: 20 }}>
            <div className="icon-bg" style={{ marginBottom: 12, width: 40, height: 40 }}><TrendingUp size={20} color="#FFF" /></div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Baki ya Mkopo</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(data.userStats.loanBalance)}</div>
          </div>
        </div>

        {/* Personal Plans */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} /> Mipango Binafsi
            </h2>
            <button onClick={() => setShowCreatePlan(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 14px', color: '#FFF', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={14} /> Ongeza
            </button>
          </div>
          
          {data.personalPlans && data.personalPlans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.personalPlans.map(plan => {
                const percent = plan.target_amount > 0 ? Math.min(100, Math.round((plan.saved_amount / plan.target_amount) * 100)) : 0
                return (
                  <div key={plan.id} onClick={() => setShowDepositPlan(plan.id)} className="card" style={{ padding: 20, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{plan.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{percent}%</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                      {formatCurrency(plan.saved_amount)} 
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}> / {formatCurrency(plan.target_amount)}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--accent)', height: '100%', width: `${percent}%`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <Target size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Huna mipango yoyote binafsi bado.</div>
              <button onClick={() => setShowCreatePlan(true)} className="btn-primary" style={{ borderRadius: 14, padding: '10px 20px', fontSize: 13, background: 'var(--accent)', color: '#000' }}>
                <Plus size={16} /> Tengeneza Mpango
              </button>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Activity size={18} color="#FFF" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Historia ya Miamala</h3>
          </div>
          
          {data.recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Activity size={40} color="rgba(255,255,255,0.1)" />
              <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 14 }}>Hakuna miamala bado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recentTransactions.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: t.type === 'DEPOSIT' ? 'rgba(0,255,135,0.1)' : 'rgba(255,77,77,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {t.type === 'DEPOSIT' ? <ArrowDownLeft size={18} color="#00FF87" /> : <ArrowUpRight size={18} color="#FF4D4D" />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 15, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                    color: t.type === 'DEPOSIT' ? '#00FF87' : '#FF4D4D'
                  }}>
                    {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      {(showDeposit || showWithdraw) && (
        <div className="modal-overlay" onClick={() => { setShowDeposit(false); setShowWithdraw(false); setAmount(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{showDeposit ? 'Weka Pesa' : 'Toa Pesa'}</h2>
              <button className="mobile-header-btn" onClick={() => { setShowDeposit(false); setShowWithdraw(false); setAmount(''); }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              {showDeposit 
                ? 'Ingiza kiasi unachotaka kuweka kwenye mfuko wako binafsi.'
                : `Pesa zitatumwa kwenye namba yako: ${data.userStats.registeredPhone || 'Hujasajili namba'}`
              }
            </p>
            
            <div className="form-group">
              <label className="form-label">Kiasi (TZS)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: 20, padding: '16px 20px', fontWeight: 700 }}
                autoFocus
              />
            </div>

            <button 
              onClick={() => handleTransaction(showDeposit ? 'DEPOSIT' : 'WITHDRAW')} 
              className="btn-primary" 
              style={{ width: '100%', borderRadius: 16 }}
              disabled={isTransacting || !amount || Number(amount) <= 0}
            >
              {isTransacting ? <Loader2 className="spinner" /> : 'Endelea'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showGateway && (
        <div className="modal-overlay" onClick={() => setShowGateway(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Chagua Njia ya Malipo</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>Mtoa huduma unayetaka kutumia:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => executeTransaction('CLICKPESA')}
                className="stat-card" 
                style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: 18, width: '100%', cursor: 'pointer' }}
              >
                <div className="icon-bg" style={{ marginBottom: 0, width: 40, height: 40 }}>
                  <Smartphone size={20} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Mobile Money</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>M-Pesa, TigoPesa, AirtelMoney</div>
                </div>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20, border: '1px solid var(--border)', opacity: 0.4 }}>
                <div className="icon-bg" style={{ marginBottom: 0, width: 40, height: 40 }}>
                  <CreditCard size={20} color="#666" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#666' }}>Kadi ya Benki</div>
                  <div style={{ fontSize: 12, color: '#444' }}>Inakuja hivi karibuni...</div>
                </div>
              </div>
            </div>

            <button onClick={() => setShowGateway(false)} className="btn-secondary" style={{ width: '100%', marginTop: 20, borderRadius: 14 }}>
              Ghairi
            </button>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="modal-overlay" onClick={() => setShowCreatePlan(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Tengeneza Mpango</h3>
              <button className="mobile-header-btn" onClick={() => setShowCreatePlan(false)}><X size={20}/></button>
            </div>
            <div className="form-group">
              <label className="form-label">Jina la Mpango</label>
              <input type="text" className="input-field" placeholder="Mfn: Kununua Gari" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Lengo (TZS)</label>
              <input type="number" className="input-field" placeholder="500000" value={planTarget} onChange={(e) => setPlanTarget(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%', borderRadius: 14 }} onClick={handleCreatePlan} disabled={isTransacting}>
              {isTransacting ? <Loader2 className="spinner" /> : 'Hifadhi'}
            </button>
          </div>
        </div>
      )}

      {/* Deposit to Plan Modal */}
      {showDepositPlan && (
        <div className="modal-overlay" onClick={() => setShowDepositPlan(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Weka Pesa kwa Mpango</h3>
              <button className="mobile-header-btn" onClick={() => setShowDepositPlan(null)}><X size={20}/></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Pesa zitatoka kwenye mfuko wako binafsi.</p>
            <div className="form-group">
              <label className="form-label">Kiasi (TZS)</label>
              <input type="number" className="input-field" placeholder="10000" value={planDepositAmount} onChange={(e) => setPlanDepositAmount(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%', borderRadius: 14 }} onClick={handleDepositToPlan} disabled={isTransacting}>
              {isTransacting ? <Loader2 className="spinner" /> : 'Weka Pesa'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
