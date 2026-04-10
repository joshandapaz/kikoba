'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PiggyBank, Users, UserCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    { href: '/dashboard', label: t('nav_home'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/savings', label: t('nav_savings'), icon: PiggyBank },
    { href: '/dashboard/group', label: t('nav_groups'), icon: Users },
    { href: '/dashboard/profile', label: t('nav_profile'), icon: UserCircle },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrapper">
              {active && <div className="bottom-nav-indicator" />}
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
