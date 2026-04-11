'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  PiggyBank, TrendingUp, HandCoins,
  Activity, Wallet, ArrowUpRight, ArrowDownLeft, X, Loader2, Target, Plus, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { dashboardService } from '@/lib/services/dashboardService'
import { walletService } from '@/lib/services/walletService'
import { planService } from '@/lib/services/planService'
import { useI18n } from '@/lib/i18n'
import LoadingScreen from '@/components/LoadingScreen'

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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [showGateway, setShowGateway] = useState(false)
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')

  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planTarget, setPlanTarget] = useState('')
  
  const [showDepositPlan, setShowDepositPlan] = useState<string | null>(null)
  const [planDepositAmount, setPlanDepositAmount] = useState('')

  const { t } = useI18n()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleTransaction = (action: 'DEPOSIT' | 'WITHDRAW') => {
    if (!amount || Number(amount) <= 0) return
    if (action === 'DEPOSIT') {
      executeDeposit()
    } else {
      executeWithdraw()
    }
  }

  const executeDeposit = async () => {
    setShowDeposit(false)
    setIsTransacting(true)
    try {
      const result = await walletService.initiateDeposit(Number(amount))
      if (result.success && result.redirectUrl) {
        showToast('Inakuelekeza PesaPal...')
        window.location.href = result.redirectUrl
      }
    } catch (err: any) {
      showToast('❌ ' + (err.message || 'Muamala umeshindwa'), 'error')
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

    // Handle PesaPal callback redirects
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      showToast('Kikoba inathibitisha malipo yako na PesaPal...')
      // Clean url to remove query state
      window.history.replaceState({}, document.title, '/dashboard')
    } else if (params.get('payment') === 'cancelled') {
      showToast('Muamala umehairishwa.', 'error')
      window.history.replaceState({}, document.title, '/dashboard')
    }

    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) return <LoadingScreen />

  if (!data) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ color: '#FF4D4D', marginBottom: 16 }}>{t('failed_load')}</p>
      <button onClick={() => fetchData()} className="btn-secondary">{t('retry')}</button>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(0,200,100,0.95)' : 'rgba(220,50,50,0.95)',
          color: '#FFF', padding: '14px 24px', borderRadius: 999,
          fontWeight: 700, fontSize: 14, zIndex: 9999,
          backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: '90vw', textAlign: 'center',
          animation: 'fade-in 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Full-screen processing overlay */}
      {isTransacting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9998, backdropFilter: 'blur(8px)',
        }}>
          <Loader2 size={48} className="spinner" color="var(--accent)" style={{ marginBottom: 20 }} />
          <div style={{ color: '#FFF', fontWeight: 700, fontSize: 16 }}>Inashughulikia...</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>Tafadhali subiri</div>
        </div>
      )}

      {/* Quick Inspirational / Welcome Banner replacing the empty space */}
      <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(90deg, #FFF 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('greeting')}, {data.username} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
            Utajiri unaanza na akiba
          </div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Wallet Hero */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 28,
          padding: 28,
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle glow effect */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12 }}>
                <Wallet size={20} color="#FFF" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('wallet_balance')}</span>
            </div>
            <div style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 4 }}>
               <ShieldCheck size={14} /> Personal
            </div>
          </div>
          
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', marginBottom: 32, color: '#FFF', position: 'relative', zIndex: 1 }}>
            {formatCurrency(data.userStats.walletBalance)}
          </div>
          
          <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
            <button onClick={() => setShowDeposit(true)} className="btn-primary" style={{ flex: 1, padding: '16px 20px', borderRadius: 20, background: 'var(--accent)', color: '#000', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', fontWeight: 800 }}>
               <ArrowDownLeft size={20} /> {t('deposit')}
            </button>
            <button onClick={() => setShowWithdraw(true)} className="btn-secondary" style={{ flex: 1, padding: '16px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', fontWeight: 800 }}>
              <ArrowUpRight size={20} /> {t('withdraw')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <Link href="/dashboard/savings" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: 24, height: '100%', borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ background: 'rgba(34, 211, 238, 0.1)', padding: 14, borderRadius: 16, marginBottom: 16 }}>
                <PiggyBank size={24} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('my_savings')}</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{formatCurrency(data.userStats.totalSavings)}</div>
            </div>
          </Link>
          
          <div className="card" style={{ padding: 24, height: '100%', borderRadius: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 77, 77, 0.1)', padding: 14, borderRadius: 16, marginBottom: 16 }}>
              <TrendingUp size={24} color="#FF4D4D" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('loan_balance')}</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{formatCurrency(data.userStats.loanBalance)}</div>
          </div>
        </div>

        {/* Personal Plans */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Target size={20} color="var(--accent)" /> {t('personal_plans')}
            </h2>
            <button onClick={() => setShowCreatePlan(true)} style={{ background: 'rgba(34, 211, 238, 0.1)', border: 'none', borderRadius: 999, padding: '8px 16px', color: 'var(--accent)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={16} strokeWidth={3} /> {t('add')}
            </button>
          </div>
          
          {data.personalPlans && data.personalPlans.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.personalPlans.map(plan => {
                const percent = plan.target_amount > 0 ? Math.min(100, Math.round((plan.saved_amount / plan.target_amount) * 100)) : 0
                return (
                  <div key={plan.id} onClick={() => setShowDepositPlan(plan.id)} className="card hover-scale" style={{ padding: 24, cursor: 'pointer', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{plan.title}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)', background: 'rgba(34, 211, 238, 0.1)', padding: '4px 10px', borderRadius: 12 }}>{percent}%</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 20, color: '#FFF' }}>
                      {formatCurrency(plan.saved_amount)} 
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>/ {formatCurrency(plan.target_amount)}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, var(--accent) 0%, #00FF87 100%)', height: '100%', width: `${percent}%`, borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 32, textAlign: 'center', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', width: 64, height: 64, borderRadius: 32, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={32} color="rgba(255,255,255,0.4)" />
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontWeight: 600 }}>{t('no_plans')}</div>
              <button onClick={() => setShowCreatePlan(true)} className="btn-primary" style={{ borderRadius: 16, padding: '14px 24px', fontSize: 14, background: 'var(--accent)', color: '#000', fontWeight: 800 }}>
                {t('create_plan')}
              </button>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="card" style={{ padding: 24, borderRadius: 28, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 10 }}>
              <Activity size={18} color="#FFF" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('transaction_history')}</h3>
          </div>
          
          {data.recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Activity size={48} strokeWidth={1} color="rgba(255,255,255,0.05)" />
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 14, fontWeight: 600 }}>{t('no_transactions')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.recentTransactions.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                      background: t.type === 'DEPOSIT' ? 'rgba(0,255,135,0.1)' : 'rgba(255,77,77,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {t.type === 'DEPOSIT' ? <ArrowDownLeft size={24} color="#00FF87" /> : <ArrowUpRight size={24} color="#FF4D4D" />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4, color: '#FFF' }}>{t.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 16, fontWeight: 800, flexShrink: 0, marginLeft: 16,
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 40, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>{showDeposit ? t('deposit') : t('withdraw')}</h2>
              <button className="mobile-header-btn" onClick={() => { setShowDeposit(false); setShowWithdraw(false); setAmount(''); }} style={{ background: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20 }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
              {showDeposit 
                ? t('deposit_desc')
                : `${t('withdraw_desc')}: ${data.userStats.registeredPhone || t('no_phone')}`
              }
            </p>
            
            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('amount_tzs')}</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="10,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: 28, padding: '20px 24px', fontWeight: 900, borderRadius: 20, textAlign: 'center' }}
                autoFocus
              />
            </div>

            <button 
              onClick={() => handleTransaction(showDeposit ? 'DEPOSIT' : 'WITHDRAW')} 
              className="btn-primary" 
              style={{ width: '100%', borderRadius: 20, height: 60, fontSize: 16, fontWeight: 800 }}
              disabled={isTransacting || !amount || Number(amount) <= 0}
            >
              {isTransacting ? <Loader2 className="spinner" /> : t('continue')}
            </button>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal Removed */}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="modal-overlay" onClick={() => setShowCreatePlan(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 40, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 900 }}>{t('create_plan')}</h3>
              <button className="mobile-header-btn" onClick={() => setShowCreatePlan(false)} style={{ background: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20 }}><X size={20}/></button>
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('plan_name')}</label>
              <input type="text" className="input-field" placeholder={t('plan_name_placeholder')} value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} style={{ fontSize: 16, padding: '18px 24px', borderRadius: 16 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('goal_amount')}</label>
              <input type="number" className="input-field" placeholder="500,000" value={planTarget} onChange={(e) => setPlanTarget(e.target.value)} style={{ fontSize: 16, padding: '18px 24px', borderRadius: 16 }} />
            </div>
            <button className="btn-primary" style={{ width: '100%', borderRadius: 20, height: 60, fontSize: 16, fontWeight: 800 }} onClick={handleCreatePlan} disabled={isTransacting}>
              {isTransacting ? <Loader2 className="spinner" /> : t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Deposit to Plan Modal */}
      {showDepositPlan && (
        <div className="modal-overlay" onClick={() => setShowDepositPlan(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 40, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 900 }}>{t('deposit_to_plan')}</h3>
              <button className="mobile-header-btn" onClick={() => setShowDepositPlan(null)} style={{ background: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20 }}><X size={20}/></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>{t('deposit_from_wallet')}</p>
            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>{t('amount_tzs')}</label>
              <input type="number" className="input-field" placeholder="10,000" value={planDepositAmount} onChange={(e) => setPlanDepositAmount(e.target.value)} style={{ fontSize: 24, padding: '20px 24px', borderRadius: 20, textAlign: 'center', fontWeight: 900 }} />
            </div>
            <button className="btn-primary" style={{ width: '100%', borderRadius: 20, height: 60, fontSize: 16, fontWeight: 800 }} onClick={handleDepositToPlan} disabled={isTransacting}>
              {isTransacting ? <Loader2 className="spinner" /> : t('deposit')}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
