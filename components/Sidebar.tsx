'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, PiggyBank, HandCoins, Users,
  Activity, UserCircle, LogOut, Wallet,
  ChevronRight, Shield, FileBarChart, Vote
} from 'lucide-react'

const memberNav = [
  {
    section: 'Mwanzo',
    items: [
      { href: '/dashboard', label: 'Dashibodi', icon: LayoutDashboard },
    ]
  },
  {
    section: 'Fedha',
    items: [
      { href: '/dashboard/savings', label: 'Akiba', icon: PiggyBank },
      { href: '/dashboard/loans', label: 'Mikopo Yangu', icon: HandCoins },
      { href: '/dashboard/loans/request', label: 'Omba Mkopo', icon: ChevronRight },
      { href: '/dashboard/loans/vote', label: 'Piga Kura', icon: Vote },
    ]
  },
  {
    section: 'Kikundi',
    items: [
      { href: '/dashboard/group', label: 'Kikundi Changu', icon: Users },
      { href: '/dashboard/group/activity', label: 'Shughuli', icon: Activity },
    ]
  },
  {
    section: 'Akaunti',
    items: [
      { href: '/dashboard/profile', label: 'Wasifu Wangu', icon: UserCircle },
    ]
  }
]

const adminNav = [
  {
    section: 'Usimamizi',
    items: [
      { href: '/dashboard/admin/members', label: 'Wanachama', icon: Shield },
      { href: '/dashboard/admin/report', label: 'Ripoti za Fedha', icon: FileBarChart },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Wallet size={24} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', letterSpacing: '-0.5px' }}>Kikoba Smart</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Premium Savings</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {memberNav.map((section) => (
          <div key={section.section} style={{ marginBottom: 24 }}>
            <p className="nav-section-title" style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 16 }}>{section.section}</p>
            {section.items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Admin section */}
        {adminNav.map((section) => (
          <div key={section.section}>
            <p className="nav-section-title" style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 16 }}>{section.section}</p>
            {section.items.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '24px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.name || 'Mtumiaji'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
        >
          <LogOut size={16} />
          Toka
        </button>
      </div>

    </aside>
  )
}
