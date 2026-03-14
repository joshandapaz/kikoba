'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Vote, History, Users, Check, X, Building, HandCoins } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface LoanVote {
  user: { id: string, username: string }
  vote: 'APPROVE' | 'REJECT'
}

interface Loan {
  id: string
  amount: number
  reason: string
  duration: number
  status: string
  createdAt: string
  user: { id: string, username: string }
  group: { name: string }
  votes: LoanVote[]
  _count: { votes: number }
}

export default function VoteLoansPage() {
  const { data: session } = useSession()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [votingId, setVotingId] = useState<string | null>(null)

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    // Fetch all pending loans in user's groups
    const res = await apiClient('/api/loans?status=PENDING')
    const data = await res.json()
    if (res.ok) setLoans(data)
    setLoading(false)
  }

  const handleVote = async (loanId: string, voteType: 'APPROVE' | 'REJECT') => {
    setVotingId(loanId)
    const res = await apiClient(`/api/loans/${loanId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote: voteType })
    })
    
    setVotingId(null)
    if (res.ok) {
      // Refresh list
      fetchLoans()
    } else {
      const data = await res.json()
      alert(data.error)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Piga Kura za Mikopo</h1>
        <p className="page-subtitle">Idhinisha au kataa maombi ya mikopo ya wanachama wenzako</p>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : loans.length === 0 ? (
          <div className="empty-state card">
            <Vote size={56} color="rgba(255,255,255,0.1)" />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Hakuna Kura Zinasubiri</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Wanachama wote wamepigiwa kura au hakuna maombi mapya.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
            {loans.map(loan => {
              // Calculate vote stats
              const totalVotes = loan.votes.length
              const approvals = loan.votes.filter(v => v.vote === 'APPROVE').length
              const rejections = loan.votes.filter(v => v.vote === 'REJECT').length
              const approvalPercent = totalVotes > 0 ? Math.round((approvals / totalVotes) * 100) : 0
              
              // Check if current user has voted or is the owner
              const isOwner = loan.user.id === session?.user?.id
              const hasVoted = loan.votes.some(v => v.user.id === session?.user?.id)

              return (
                <div key={loan.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className="avatar" style={{ width: 48, height: 48, fontSize: 18, fontWeight: 700 }}>
                        {loan.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>{loan.user.username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 4 }}>
                          <Building size={12} /> {loan.group.name}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFF', letterSpacing: '-1px' }}>
                        {formatCurrency(loan.amount)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Miezi {loan.duration}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '24px', fontSize: '15px', color: '#FFF', flex: 1, border: '1px solid var(--border)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: 1 }}>Sababu ya Mkopo:</span>
                    "{loan.reason}"
                  </div>

                  {/* Vote Progress */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Users size={14} /> Kura {totalVotes}
                      </span>
                      <span style={{ fontWeight: 800, color: '#FFF' }}>
                        {approvalPercent}% Ndiyo
                      </span>
                    </div>
                    <div className="vote-bar" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                      <div className="vote-bar-fill" style={{ width: `${approvalPercent}%`, background: '#FFF', borderRadius: 4, boxShadow: '0 0 10px rgba(255,255,255,0.2)' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Inahitaji 60% kuidhinishwa
                    </div>
                  </div>

                  {/* Actions */}
                  {isOwner ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Huwezi kupigia kura mkopo wako mwenyewe
                    </div>
                  ) : hasVoted ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: '#FFF', borderRadius: '12px', fontSize: '14px', color: '#000', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Check size={18} strokeWidth={3} /> Umeshapiga kura
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleVote(loan.id, 'REJECT')}
                        disabled={votingId === loan.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 14, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
                      >
                        {votingId === loan.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <X size={18} />}
                        KATAZA
                      </button>
                      
                      <button 
                        className="btn-primary" 
                        onClick={() => handleVote(loan.id, 'APPROVE')}
                        disabled={votingId === loan.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 14 }}
                      >
                        {votingId === loan.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={18} />}
                        KUBALI
                      </button>
                    </div>
                  )}
                  <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    IMEOMBWA {formatRelativeTime(loan.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
