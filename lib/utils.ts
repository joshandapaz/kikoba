import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatCurrency(amount: any): string {
  const value = typeof amount === 'number' ? amount : (parseFloat(String(amount)) || 0)
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('sw-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Sasa hivi'
  if (minutes < 60) return `Dakika ${minutes} zilizopita`
  if (hours < 24) return `Saa ${hours} zilizopita`
  return `Siku ${days} zilizopita`
}

export function getLoanStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PAID: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export function getLoanStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Inasubiri',
    APPROVED: 'Imeidhinishwa',
    REJECTED: 'Imekataliwa',
    PAID: 'Imelipwa',
  }
  return labels[status] || status
}

export function calculateLoanBalance(amount: number, interestRate: number, payments: { amount: number }[]): number {
  const totalWithInterest = amount + (amount * interestRate) / 100
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, totalWithInterest - totalPaid)
}
