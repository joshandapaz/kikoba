import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import LoanRequestClient from './LoanRequestClient'

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
