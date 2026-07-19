'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, User } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR, getBookingStatusLabel } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, Truck, AlertTriangle, ChevronRight, Package } from 'lucide-react'

export default function BookingHistoryPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'cancelled'>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) throw new Error('Failed to load user')
      const profile: User = await userRes.json()

      if (profile.ward_id) {
        const bookRes = await fetch(`/api/bookings?ward_id=${profile.ward_id}&order=created_at.desc`)
        if (!bookRes.ok) throw new Error('Failed to load bookings')
        const data: Booking[] = await bookRes.json()
        setBookings(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={1} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const monthDelivered = bookings
    .filter(b => {
      const d = new Date(b.delivered_at ?? b.created_at)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && b.status === 'delivered'
    })
    .reduce((sum, b) => sum + (b.volume_delivered ?? b.volume_ordered), 0)

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'completed') return b.status === 'delivered'
    if (activeTab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  function getStatusBadge(status: string) {
    const base = 'text-xs font-medium px-2 py-0.5 rounded-md border '
    switch (status) {
      case 'delivered':
        return base + 'bg-emerald-950 text-emerald-400 border-emerald-900'
      case 'open':
      case 'confirmed':
        return base + 'bg-amber-950 text-amber-400 border-amber-900'
      case 'disputed':
        return base + 'bg-red-950 text-red-400 border-red-900'
      default:
        return base + 'bg-[#0A2744] text-slate-400 border-[#1E3A5F]'
    }
  }

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'completed' as const, label: 'Completed' },
    { key: 'cancelled' as const, label: 'Cancelled' },
  ]

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Booking History</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] md:max-w-3xl mx-auto space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Water Delivered (This Month)</p>
              <p className="text-2xl font-semibold text-teal-400">{monthDelivered}L</p>
            </div>
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Bookings</p>
              <p className="text-2xl font-semibold text-white">{bookings.length}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-xl h-10 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-teal-600 text-white'
                    : 'border border-[#1E3A5F] text-slate-400 hover:bg-[#0A2744]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No bookings found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(booking => {
                const isExpanded = expandedId === booking.id
                const participantCount = booking.participants?.length ?? 0
                const paidCount = booking.participants?.filter(p => p.payment_status === 'paid').length ?? 0

                return (
                  <div
                    key={booking.id}
                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                    className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 cursor-pointer hover:border-teal-600/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2">
                        <span className="bg-[#021B3A] text-slate-400 border border-[#1E3A5F] text-xs font-medium px-2 py-0.5 rounded-md">
                          {booking.type}
                        </span>
                        <span className={getStatusBadge(booking.status)}>
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(booking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-medium">{booking.volume_ordered}L</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400 font-semibold">{formatINR(booking.total_amount)}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#1E3A5F] space-y-2 text-sm">
                        {participantCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Participants</span>
                            <span className="text-white">{paidCount}/{participantCount} paid</span>
                          </div>
                        )}

                        {booking.volume_delivered && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volume Delivered</span>
                            <span className="text-white">{booking.volume_delivered}L</span>
                          </div>
                        )}

                        {booking.cv_confirmed !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">CV Confirmed</span>
                            <span className={booking.cv_confirmed ? 'text-emerald-400' : 'text-red-400'}>
                              {booking.cv_confirmed ? 'Yes' : 'No'}
                            </span>
                          </div>
                        )}

                        {booking.anomaly_flagged && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Anomaly</span>
                            <span className="bg-red-950 text-red-400 border border-red-900 text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Flagged
                            </span>
                          </div>
                        )}

                        {booking.anomaly_reason && (
                          <p className="text-red-400 text-xs">{booking.anomaly_reason}</p>
                        )}

                        {booking.tanker && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5" />
                              Tanker
                            </span>
                            <span className="text-white">{booking.tanker.operator_name} ({booking.tanker.vehicle_number})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
