import { use } from 'react'
import RepayLoanClient from './RepayLoanClient'

export default function RepayLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <RepayLoanClient id={id} />
}

export function generateStaticParams() {
  return [{ id: '1' }]
}
