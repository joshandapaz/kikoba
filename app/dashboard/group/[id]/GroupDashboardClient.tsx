'use client'
import { useState, useEffect, use } from 'react'
import { Users, TrendingUp, Landmark, Shield, ArrowLeft, Building2, HandCoins, Wallet, X, Loader2, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { groupService } from '@/lib/services/groupService'
import { loanService } from '@/lib/services/loanService'
import { savingsService } from '@/lib/services/savingsService'

export default function GroupDashboardClient({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showLoan, setShowLoan] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('3') // default 3 months
  const [isTransacting, setIsTransacting] = useState(false)

  useEffect(() => {
    fetchGroupData()
  }, [groupId])

  const fetchGroupData = async () => {
    try {
      const g = await groupService.getGroupById(groupId)
      setData(g)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return
    setIsTransacting(true)
    try {
      await savingsService.contribute(groupId, Number(amount))
      alert('Mchango wako umepokelewa!')
      setShowDeposit(false)
      setAmount('')
      fetchGroupData()
    } catch (err: any) {
      alert(err.message || 'Hitilafu imetokea')
    } finally {
      setIsTransacting(false)
    }
  }

  const handleWithdrawRequest = async () => {
    if (!amount || Number(amount) <= 0 || !reason) return
    setIsTransacting(true)
    try {
      await groupService.requestWithdrawal(groupId, Number(amount), reason)
      alert('Ombi lako la kutoa pesa limetumwa kwa viongozi')
      setShowWithdraw(false)
      setAmount('')
      setReason('')
      fetchGroupData()
    } catch (err: any) {
      alert(err.message || 'Hitilafu imetokea')
    } finally {
      setIsTransacting(false)
    }
  }

  const handleLoanRequest = async () => {
    if (!amount || Number(amount) <= 0 || !reason || !duration) return
    setIsTransacting(true)
    try {
      await loanService.applyForLoan(groupId, Number(amount), reason, Number(duration))
      alert('Ombi lako la mkopo limetumwa kwa viongozi wa kikundi')
      setShowLoan(false)
      setAmount('')
      setReason('')
      fetchGroupData()
    } catch (err: any) {
      alert(err.message || 'Hitilafu imetokea')
    } finally {
      setIsTransacting(false)
    }
  }

  const handleApproval = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      // Logic for withdrawal approval would go here if implemented in groupService
      alert('Ombi limeshughulikiwa (Standalone Mode)')
      fetchGroupData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleLoanApproval = async (loanId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await loanService.handleAdminApproval(loanId, action)
      alert(action === 'APPROVE' ? 'Mkopo umeidhinishwa!' : 'Mkopo umekataliwa')
      fetchGroupData()
    } catch (err: any) {
      alert(err.message || 'Hitilafu imetokea')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!data) return (
     <div className="page-content" style={{ textAlign: 'center', padding: '100px 0' }}>
       <h2 style={{ fontSize: 24, fontWeight: 800 }}>Kikundi hakijapatikana</h2>
       <Link href="/dashboard/group">
         <button className="btn-secondary" style={{ marginTop: 24 }}>Rudi kwenye orodha</button>
       </Link>
     </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Header with Back Button */}
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <Link href="/dashboard/group" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Rudi kwenye orodha
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">{data.name}</h1>
            <p className="page-subtitle">{data.description || 'Hakuna maelezo kwa kikundi hiki'}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowDeposit(true)} className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} /> Changia Kikundi
            </button>
            <button onClick={() => setShowWithdraw(true)} className="btn-secondary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExternalLink size={18} /> Omba Pesa
            </button>
            <button onClick={() => setShowLoan(true)} className="btn-secondary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
              <HandCoins size={18} /> Omba Mkopo
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Financial Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #FFF, #F0F0F0)', border: 'none' }}>
            <div className="icon-bg" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <Wallet size={24} color="#000" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>Jumla ya Michango</p>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 8 }}>
                Pesa iliyopo sasa: {formatCurrency(data.stats.walletBalance)}
              </div>
            </div>
            <h3 style={{ fontSize: 32, fontWeight: 900, marginTop: 12, color: '#000' }}>{formatCurrency(data.stats.totalCollected)}</h3>
          </div>

          <div className="stat-card">
            <div className="icon-bg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <TrendingUp size={24} color="#FFF" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>Mikopo Inayoendelea</p>
            <h3 style={{ fontSize: 32, fontWeight: 800, marginTop: 12 }}>{data.stats.loansCount}</h3>
          </div>

          <div className="stat-card">
            <div className="icon-bg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Users size={24} color="#FFF" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>Wanachama</p>
            <h3 style={{ fontSize: 32, fontWeight: 800, marginTop: 12 }}>{data.stats.membersCount}</h3>
          </div>
        </div>

        {/* Pending Approvals (Admin View) */}
        {data.userRole === 'ADMIN' && (data.pendingWithdrawals?.length > 0 || data.pendingLoans?.length > 0) && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} /> Maombi yanayosubiri Idhini
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              {/* Withdrawals */}
              {data.pendingWithdrawals.map((req: any) => (
                <div key={req.id} className="card" style={{ border: '1px solid rgba(255,215,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#FFD700', fontWeight: 800, marginBottom: 4 }}>OMBI LA PESA</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Muombaji</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{req.requester?.username}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Kiasi</div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(req.amount)}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sababu:</span> {req.reason}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => handleApproval(req.id, 'APPROVE')} className="btn-primary" style={{ flex: 1, padding: 12, fontSize: 14 }}>Idhinisha</button>
                    <button onClick={() => handleApproval(req.id, 'REJECT')} className="btn-secondary" style={{ flex: 1, padding: 12, fontSize: 14, color: '#FF4D4D' }}>Kataa</button>
                  </div>
                </div>
              ))}

              {/* Loans */}
              {data.pendingLoans.map((loan: any) => (
                <div key={loan.id} className="card" style={{ border: '1px solid rgba(0,255,135,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#00FF87', fontWeight: 800, marginBottom: 4 }}>OMBI LA MKOPO</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Muombaji</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{loan.user?.username}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Kiasi</div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(loan.amount)}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
                    <div style={{ marginBottom: 4 }}><span style={{ color: 'var(--text-secondary)' }}>Muda:</span> {loan.duration} Miezi</div>
                    <span style={{ color: 'var(--text-secondary)' }}>Sababu:</span> {loan.reason}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => handleLoanApproval(loan.id, 'APPROVE')} className="btn-primary" style={{ flex: 1, padding: 12, fontSize: 14, background: '#00FF87', color: '#000' }}>Idhinisha</button>
                    <button onClick={() => handleLoanApproval(loan.id, 'REJECT')} className="btn-secondary" style={{ flex: 1, padding: 12, fontSize: 14, color: '#FF4D4D' }}>Kataa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributors List Section */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Building2 size={24} color="#FFF" />
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Orodha ya Wachangiaji</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Na.</th>
                  <th>Mwanachama</th>
                  <th style={{ textAlign: 'right' }}>Kiwango Kilichochangiwa (TZS)</th>
                </tr>
              </thead>
              <tbody>
                {data.contributors.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                      Hakuna michango bado kwa kikundi hiki
                    </td>
                  </tr>
                ) : (
                  data.contributors.map((c: any, index: number) => (
                    <tr key={c.userId}>
                      <td style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                            {c.avatar_url ? (
                              <img src={c.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                              c.username[0].toUpperCase()
                            )}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{c.username}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>
                        {c.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <TrendingUp size={24} color="#FFF" />
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Shughuli za Karibuni (Feed)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!data.recentActivities || data.recentActivities.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>Hakuna miamala iliyorekodiwa bado</p>
            ) : (
              data.recentActivities.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {act.user?.username ? act.user.username[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{act.action}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Mhusika: {act.user?.username || 'System'} • {formatDate(act.date)}
                      </div>
                    </div>
                  </div>
                  {act.amount && (
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16 }}>
                      {formatCurrency(act.amount)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showDeposit || showWithdraw || showLoan) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card animate-fade-in" style={{ maxWidth: 460, width: '100%', padding: 40, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900 }}>
                {showDeposit ? 'Changia Kikundi' : showLoan ? 'Omba Mkopo' : 'Omba Pesa'}
              </h2>
              <button 
                onClick={() => { setShowDeposit(false); setShowWithdraw(false); setShowLoan(false); setAmount(''); setReason(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
              {showDeposit 
                ? 'Pesa unazochangia hapa zitakatwa moja kwa moja kutoka kwenye Mfuko wako Binafsi.' 
                : showLoan 
                  ? 'Mkopo wako utatoka kwenye mfuko wa kikundi na unahitaji kupata idhini ya Admin.'
                  : 'Ukiomba kutoa pesa, ombi lako litatumwa kwa msimamizi (Admin) kwa ajili ya idhini.'}
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Kiasi (TZS)</label>
              <input 
                type="number" 
                className="input-field" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: 24, padding: '20px', fontWeight: 800 }}
                placeholder="0"
                autoFocus
              />
            </div>

            {(showWithdraw || showLoan) && (
              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Sababu ya {showLoan ? 'Mkopo' : 'kuomba'}
                </label>
                <textarea 
                  className="input-field" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ minHeight: 80, padding: 16 }}
                  placeholder={showLoan ? "Taja jinsi mkopo huu utakavyosaidia..." : "Mfano: Matumizi ya dharura..."}
                />
              </div>
            )}

            {showLoan && (
               <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Muda wa kurejesha (Miezi)</label>
                <select 
                  className="input-field"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ padding: '16px', fontWeight: 700 }}
                >
                  <option value="1">Mwezi 1</option>
                  <option value="3">Miezi 3</option>
                  <option value="6">Miezi 6</option>
                  <option value="12">Mwaka 1</option>
                </select>
              </div>
            )}

            <button 
              onClick={showDeposit ? handleDeposit : showLoan ? handleLoanRequest : handleWithdrawRequest}
              disabled={isTransacting || !amount || ((showWithdraw || showLoan) && !reason)}
              className="btn-primary" 
              style={{ width: '100%', padding: '18px', borderRadius: 16, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {isTransacting ? <Loader2 className="spinner" /> : (showDeposit ? 'Changia Sasa' : 'Tuma Ombi')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
