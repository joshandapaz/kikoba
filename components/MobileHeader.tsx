'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, UserCircle, LogOut, Wallet, Vote, Activity, FileBarChart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'

interface MobileHeaderProps {
  onMenuToggle: () => void
  menuOpen: boolean
}

export default function MobileHeader({ onMenuToggle, menuOpen }: MobileHeaderProps) {
  const router = useRouter()
  const { session } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="mobile-header">
        <button
          className="mobile-header-btn"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/dashboard" className="mobile-header-logo">
          <div className="mobile-header-logo-icon">
            <Wallet size={18} color="#000" />
          </div>
          <span>Kikoba Smart</span>
        </Link>

        <button
          className="mobile-header-btn"
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-label="Profile"
        >
          <div className="mobile-avatar-small">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </button>
      </header>

      {/* User dropdown */}
      {showUserMenu && (
        <div className="mobile-user-menu" onClick={() => setShowUserMenu(false)}>
          <div className="mobile-user-menu-card" onClick={e => e.stopPropagation()}>
            {/* User info header */}
            <div className="mobile-user-info">
              <div className="mobile-avatar-lg">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{session?.user?.name || 'Mtumiaji'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session?.user?.email}</div>
              </div>
            </div>

            <div className="mobile-menu-divider" />

            <div className="mobile-menu-items">
              <Link href="/dashboard/profile" className="mobile-menu-item" onClick={() => setShowUserMenu(false)}>
                <UserCircle size={18} /> Wasifu Wangu
              </Link>
              <Link href="/dashboard/loans/vote" className="mobile-menu-item" onClick={() => setShowUserMenu(false)}>
                <Vote size={18} /> Piga Kura
              </Link>
              <Link href="/dashboard/group/activity" className="mobile-menu-item" onClick={() => setShowUserMenu(false)}>
                <Activity size={18} /> Shughuli
              </Link>
            </div>

            <div className="mobile-menu-divider" />

            <button className="mobile-menu-signout" onClick={handleSignOut}>
              <LogOut size={16} /> Toka
            </button>
          </div>
        </div>
      )}
    </>
  )
}
