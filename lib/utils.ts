import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { HeatwaveSeverity, BookingStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBillSplit(
  totalAmount: number,
  totalVolume: number,
  participants: { user_id: string; share_liters: number }[]
): { user_id: string; share_liters: number; share_amount: number }[] {
  return participants.map(p => ({
    ...p,
    share_amount: Math.round((p.share_liters / totalVolume) * totalAmount * 100) / 100,
  }))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getHeatwaveSeverityColor(severity: HeatwaveSeverity): string {
  const map: Record<HeatwaveSeverity, string> = { watch: '#F59E0B', warning: '#F97316', emergency: '#EF4444' }
  return map[severity]
}

export function getHeatwaveSeverityLabel(severity: HeatwaveSeverity): string {
  const map: Record<HeatwaveSeverity, string> = { watch: 'हीटवेव वॉच', warning: 'हीटवेव चेतावनी', emergency: 'अति गंभीर' }
  return map[severity]
}

export function getBookingStatusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: 'Pending',
    open: 'Open for joining',
    confirmed: 'Confirmed',
    dispatched: 'On the way',
    delivered: 'Delivered',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  }
  return map[status]
}

export function getBookingStatusColor(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: '#94A3B8',
    open: '#06B6D4',
    confirmed: '#0D9488',
    dispatched: '#F59E0B',
    delivered: '#22C55E',
    disputed: '#EF4444',
    cancelled: '#64748B',
  }
  return map[status]
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function estimateDaysRemaining(
  lastBookingDate: string,
  volumeOrdered: number,
  householdSize: number
): number {
  const dailyConsumption = householdSize * 50
  const daysSinceBooking = Math.floor(
    (Date.now() - new Date(lastBookingDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const remaining = volumeOrdered - daysSinceBooking * dailyConsumption
  return Math.max(0, Math.floor(remaining / dailyConsumption))
}
