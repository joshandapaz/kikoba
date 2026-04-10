'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileHeader from '@/components/MobileHeader'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="app-layout">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile: overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Header (hidden on desktop) */}
        <MobileHeader />

        <main className="main-content">
          {children}
        </main>

        {/* Bottom Nav (mobile only) */}
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
