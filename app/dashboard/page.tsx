'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  PiggyBank, HandCoins, Users, TrendingUp,
  AlertCircle, Activity, Wallet, BarChart3, Clock
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  noGroup: boolean
  isAdmin: boolean
  group: { id: string; name: string; joinCode: string }
  userStats: { totalSavings: number; activeLoans: number; loanBalance: number; pendingRequests: number }
  groupStats: { totalFunds: number; totalSavings: number; totalLoansIssued: number; membersCount: number; pendingVotes: number }
  recentActivities: Array<{ id: string; action: string; amount?: number; date: string; user: { username: string } }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const r = await fetch('/api/dashboard')
      const d = await r.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Real-time subscriptions
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

  if (data?.noGroup) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Karibu, Kikoba Smart! 🌟</h1>
        <p className="page-subtitle">Unganika na kikundi au unda kipya ili uanze</p>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 800 }}>
          <Link href="/dashboard/group" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Users size={32} color="#FFF" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Unganika na Kikundi</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Tumia nambari ya kujiunga</p>
            </div>
          </Link>
          <Link href="/dashboard/group" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Wallet size={32} color="#000" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Unda Kikundi</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Anza kikundi chako kipya</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const memberCards = [
    { label: 'Jumla ya Akiba', value: formatCurrency(data.userStats.totalSavings), icon: PiggyBank, link: '/dashboard/savings' },
    { label: 'Mikopo Inayoendela', value: data.userStats.activeLoans, icon: HandCoins, link: '/dashboard/loans' },
    { label: 'Baki ya Mkopo', value: formatCurrency(data.userStats.loanBalance), icon: TrendingUp, link: '/dashboard/loans' },
    { label: 'Maombi Yangu', value: data.userStats.pendingRequests, icon: Clock, link: '/dashboard/loans' },
  ]

  const adminCards = [
    { label: 'Fedha za Kikundi', value: formatCurrency(data.groupStats.totalFunds), icon: Wallet, link: '/dashboard/admin/report' },
    { label: 'Jumla ya Akiba', value: formatCurrency(data.groupStats.totalSavings), icon: PiggyBank, link: '/dashboard/admin/report' },
    { label: 'Mikopo Iliyotolewa', value: formatCurrency(data.groupStats.totalLoansIssued), icon: BarChart3, link: '/dashboard/admin/report' },
    { label: 'Wanachama', value: data.groupStats.membersCount, icon: Users, link: '/dashboard/admin/members' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="topbar">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Dashibodi</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{data.group?.name}</div>
        </div>
        {data.groupStats.pendingVotes > 0 && (
          <Link href="/dashboard/loans/vote" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF', border: '1px solid #FFF', borderRadius: 12, padding: '10px 18px', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <AlertCircle size={18} />
              Kura {data.groupStats.pendingVotes}
            </div>
          </Link>
        )}
      </div>

      <div className="page-content" style={{ paddingTop: 40 }}>
        {/* Member stats */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Takwimu Zangu</h2>
        <div className="stats-grid" style={{ marginBottom: 48 }}>
          {memberCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
                <div className="stat-card">
                  <div className="icon-bg">
                    <Icon size={24} color="#FFF" />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>{card.value}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{card.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Admin stats */}
        {data.isAdmin && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Takwimu za Kikundi</h2>
            <div className="stats-grid" style={{ marginBottom: 48 }}>
              {adminCards.map((card) => {
                const Icon = card.icon
                return (
                  <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
                    <div className="stat-card">
                      <div className="icon-bg">
                        <Icon size={24} color="#FFF" />
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-1px' }}>{card.value}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{card.label}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* Recent activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Activity size={20} color="#FFF" />
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Shughuli za Hivi Karibuni</h3>
          </div>
          {data.recentActivities.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} color="rgba(255,255,255,0.1)" />
              <p>Hakuna shughuli bado</p>
            </div>
          ) : (
            data.recentActivities.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="avatar">
                  {a.user.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>
                    <span style={{ color: '#FFF', fontWeight: 700 }}>{a.user.username}</span>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                    {a.amount ? <span style={{ color: '#FFF', fontWeight: 800 }}> · {formatCurrency(a.amount)}</span> : ''}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{formatRelativeTime(a.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

