import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return 'Rp ' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return formatCurrency(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${formatDate(d)} ${hours}:${minutes}`
}

export function formatNumber(n: number): string {
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    settled: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-emerald-100 text-emerald-700',
    approved: 'bg-emerald-100 text-emerald-700',
    active: 'bg-emerald-100 text-emerald-700',
    matched: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    'pending_approval': 'bg-amber-100 text-amber-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    processing: 'bg-blue-100 text-blue-700',
    verified: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    overdue: 'bg-red-100 text-red-700',
    disputed: 'bg-red-100 text-red-700',
    unmatched: 'bg-red-100 text-red-700',
    revision: 'bg-orange-100 text-orange-700',
    inactive: 'bg-gray-100 text-gray-600',
    received: 'bg-gray-100 text-gray-600',
    discrepancy: 'bg-purple-100 text-purple-700',
  }
  return map[status.toLowerCase()] || 'bg-gray-100 text-gray-600'
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h]
      const str = String(val ?? '')
      return str.includes(',') ? `"${str}"` : str
    }).join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
