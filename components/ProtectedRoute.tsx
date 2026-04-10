'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })

    // Also listen for auth state changes (e.g., token expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          width: 48, height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#FFF',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Inapakia...</p>
      </div>
    )
  }

  return <>{children}</>
}
