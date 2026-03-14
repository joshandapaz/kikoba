'use client'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const LoanRequestClient = dynamic(() => import('./LoanRequestClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
      <Loader2 className="spinner" size={40} />
    </div>
  )
})

export default function RequestLoanPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Loader2 className="spinner" size={40} />
      </div>
    }>
      <LoanRequestClient />
    </Suspense>
  )
}
