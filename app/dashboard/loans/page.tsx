'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, getLoanStatusColor, getLoanStatusLabel, calculateLoanBalance } from '@/lib/utils'
import { loanService } from '@/lib/services/loanService'
import { HandCoins, Plus, Calendar, Activity, ChevronRight, CheckCircle2 } from 'lucide-react'

// Define interfaces based on Prisma schema
interface LoanPayment { id: string; amount: number; date: string }
interface Loan {
  id: string
  amount: number
  reason: string
  status: string
  createdAt: string
  interestRate: number
  group: { name: string }
  payments: LoanPayment[]
}

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = () => {
    loanService.getLoans({ mine: true })
      .then(data => {
        setLoans(data as any[])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchLoans()

    // Real-time subscriptions
    const channel = supabase
      .channel('loans_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => fetchLoans())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_payments' }, () => fetchLoans())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])


  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Mikopo Yangu</h1>
          <p className="page-subtitle">Orodha ya mikopo yako yote na marejesho</p>
        </div>
        <Link href="/dashboard/loans/request" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ width: 'auto' }}>
            <Plus size={18} /> Omba Mkopo
          </button>
        </Link>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : loans.length === 0 ? (
          <div className="empty-state card">
            <HandCoins size={56} color="rgba(255,255,255,0.1)" />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Hujakopa Bado</h3>
            <p style={{ marginBottom: 32, color: 'var(--text-secondary)' }}>Huna rekodi yoyote ya mkopo. Unaweza kutuma maombi mapya sasa.</p>
            <Link href="/dashboard/loans/request" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }}>Omba Mkopo Sasa</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {loans.map(loan => {
              const balance = calculateLoanBalance(loan.amount, loan.interestRate, loan.payments)
              const totalAmount = loan.amount + (loan.amount * loan.interestRate) / 100
              const progress = ((totalAmount - balance) / totalAmount) * 100

              return (
                <div key={loan.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '40px' }}>
                  
                  {/* Status & Basic Info */}
                  <div style={{ flex: '1 1 240px' }}>
                    <div className={`badge ${loan.status === 'PAID' ? 'badge-approved' : 'badge-pending'}`} style={{ marginBottom: '20px', display: 'inline-flex', fontWeight: 800 }}>
                      {loan.status === 'PAID' ? <CheckCircle2 size={12} strokeWidth={3} /> : <Activity size={12} strokeWidth={3} />}
                      {getLoanStatusLabel(loan.status).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-1px', color: '#FFF' }}>
                      {formatCurrency(loan.amount)}
                    </div>
                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={14} /> {loan.group.name}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ flex: '3 1 400px', padding: '0 40px', borderLeft: '1px solid var(--border)', borderRight: loan.status === 'APPROVED' ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', marginBottom: '12px', letterSpacing: '-0.3px' }}>{loan.reason}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <Calendar size={16} /> Imeombwa: <span style={{ color: '#FFF' }}>{formatDate(loan.createdAt)}</span>
                    </div>

                    {/* Progress bar (only for approved/paid) */}
                    {(loan.status === 'APPROVED' || loan.status === 'PAID') && (
                      <div style={{ marginTop: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Marejesho: {formatCurrency(totalAmount - balance)}</span>
                          <span style={{ fontWeight: 800, color: '#FFF' }}>
                            Deni: {formatCurrency(balance)}
                          </span>
                        </div>
                        <div className="vote-bar" style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                          <div className="vote-bar-fill" style={{ width: `${progress}%`, background: '#FFF', borderRadius: 4, boxShadow: '0 0 10px rgba(255,255,255,0.2)' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {loan.status === 'APPROVED' && (
                    <div style={{ flex: '0 0 auto' }}>
                      <Link href={`/dashboard/loans/${loan.id}/repay`} style={{ textDecoration: 'none' }}>
                        <button className="btn-primary" style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 14 }}>
                          Lipa Mkopo <ChevronRight size={18} />
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>


    </div>
  )
}
