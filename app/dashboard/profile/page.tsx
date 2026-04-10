'use client'
import { useState, useEffect } from 'react'
import { UserCircle, Mail, Phone, Calendar, ArrowRight, ShieldCheck, Copy, Check, Globe, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/lib/services/profileService'
import { useI18n } from '@/lib/i18n'
import LoadingScreen from '@/components/LoadingScreen'

const LANGUAGES = [
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

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
  const [showEditForm, setShowEditForm] = useState(false)

  const { t, setLang } = useI18n()

  // Language
  const [language, setLanguage] = useState('sw')
  const [showLangPicker, setShowLangPicker] = useState(false)

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('kikoba_lang')
    if (saved) setLanguage(saved)

    profileService.getProfile()
      .then(data => {
        setUser(data)
        setUsername(data?.username || '')
        setPhone(data?.phone || '')
        setAvatarUrl(data?.avatar_url || null)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleLanguageChange = (code: string) => {
    setLanguage(code)
    setLang(code)
    setShowLangPicker(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setMessage({ type: '', text: '' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id || 'guest'}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload image to 'profiles' bucket
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL using service
      const updated = await profileService.updateProfile({ avatarUrl: publicUrl })

      setAvatarUrl(publicUrl)
      setUser(updated)
      setMessage({ type: 'success', text: 'Picha ya wasifu imesasishwa!' })
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Imeshindwa kupakia picha: ' + (err.message || t('failed_load')) })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent update if nothing changed
    if (username === user?.username && phone === user?.phone) {
      setShowEditForm(false)
      return
    }

    setUpdating(true)
    setMessage({ type: '', text: '' })
    
    try {
      // Basic TZ phone validation
      if (phone && !/^(?:\+255|255|0)?(6|7)[0-9]{8}$/.test(phone.replace(/\s/g, ''))) {
        throw new Error('Namba ya simu haiko kwenye mpangilio sahihi (mfano: 0700000000)')
      }

      const updated = await profileService.updateProfile({ username, phone })
      
      setMessage({ type: 'success', text: 'Taarifa zako zimesasishwa kikamilifu' })
      setUser(updated)
      setShowEditForm(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Imeshindwa kusasisha. Jaribu tena.' })
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = () => {
    const code = user?.memberCode || 'KKB-PRO-01'
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  if (loading) return <LoadingScreen />

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{t('my_profile')}</h1>
        <p className="page-subtitle">{t('profile_subtitle')}</p>
      </div>

      <div className="page-content">

        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 24 }}>
            {message.text}
          </div>
        )}

        {/* Avatar + Name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div 
            className="avatar" 
            style={{ 
              width: 100, height: 100, fontSize: 40, margin: '0 auto 16px', 
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              borderRadius: '50%',
              border: '3px solid rgba(34, 211, 238, 0.3)',
              boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)'
            }}
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            {uploadingPhoto ? (
              <div className="spinner" style={{ width: 32, height: 32 }} />
            ) : avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={() => {
                  setAvatarUrl(null);
                }}
              />
            ) : (
              user?.username ? user.username[0].toUpperCase() : 'U'
            )}
          </div>
          <input 
            type="file" 
            id="photo-upload" 
            hidden 
            accept="image/*" 
            onChange={handlePhotoUpload}
            disabled={uploadingPhoto}
          />
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{user?.username || 'Mwanachama'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>Kikoba Smart Member</p>
        </div>

        <div className="card" style={{ 
          padding: 20, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{t('member_code')}</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: 'var(--accent)' }}>{user?.memberCode || 'KKB-PRO-01'}</div>
          </div>
          <button 
            onClick={copyToClipboard}
            style={{ 
              background: copied ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border)', 
              borderRadius: 12, width: 44, height: 44, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: copied ? '#000' : '#FFF', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>

        {/* Info Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('email')}</div>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'N/A'}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={18} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('phone')}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.phone || t('not_filled')}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={18} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('member_since')}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.dateJoined ? formatDate(user.dateJoined) : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Lugha / Language</div>
          <div 
            className="card" 
            onClick={() => setShowLangPicker(!showLangPicker)} 
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {currentLang.flag}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{currentLang.label}</div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--text-secondary)" style={{ transition: 'transform 0.2s', transform: showLangPicker ? 'rotate(90deg)' : 'none' }} />
          </div>

          {showLangPicker && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LANGUAGES.map(lang => (
                <div 
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="card"
                  style={{ 
                    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    border: language === lang.code ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: language === lang.code ? 'rgba(34,211,238,0.08)' : undefined
                  }}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{lang.label}</span>
                  {language === lang.code && <Check size={16} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Button / Form */}
        {!showEditForm ? (
          <button 
            className="btn-primary" 
            style={{ width: '100%', borderRadius: 16, height: 52 }}
            onClick={() => setShowEditForm(true)}
          >
            <UserCircle size={20} /> {t('edit_info')}
          </button>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{t('edit_info')}</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('username')}</label>
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder={t('enter_name')}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('email')}</label>
                <input
                  type="email"
                  className="input-field"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={13} /> {t('email_locked')}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('phone_number')}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('phone_placeholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, borderRadius: 14 }} onClick={() => setShowEditForm(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, borderRadius: 14 }} disabled={updating}>
                  {updating ? <span className="spinner" /> : t('save')}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
