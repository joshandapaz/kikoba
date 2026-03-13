'use client'
import { useState, useEffect } from 'react'
import { Plus, Users, Copy, Check, Hash, Building, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Group {
  id: string
  name: string
  description?: string
  joinCode: string
  createdAt: string
  members: any[]
  userRole: string
  _count: { members: number, savings: number, loans: number }
}

export default function GroupPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState('')
  
  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  
  // Forms
  const [createForm, setCreateForm] = useState({ name: '', description: '', memberCodes: '' })
  const [formState, setFormState] = useState({ loading: false, error: '', success: '' })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const res = await fetch('/api/group')
    if (res.ok) setGroups(await res.json())
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({ loading: true, error: '', success: '' })
    
    const res = await fetch('/api/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm)
    })
    
    const data = await res.json()
    if (!res.ok) {
      setFormState({ loading: false, error: data.error, success: '' })
    } else {
      setFormState({ loading: false, error: '', success: 'Kikundi kimeundwa kikamilifu!' })
      fetchGroups()
      setTimeout(() => { setShowCreate(false); setCreateForm({ name: '', description: '', memberCodes: '' }) }, 1500)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Vikundi Vyangu</h1>
          <p className="page-subtitle">Dhibiti vikundi vyako, unda kipya au jiunge na kikundi kingine</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Unda Kikundi
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state card">
            <Building size={56} color="rgba(255,255,255,0.1)" />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Hujaunda au kujiunga na Kikundi Chochote</h3>
            <p style={{ marginBottom: 32, color: 'var(--text-secondary)' }}>Unda kikundi kipya kuanza kuweka akiba na wengine.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }} onClick={() => setShowCreate(true)}>
                Unda Kikundi Sasa
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {groups.map(group => (
              <div key={group.id} className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.5px' }}>{group.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
                      {group.description || 'Hakuna maelezo'}
                    </p>
                  </div>
                  <div className="avatar" style={{ background: 'rgba(255,255,255,0.05)', color: '#FFF', width: 44, height: 44 }}>
                    <Building size={20} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{group._count.members}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: 4 }}>
                      <Users size={12} /> Wanachama
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{group._count.savings}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>Michango</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>{group._count.loans}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>Mikopo</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Link href={`/dashboard/group/${group.id}`} style={{ flex: 1 }}>
                    <button className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
                      <Users size={16} /> Angalia
                    </button>
                  </Link>
                  {group.userRole === 'ADMIN' && (
                    <Link href={`/dashboard/group/${group.id}`} style={{ flex: 1 }}>
                      <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
                        <Shield size={16} /> Dhibiti
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal animate-fade-in" style={{ padding: '40px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.5px' }}>Unda Kikundi Kipya</h2>
            
            {formState.error && <div className="alert alert-error">{formState.error}</div>}
            {formState.success && <div className="alert alert-success">{formState.success}</div>}
            
            <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} color="#FFD700" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#FFD700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tahadhari ya Makato</div>
                <div style={{ fontSize: 14, color: 'rgba(255,215,0,0.8)', fontWeight: 500 }}>Gharama ya kuunda kikundi kipya ni **TZS 10,000**. Kiasi hiki kitakatwa kwenye mfuko wako binafsi.</div>
              </div>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Jina la Kikundi</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: Kikoba cha Marafiki"
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maelezo (Si lazima)</label>
                <textarea
                  className="input-field"
                  placeholder="Elezea madhumuni ya kikundi..."
                  value={createForm.description}
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ongeza Wanachama (Si lazima)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: KKB-A1B2, KKB-X9YZ"
                  value={createForm.memberCodes}
                  onChange={e => setCreateForm({...createForm, memberCodes: e.target.value.toUpperCase()})}
                />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>Tenganisha ID za wanachama kwa kutumia koma (,).</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '14px' }}>
                  Ghairi
                </button>
                <button type="submit" className="btn-primary" disabled={formState.loading || !createForm.name} style={{ flex: 1, padding: '14px' }}>
                  {formState.loading ? <span className="spinner" /> : 'Unda Kikundi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
