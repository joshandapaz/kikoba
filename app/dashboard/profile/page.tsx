'use client'
import { useState, useEffect } from 'react'
import { UserCircle, Mail, Phone, Calendar, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

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
    apiClient('/api/profile')
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setUsername(data?.username || '')
        setPhone(data?.phone || '')
        setAvatarUrl(data?.avatar_url || null)
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
      const fileName = `${user?.id || 'guest'}-${Math.random()}.${fileExt}`
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
      const res = await apiClient('/api/profile', {
        method: 'PUT',
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
    
    const res = await apiClient('/api/profile', {
      method: 'PUT',
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
    const code = user?.memberCode || 'KKB-PRO-01'
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="spinner" style={{ margin: '64px auto', display: 'block' }} />

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Wasifu Wangu</h1>
        <p className="page-subtitle">Dhibiti na hariri taarifa zako binafsi za Kikoba Smart</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, alignItems: 'stretch' }}>
          
          {/* User Card View */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 0 40px', textAlign: 'center' }}>
              <div 
                className="avatar" 
                style={{ 
                  width: 128, height: 128, fontSize: 48, margin: '0 auto 28px', 
                  position: 'relative', overflow: 'hidden', cursor: 'pointer',
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 30px rgba(255,255,255,0.05)'
                }}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                {uploadingPhoto ? (
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                ) : avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => {
                      console.log('Avatar image load failed, falling back to initial');
                      setAvatarUrl(null);
                    }}
                  />
                ) : (
                  user?.username ? user.username[0].toUpperCase() : 'U'
                )}
                <div style={{ 
                  position: 'absolute', bottom: 0, left: 0, right: 0, 
                  background: 'rgba(0,0,0,0.8)', padding: '6px 0', 
                  fontSize: '9px', fontWeight: 900, color: '#FFF',
                  opacity: 0, transition: 'opacity 0.3s',
                  letterSpacing: '1px'
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
              <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>{user?.username || 'Mwanachama'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Kikoba Smart Member</p>
            </div>
            
            <div style={{ 
              marginBottom: 32, 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 20, padding: '24px 28px', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1.5 }}>Namba ya Utambulisho</div>
                <div style={{ fontSize: 24, color: '#FFF', fontWeight: 900, letterSpacing: 2 }}>{user?.memberCode || 'KKB-PRO-01'}</div>
              </div>
              <button 
                onClick={copyToClipboard}
                style={{ 
                  background: copied ? '#FFF' : 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: 14, width: 48, height: 48, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: copied ? '#000' : '#FFF', cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                title="Nakili Nambari"
              >
                {copied ? <Check size={22} strokeWidth={3} /> : <Copy size={22} strokeWidth={2.5} />}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <Mail size={18} color="rgba(255,255,255,0.4)" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Barua Pepe</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.email || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <Phone size={18} color="rgba(255,255,255,0.4)" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Simu</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.phone || 'Hujajaza'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                <Calendar size={18} color="rgba(255,255,255,0.4)" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Mwanachama tangu</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.dateJoined ? formatDate(user.dateJoined) : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
              <UserCircle size={28} color="#FFF" /> Hariri Taarifa
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 40 }}>Sasisha taarifa zako za akaunti hapa.</p>

            {message.text && (
              <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 32 }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: 10, display: 'block' }}>Jina Lako (Username)</label>
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Ingiza jina lako"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: 10, display: 'block' }}>Barua Pepe</label>
                <input
                  type="email"
                  className="input-field"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                  <ShieldCheck size={14} color="rgba(255,255,255,0.4)" /> Barua pepe haiwezi kubadilishwa kwa sasa.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginBottom: 10, display: 'block' }}>Nambari ya Simu</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mfano: +255 700 000 000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', height: 56, fontSize: 16, borderRadius: 16 }} disabled={updating}>
                  {updating ? <span className="spinner" /> : <>Hifadhi Mabadiliko <ArrowRight size={20} /></>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
