'use client'
import { useState, useEffect } from 'react'
import { Activity as ActivityIcon } from 'lucide-react'
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils'

interface Activity {
  id: string
  action: string
  amount: number | null
  date: string
  user: { username: string }
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActivities(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Shughuli za Kikundi</h1>
        <p className="page-subtitle">Orodha ya matukio yote ya kifedha kwenye vikundi vyako</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
            <ActivityIcon size={22} color="#FFF" />
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>Rekodi Pamoja</h2>
          </div>

          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                <span className="spinner" style={{ width: 40, height: 40 }} />
             </div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <ActivityIcon size={56} color="rgba(255,255,255,0.1)" />
              <p>Hakuna shughuli yoyote iliyofanyika bado.</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: 'var(--border)', zIndex: 0 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {activities.map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                    {/* Timeline dot */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#000', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFF' }} />
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ fontSize: '16px', color: '#FFF', fontWeight: 500 }}>
                          <span style={{ fontWeight: 800, color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>{a.user.username}</span>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {formatRelativeTime(a.date)}
                        </div>
                      </div>
                      
                      {a.amount && (
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFF', letterSpacing: '-1px' }}>
                          {formatCurrency(a.amount)}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '16px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        TAREHE: {formatDate(a.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
