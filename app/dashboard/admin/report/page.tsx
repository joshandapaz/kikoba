'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { FileBarChart, PieChart, TrendingUp, PiggyBank, HandCoins } from 'lucide-react'

export default function AdminReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard') // Reuse dashboard API which contains all group aggregates
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="spinner" style={{ margin: '64px auto', display: 'block' }} />

  if (!data?.isAdmin) return (
    <div className="page-content" style={{ marginTop: 32 }}>
      Huna ruhusa ya kuona ukurasa huu.
    </div>
  )

  const s = data.groupStats

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Ripoti ya Fedha za Kikundi</h1>
        <p className="page-subtitle">Muhtasari wa hali ya kifedha kwa ujumla</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, marginBottom: 48 }}>
          
          <div className="card" style={{ borderTop: '4px solid #FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <PiggyBank size={24} color="#FFF" />
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Jumla ya Akiba Yote</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>{formatCurrency(s.totalSavings)}</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, lineHeight: '1.5' }}>Pesa iliyochangwa na wanachama wote tangu mwanzo</p>
          </div>

          <div className="card" style={{ borderTop: '4px solid rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <HandCoins size={24} color="#FFF" />
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Mikopo Iliyotolewa</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>{formatCurrency(s.totalLoansIssued)}</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 12, lineHeight: '1.5' }}>Jumla ya pesa zote zilizokopeshwa nje</p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #FFF', background: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <TrendingUp size={24} color="#000" />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#000' }}>Salio la Kikundi Sasa</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#000', letterSpacing: '-1px' }}>{formatCurrency(s.totalFunds)}</div>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 12, lineHeight: '1.5', fontWeight: 500 }}>Michango inayopatikana taslimu kwenye kikundi sasa hivi</p>
          </div>

        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <PieChart size={24} color="#FFF" />
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Uchanganuzi wa Haraka</h2>
          </div>
          <div style={{ height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', display: 'flex', marginBottom: 24, padding: 2 }}>
            {s.totalSavings > 0 ? (
              <>
                <div style={{ width: `${(s.totalFunds / s.totalSavings) * 100}%`, background: '#FFF', borderRadius: '12px 0 0 12px' }} title="Pesa Taslimu" />
                <div style={{ width: `${(s.totalLoansIssued / s.totalSavings) * 100}%`, background: 'rgba(255,255,255,0.2)', borderLeft: '1px solid #000' }} title="Mikopo ya Nje" />
              </>
            ) : (
              <div style={{ width: '100%' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: '#FFF' }} /> Pesa Taslimu (Cash)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} /> Pesa Zilizokopwa (Mikopo)
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
