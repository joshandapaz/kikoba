'use client'
import { useState, useEffect } from 'react'
import { UserCircle, Mail, Phone, Calendar, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // Edit forms
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setUsername(data.username)
        setPhone(data.phone || '')
        setAvatarUrl(data.avatarUrl || null)
        setLoading(false)
      })
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setMessage({ type: '', text: '' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Import supabase client dynamically to ensure it's client-side
      const { supabase } = await import('@/lib/supabase')

      // Upload image to 'profiles' bucket
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl })
      })

      if (!res.ok) throw new Error('Failed to update profile')

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Picha ya wasifu imesasishwa!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Imeshindwa kupakia picha: ' + (err.message || 'Error') })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })
    
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phone })
    })
    
    setUpdating(false)
    if (res.ok) {
      setMessage({ type: 'success', text: 'Taarifa zako zimesasishwa kikamilifu' })
      const data = await res.json()
      setUser(data)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } else {
      setMessage({ type: 'error', text: 'Imeshindwa kusasisha. Jaribu tena.' })
    }
  }

  const copyToClipboard = () => {
    if (user?.memberCode) {
      navigator.clipboard.writeText(user.memberCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="spinner" style={{ margin: '64px auto', display: 'block' }} />

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Wasifu Wangu</h1>
        <p className="page-subtitle">Dhibiti na hariri taarifa zako binafsi</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24, alignItems: 'start' }}>
          
          {/* User Card View */}
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div 
              className="avatar" 
              style={{ 
                width: 112, height: 112, fontSize: 44, margin: '0 auto 32px', 
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                border: '4px solid var(--border)' 
              }}
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              {uploadingPhoto ? (
                <div className="spinner" style={{ width: 40, height: 40 }} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.username[0].toUpperCase()
              )}
              <div style={{ 
                position: 'absolute', bottom: 0, left: 0, right: 0, 
                background: 'rgba(0,0,0,0.6)', padding: '4px 0', 
                fontSize: '10px', fontWeight: 800, color: '#FFF',
                opacity: 0, transition: 'opacity 0.3s'
              }} className="avatar-overlay">
                BADILI PICHA
              </div>
            </div>
            <input 
              type="file" 
              id="photo-upload" 
              hidden 
              accept="image/*" 
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>{user.username}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, marginBottom: 24 }}>Kikoba Smart Member</p>
            
            <div style={{ marginBottom: 32, background: '#FFF', border: '1px solid #FFF', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#000', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>ID yako ya kipekee</div>
                <div style={{ fontSize: 22, color: '#000', fontWeight: 900, letterSpacing: 1 }}>{user.memberCode || 'Hakuna Namba'}</div>
              </div>
              <button 
                onClick={copyToClipboard}
                style={{ 
                  background: copied ? '#000' : 'rgba(0,0,0,0.05)', 
                  border: 'none', borderRadius: 10, width: 44, height: 44, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: copied ? '#FFF' : '#000', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Nakili Nambari"
              >
                {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#FFF', fontSize: 15, fontWeight: 500 }}>
                <Mail size={18} color="rgba(255,255,255,0.4)" /> {user.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#FFF', fontSize: 15, fontWeight: 500 }}>
                <Phone size={18} color="rgba(255,255,255,0.4)" /> {user.phone || 'Hakuna Namba'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#FFF', fontSize: 15, fontWeight: 500 }}>
                <Calendar size={18} color="rgba(255,255,255,0.4)" /> Kujiunga: {formatDate(user.dateJoined)}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, fontWeight: 800, marginBottom: 32 }}>
              <UserCircle size={24} color="#FFF" /> Hariri Taarifa Zako
            </h3>

            {message.text && (
              <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Jina Lako (Username)</label>
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Barua Pepe</label>
                <input
                  type="email"
                  className="input-field"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.4, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} color="#FFF" /> Barua pepe haiwezi kubadilishwa.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Nambari ya Simu</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: +255700000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 40, width: '100%', padding: '14px' }} disabled={updating}>
                {updating ? <span className="spinner" /> : <>Hifadhi Mabadiliko <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
