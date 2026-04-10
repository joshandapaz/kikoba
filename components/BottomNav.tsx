'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PiggyBank, HandCoins, Users, Vote } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Nyumbani', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/savings', label: 'Akiba', icon: PiggyBank },
  { href: '/dashboard/loans', label: 'Mikopo', icon: HandCoins },
  { href: '/dashboard/loans/vote', label: 'Kura', icon: Vote },
  { href: '/dashboard/group', label: 'Kikundi', icon: Users },
]

export default function BottomNav() {
  const pathname = usePathname()

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
