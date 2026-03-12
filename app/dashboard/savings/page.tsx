'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { PiggyBank, Plus, ArrowRight } from 'lucide-react'


interface Saving {
  id: string
  amount: number
  note: string | null
  date: string
  group: { name: string }
}

export default function SavingsPage() {
  const [savings, setSavings] = useState<Saving[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<{ id: string, name: string }[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')

  // Form state
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetch('/api/group').then(res => res.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data.map(g => ({ id: g.id, name: g.name })))
        setSelectedGroup(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    fetchSavings()

    // Real-time subscription
    const channel = supabase
      .channel('savings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings' }, () => fetchSavings())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSavings = async () => {
    try {
      const res = await fetch('/api/savings')
      const data = await res.json()
      if (res.ok) {
        setSavings(data.savings)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) {
      setMessage({ type: 'error', text: 'Tafadhali chagua kikundi kwanza' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const res = await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: selectedGroup,
        amount: Number(amount),
        note
      })
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error })
    } else {
      setMessage({ type: 'success', text: 'Akiba imewekwa kikamilifu!' })
      setAmount('')
      setNote('')
      fetchSavings()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Akiba Zangu</h1>
        <p className="page-subtitle">Weka na kufuatilia akiba zako kwenye vikundi vyako</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          {/* Add Savings Form */}
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
              <Plus size={20} color="#FFF" /> Ingiza Akiba Mpya
            </h2>

            {message.text && (
              <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Kikundi</label>
                <select 
                  className="input-field" 
                  value={selectedGroup} 
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={groups.length === 0}
                  required
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
                <label className="form-label">Kiasi (TZS)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Mfano: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1000"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maelezo (Si lazima)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: Akiba ya mwezi Machi"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || groups.length === 0}
                style={{ width: '100%' }}
              >
                {submitting ? <span className="spinner" /> : <>Weka Akiba <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          {/* Stats Summary */}
          <div>
            <div className="stat-card" style={{ marginBottom: '24px' }}>
              <div className="icon-bg">
                <PiggyBank size={24} color="#FFF" />
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Jumla ya Akiba Yako</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#FFF' }}>
                {loading ? '...' : formatCurrency(total)}
              </div>
            </div>
            
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Masharti ya Akiba</h3>
              <ul style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', paddingLeft: '20px' }}>
                <li>Kiwango cha chini cha akiba hutegemea makubaliano ya kikundi.</li>
                <li>Akiba zako ndizo zinazokupa uwezo wa kukopa kiwango kikubwa zaidi.</li>
                <li>Kumbuka kuweka akiba mara kwa mara (kila wiki/mwezi).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Savings History Table */}
        <div className="card">
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Historia ya Akiba</h2>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarehe</th>
                  <th>Kikundi</th>
                  <th>Maelezo</th>
                  <th style={{ textAlign: 'right' }}>Kiasi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>
                      <span className="spinner" style={{ width: 32, height: 32 }} />
                    </td>
                  </tr>
                ) : savings.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '64px' }}>
                      <div className="empty-state">
                        <PiggyBank size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
                        <p>Hujaweka akiba yoyote bado.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  savings.map((saving) => (
                    <tr key={saving.id}>
                      <td>{formatDate(saving.date)}</td>
                      <td style={{ fontWeight: 600 }}>{saving.group.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{saving.note || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#FFF' }}>
                        +{formatCurrency(saving.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
