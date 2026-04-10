'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  PiggyBank, HandCoins, Users, TrendingUp,
  Activity, Wallet, BarChart3, ArrowUpRight, ArrowDownLeft, X, Smartphone, CreditCard, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { dashboardService } from '@/lib/services/dashboardService'
import { walletService } from '@/lib/services/walletService'
import { groupService } from '@/lib/services/groupService'

interface DashboardData {
  userId: string
  noGroup: boolean
  error?: string
  isAdmin: boolean
  group: { id: string; name: string; joinCode: string }
  userStats: { walletBalance: number; totalSavings: number; activeLoans: number; loanBalance: number; pendingRequests: number; registeredPhone?: string }
  groupStats: { totalFunds: number; totalSavings: number; totalLoansIssued: number; membersCount: number; pendingVotes: number; groupBalance: number }
  withdrawalRequests: Array<{
    id: string
    amount: number
    reason: string
    status: string
    requested_by_user: { username: string }
    votes: Array<{ userId: string; vote: string }>
  }>
  recentActivities: Array<{ id: string; action: string; amount?: number; date: string; user: { username: string } }>
  recentTransactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string; user: { username: string } }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [isTransacting, setIsTransacting] = useState(false)

  const [showGateway, setShowGateway] = useState(false)
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
  const [walletType, setWalletType] = useState<'PERSONAL' | 'GROUP'>('PERSONAL')
  const [withdrawalReason, setWithdrawalReason] = useState('')

  const handleTransaction = (action: 'DEPOSIT' | 'WITHDRAW') => {
    if (!amount || Number(amount) <= 0) return
    setTransactionType(action)
    setShowGateway(true)
  }

  const executeTransaction = async (provider: string) => {
    setShowGateway(false)
    setIsTransacting(true)
    try {
      if (transactionType === 'DEPOSIT') {
        const result = await walletService.initiateDeposit(Number(amount), undefined, walletType, data?.group.id)
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

  const handleGroupWithdrawal = async () => {
    if (!amount || Number(amount) <= 0 || !withdrawalReason) return
    setIsTransacting(true)
    try {
      const result = await groupService.requestWithdrawal(data?.group.id!, Number(amount), withdrawalReason)
      if (result.success) {
        alert('Ombi lako limetumwa kwa viongozi')
        setShowWithdraw(false)
        setAmount('')
        setWithdrawalReason('')
        fetchData()
      } else {
        alert('Imeshindwa kuanzisha ombi')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTransacting(false)
    }
  }

  const handleVote = async (withdrawalId: string, vote: 'YES' | 'NO') => {
    try {
      // In standalone, we would call a service here
      // For now, keeping it consistent with the refactor
      alert('Kura yako imepokelewa (Standalone Mode)')
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const fetchData = async () => {
    try {
      const d = await dashboardService.getDashboardData()
      setData(d as any)
    } catch (err) {
      console.error('Fetch error:', err)
      // If it's a network error or unauthorized, data remains null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => fetchData())
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

  if (data?.error) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <p style={{ color: '#FF4D4D', marginBottom: 16 }}>{data.error}</p>
      <button onClick={() => fetchData()} className="btn-secondary">Jaribu Tena</button>
    </div>
  )

  if (data?.noGroup) return (
    <div className="animate-fade-in" style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '0 20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', marginBottom: 16 }}>Karibu, Kikoba Smart! 🌟</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>Salama, Rahisi, na Kidijitali. Unganika na kikundi chako au unda kipya ili uanze safari yako ya akiba leo.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, width: '100%', maxWidth: 800 }}>
        <Link href="/dashboard/group" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Users size={40} color="#FFF" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Unganika na Kikundi</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32 }}>Ingiza nambari ya siri ya kikundi (Join Code) ili uwe mwanachama.</p>
            <div className="btn-secondary" style={{ width: 'fit-content', margin: '0 auto' }}>Jiunge Sasa</div>
          </div>
        </Link>

        <Link href="/dashboard/group" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%', background: '#FFF', color: '#000' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Wallet size={40} color="#000" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Unda Kikundi</h3>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: 15, marginBottom: 32 }}>Kuwa msimamizi na uanzishe mfumo wako wa akiba wa kidijitali.</p>
            <div className="btn-primary" style={{ width: 'fit-content', margin: '0 auto', background: '#000', color: '#FFF' }}>Anza Leo</div>
          </div>
        </Link>
      </div>
    </div>
  )

  if (!data) return null

  const adminCards = [
    { label: 'Fedha za Kikundi', value: formatCurrency(data?.groupStats?.totalFunds || 0), icon: Wallet, link: '/dashboard/admin/report' },
    { label: 'Jumla ya Akiba', value: formatCurrency(data?.groupStats?.totalSavings || 0), icon: PiggyBank, link: '/dashboard/admin/report' },
    { label: 'Mikopo Iliyotolewa', value: formatCurrency(data?.groupStats?.totalLoansIssued || 0), icon: BarChart3, link: '/dashboard/admin/report' },
    { label: 'Wanachama', value: data?.groupStats?.membersCount || 0, icon: Users, link: '/dashboard/admin/members' },
  ]

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="topbar">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Dashibodi</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{data.group?.name}</div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: 40 }}>
        {/* Wallet Hero */}
        <div className="wallet-hero" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Salio la Mfuko Binafsi</div>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', marginBottom: 24 }}>{formatCurrency(data.userStats.walletBalance)}</div>
            </div>
            <Wallet size={40} opacity={0.5} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => { setWalletType('PERSONAL'); setShowDeposit(true); }} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 16, background: 'var(--accent)', color: '#000' }}>Weka Pesa</button>
            <button onClick={() => { setWalletType('PERSONAL'); setShowWithdraw(true); }} className="btn-secondary" style={{ padding: '12px 24px', borderRadius: 16, borderColor: 'rgba(255,255,255,0.2)' }}>Toa</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bento-grid" style={{ marginBottom: 48 }}>
          <Link href="/dashboard/savings" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
            <div className="stat-card" style={{ height: '100%' }}>
              <div className="icon-bg"><PiggyBank size={24} color="#FFF" /></div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Jumla ya Akiba</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(data.userStats.totalSavings)}</div>
            </div>
          </Link>
          
          <Link href="/dashboard/loans" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ height: '100%' }}>
              <div className="icon-bg"><HandCoins size={24} color="#FFF" /></div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Mikopo</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{data.userStats.activeLoans}</div>
            </div>
          </Link>

          <Link href="/dashboard/loans" style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ height: '100%' }}>
              <div className="icon-bg"><TrendingUp size={24} color="#FFF" /></div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Baki</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{formatCurrency(data.userStats.loanBalance)}</div>
            </div>
          </Link>
        </div>

        {/* Admin Section */}
        {data.isAdmin && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} /> Dashibodi ya Usimamizi
            </h2>
            <div className="bento-grid" style={{ marginBottom: 48 }}>
              {adminCards.map((card, idx) => {
                const Icon = card.icon
                return (
                  <Link key={card.label} href={card.link} style={{ textDecoration: 'none', gridColumn: idx === 0 ? 'span 2' : 'span 1' }}>
                    <div className="stat-card" style={{ height: '100%', borderColor: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--border)' }}>
                      <div className="icon-bg"><Icon size={24} color="#FFF" /></div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{card.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800 }}>{card.value}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Transaction History Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={20} color="#FFF" />
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Historia ya Miamala</h3>
            </div>
          </div>
          
          {data.recentTransactions.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} color="rgba(255,255,255,0.1)" />
              <p>Hakuna miamala iliyorekodiwa bado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.recentTransactions.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, 
                      background: t.type === 'DEPOSIT' ? 'rgba(0,255,135,0.1)' : t.type === 'WITHDRAWAL' ? 'rgba(255,77,77,0.1)' : 'rgba(255,215,0,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {t.type === 'DEPOSIT' ? <ArrowDownLeft size={20} color="#00FF87" /> : <ArrowUpRight size={20} color={t.type === 'WITHDRAWAL' ? '#FF4D4D' : '#FFD700'} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{t.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {new Date(t.createdAt).toLocaleDateString()} • {t.type}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 16, fontWeight: 800, 
                      color: t.type === 'DEPOSIT' ? '#00FF87' : 'inherit'
                    }}>
                      {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activities Section */}
          <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Activity size={16} color="rgba(255,255,255,0.5)" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Shughuli za Karibuni</h4>
            </div>
            {data.recentActivities.length === 0 ? (
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Hakuna shughuli bado</p>
            ) : (
              data.recentActivities.slice(0, 5).map((a) => (
                <div key={a.id} className="activity-item" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ color: '#FFF', fontWeight: 600 }}>{a.user.username}</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatRelativeTime(a.date)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showDeposit || showWithdraw) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 460, width: '100%', padding: 40, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900 }}>{showDeposit ? 'Weka Pesa' : 'Toa Pesa'}</h2>
              <button onClick={() => { setShowDeposit(false); setShowWithdraw(false); setAmount(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
              {showDeposit ? (
                `Unaongeza pesa kwenye ${walletType === 'PERSONAL' ? 'akiba yako binafsi' : 'mkusanyiko wa kikundi'}.`
              ) : (
                walletType === 'PERSONAL' 
                  ? `Pesa zitatumwa kwenye namba yako: ${data.userStats.registeredPhone}`
                  : `Unaanzisha ombi la kutoa pesa za kikundi kwenda namba yako (${data.userStats.registeredPhone}). Itahitaji kura kwanza.`
              )}
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Kiasi (TZS)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Mfano: 10,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ fontSize: 24, padding: '20px 24px', fontWeight: 800 }}
                  autoFocus
                />
              </div>
            </div>

            {showWithdraw && walletType === 'GROUP' && (
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Sababu ya Kutoa</label>
                <textarea 
                  className="input-field" 
                  placeholder="Elezea matumizi ya pesa hizi..."
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  style={{ fontSize: 15, padding: '16px', minHeight: 100 }}
                />
              </div>
            )}

            <button 
              onClick={() => {
                if (showWithdraw && walletType === 'GROUP') {
                  handleGroupWithdrawal()
                } else {
                  handleTransaction(showDeposit ? 'DEPOSIT' : 'WITHDRAW')
                }
              }} 
              className="btn-primary" 
              style={{ width: '100%', padding: '18px', fontSize: 16, borderRadius: 16 }}
              disabled={isTransacting || !amount || Number(amount) <= 0 || (showWithdraw && walletType === 'GROUP' && !withdrawalReason)}
            >
              {isTransacting ? <Loader2 className="spinner" /> : (showWithdraw && walletType === 'GROUP' ? 'Anzisha Ombi' : 'Endelea')}
            </button>
          </div>
        </div>
      )}

      {showGateway && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 440, width: '100%', padding: 40, background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Chagua Njia ya Malipo</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>Chagua mtoa huduma unayetaka kutumia kukamilisha muamala wako.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button 
                onClick={() => executeTransaction('CLICKPESA')}
                className="stat-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16, 
                  textAlign: 'left', 
                  padding: 20, 
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  cursor: 'pointer'
                }}
              >
                <div className="icon-bg" style={{ marginBottom: 0, background: '#000' }}>
                  <Smartphone color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>ClickPesa (Mobile Money)</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>M-Pesa, TigoPesa, AirtelMoney, HaloPesa</div>
                </div>
                <ArrowUpRight size={20} color="var(--text-secondary)" />
              </button>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16, 
                  padding: 20, 
                  width: '100%',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: 0.5
                }}
              >
                <div className="icon-bg" style={{ marginBottom: 0, background: '#000' }}>
                  <CreditCard color="#666" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#666' }}>Kadi ya Benki</div>
                  <div style={{ fontSize: 12, color: '#444' }}>Inakuja hivi karibuni...</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowGateway(false)} 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: 24, border: 'none' }}
            >
              Ghairi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
