'use client'
import { useState, useEffect, use } from 'react'
import { Shield, ShieldAlert, Trash2, Users, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [memberCodeInput, setMemberCodeInput] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [addMessage, setAddMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchMembers()
  }, [groupId])

  const fetchMembers = async () => {
    const res = await fetch(`/api/admin/members?groupId=${groupId}`)
    const data = await res.json()
    if (res.ok) setMembers(data)
    else setError(data.error || 'Ruhusa imekataliwa')
    setLoading(false)
  }

  const changeRole = async (memberId: string, newRole: string) => {
    if (!confirm(`Je, una uhakika unataka kubadilisha cheo kuwa ${newRole}?`)) return
    
    const res = await fetch('/api/admin/members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, role: newRole, groupId })
    })
    if (res.ok) fetchMembers()
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Je, una uhakika unataka kumtoa mwanachama huyu?')) return
    
    const res = await fetch(`/api/admin/members?memberId=${memberId}&groupId=${groupId}`, { method: 'DELETE' })
    if (res.ok) fetchMembers()
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberCodeInput.trim()) return

    setAddingMember(true)
    setAddMessage({ type: '', text: '' })

    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberCode: memberCodeInput, groupId })
    })

    setAddingMember(false)
    if (res.ok) {
      setAddMessage({ type: 'success', text: 'Mwanachama ameongezwa kikamilifu!' })
      setMemberCodeInput('')
      fetchMembers()
      setTimeout(() => setAddMessage({ type: '', text: '' }), 4000)
    } else {
      const data = await res.json()
      setAddMessage({ type: 'error', text: data.error || 'Imeshindwa kuongeza mwanachama' })
    }
  }

  if (error) return (
    <div className="page-content" style={{ marginTop: '32px' }}>
      <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={20} /> {error}
      </div>
      <Link href={`/dashboard/group/${groupId}`}>
         <button className="btn-secondary" style={{ marginTop: 24 }}>Rudi kwenye Dashboard</button>
      </Link>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <Link href={`/dashboard/group/${groupId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Rudi kwenye Dashboard
        </Link>
        <h1 className="page-title">Usimamizi wa Wanachama</h1>
        <p className="page-subtitle">Ongeza au ondoa wanachama na udhibiti vyeo vyao</p>
      </div>

      <div className="page-content">
        
        {/* Add Member Form */}
        <div className="card" style={{ marginBottom: 32, padding: '32px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.5px' }}>
            <UserPlus size={22} color="#FFF" /> Ongeza Mwanachama Mpya
          </h3>
          
          {addMessage.text && (
            <div className={`alert ${addMessage.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 24 }}>
              {addMessage.text}
            </div>
          )}

          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="input-field"
                placeholder="Ingiza ID ya mwanachama (mfano: KKB-A1B2)"
                value={memberCodeInput}
                onChange={(e) => setMemberCodeInput(e.target.value.toUpperCase())}
                required
                style={{ textTransform: 'uppercase', padding: '14px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }} disabled={addingMember}>
              {addingMember ? <span className="spinner" /> : <>Ongeza Mwanachama <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Users size={24} color="#FFF" />
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Orodha ya Wanachama ({members.length})</h2>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mwanachama</th>
                  <th>Mawasiliano</th>
                  <th>Cheo</th>
                  <th style={{ textAlign: 'right' }}>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px' }}>
                      <span className="spinner" style={{ width: 32, height: 32 }} />
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                      Hakuna wanachama waliopatikana
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                            {m.user.avatar_url ? (
                                <img src={m.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                                m.user.username[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{m.user.username}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {m.user.memberCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 14, color: '#FFF', fontWeight: 500 }}>{m.user.phone || m.user.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${m.role === 'ADMIN' ? 'badge-approved' : 'badge-pending'}`} style={{ fontWeight: 700 }}>
                          {m.role === 'ADMIN' ? 'KIONGOZI' : 'MWANACHAMA'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <select 
                          className="input-field" 
                          style={{ width: 'auto', padding: '8px 14px', fontSize: 12, marginRight: 12, display: 'inline-block', fontWeight: 600 }}
                          value={m.role}
                          onChange={(e) => changeRole(m.id, e.target.value)}
                        >
                          <option value="MEMBER" style={{color:"#000"}}>Mwanachama</option>
                          <option value="ADMIN" style={{color:"#000"}}>Kiongozi (Admin)</option>
                        </select>
                        <button 
                          onClick={() => removeMember(m.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px', borderRadius: 8, transition: 'all 0.2s' }}
                          title="Ondoa Mwanachama"
                        >
                          <Trash2 size={18} />
                        </button>
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


export function generateStaticParams() { return [{ id: '1' }]; }
