'use client'
import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { PiggyBank, Plus, ArrowRight, TrendingUp, History, Download, Target, Loader2, ArrowUpRight } from 'lucide-react'
import { groupService } from '@/lib/services/groupService'
import { savingsService } from '@/lib/services/savingsService'
import { useI18n } from '@/lib/i18n'

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
  const [showDepositModal, setShowDepositModal] = useState(false)

  const { t } = useI18n()

  useEffect(() => {
    groupService.getUserGroups().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data.map(g => ({ id: g.id, name: g.name })))
        setSelectedGroup(data[0].id)
      }
    }).catch(console.error)
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
      const data = await savingsService.getSavings()
      setSavings(data.savings as any[])
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup) {
      alert('Tafadhali chagua kikundi kwanza')
      return
    }

    setSubmitting(true)

    try {
      await savingsService.contribute(selectedGroup, Number(amount), note)
      
      alert('Akiba imewekwa kikamilifu!')
      setAmount('')
      setNote('')
      setShowDepositModal(false)
      fetchSavings()
    } catch (err: any) {
      alert(err.message || 'Kuna tatizo limetokea')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <Loader2 className="spinner" size={40} color="var(--accent)" />
      <p style={{ color: 'var(--text-secondary)' }}>Inapakia taarifa za akiba...</p>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Dynamic Header */}
      <div style={{ padding: '24px 24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Akiba Yangu</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Jenga msingi imara wa kiuchumi</p>
      </div>

      <div className="page-content" style={{ paddingTop: 0 }}>
        
        {/* Main Hero Summary Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', 
          borderRadius: 28, 
          padding: 32, 
          position: 'relative', 
          overflow: 'hidden',
          marginBottom: 32,
          boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)'
        }}>
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: -30, right: -20, width: 150, height: 150, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -20, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: 12, borderRadius: 20, marginBottom: 16 }}>
              <TrendingUp size={28} color="#FFF" />
            </div>
            <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
              Jumla ya Akiba Yako
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#FFF', letterSpacing: '-1px' }}>
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <button 
            onClick={() => setShowDepositModal(true)}
            className="btn-primary hover-scale" 
            style={{ padding: '20px', borderRadius: 24, background: 'var(--accent)', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: 'none' }}
          >
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 16 }}>
              <Plus size={24} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800 }}>Weka Akiba</span>
          </button>

          <div className="card hover-scale" style={{ padding: '20px', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ background: 'rgba(34, 211, 238, 0.1)', padding: 12, borderRadius: 16 }}>
              <Target size={24} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Uwezo wa Mkopo</span>
          </div>
        </div>

        {/* History Section */}
        <div className="card" style={{ padding: 24, borderRadius: 28, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <History size={20} color="var(--accent)" />
              Historia ya Akiba
            </h3>
          </div>

          {savings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <PiggyBank size={48} strokeWidth={1} color="rgba(255,255,255,0.1)" />
              <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 15, fontWeight: 600 }}>Hujaweka akiba yoyote bado.</p>
              <button onClick={() => setShowDepositModal(true)} style={{ marginTop: 20, background: 'rgba(34, 211, 238, 0.1)', border: 'none', color: 'var(--accent)', padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14 }}>
                Weka Akiba Yako ya Kwanza
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {savings.map((saving) => (
                <div key={saving.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowUpRight size={20} color="#10B981" />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {saving.group?.name || 'Kikundi Binasfi'}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>{formatDate(saving.date)}</span>
                        {saving.note && (
                          <>
                            <span style={{ fontSize: 10 }}>•</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{saving.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981', flexShrink: 0, marginLeft: 16 }}>
                    +{formatCurrency(saving.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>Weka Akiba Mpya</h2>
              <button 
                onClick={() => setShowDepositModal(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}
              >
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Chagua Kikundi unachoweka Akiba</label>
                <select 
                  className="input-field" 
                  value={selectedGroup} 
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  disabled={groups.length === 0}
                  required
                  style={{ fontSize: 15, padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', color: '#FFF' }}
                >
                  {groups.length === 0 ? (
                     <option value="">Huna kikundi chochote</option>
                  ) : (
                    groups.map(g => (
                      <option key={g.id} value={g.id} style={{ color: "#000" }}>{g.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Kiasi (TZS)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="50,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1000"
                  required
                  style={{ fontSize: 24, padding: '16px 20px', borderRadius: 16, fontWeight: 900, textAlign: 'center' }}
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>Maelezo Mafupi (Si lazima)</label>
                <input
                   type="text"
                   className="input-field"
                   placeholder="Mfano: Akiba ya wiki hii"
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   style={{ fontSize: 15, padding: '16px 20px', borderRadius: 16 }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || groups.length === 0}
                style={{ width: '100%', borderRadius: 20, height: 60, fontSize: 16, fontWeight: 800, marginTop: 8 }}
              >
                {submitting ? <Loader2 className="spinner" /> : 'Kamilisha Muamala'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
