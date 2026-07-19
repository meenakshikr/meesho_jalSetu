'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User, Booking, Tanker } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, Truck, CheckCircle, Droplets } from 'lucide-react'

export default function DriverHistoryPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) throw new Error('Failed to load profile')
      const profile: User = await userRes.json()

      const tankerRes = await fetch('/api/tankers')
      if (!tankerRes.ok) throw new Error('Failed to load tankers')
      const tankers: Tanker[] = await tankerRes.json()
      const driverTanker = tankers.find(t => t.driver_id === profile.id)
      if (!driverTanker) {
        setBookings([])
        return
      }

      const bookingRes = await fetch('/api/bookings?status=delivered')
      if (!bookingRes.ok) throw new Error('Failed to load bookings')
      const allBookings: Booking[] = await bookingRes.json()
      const myBookings = allBookings.filter(b => b.tanker_id === driverTanker.id)
      setBookings(myBookings)
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
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Delivery History</h1>
          </div>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="max-w-[430px] mx-auto space-y-3">
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Delivery History</h1>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="max-w-[430px] mx-auto">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Delivery History</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] mx-auto space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full border border-[#1E3A5F] flex items-center justify-center">
                <Truck className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No Delivery History</p>
              <p className="text-sm text-slate-400">Completed deliveries will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">
                      {booking.resident?.name ?? 'Customer'}
                    </span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md">
                      Delivered
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    {new Date(booking.delivered_at ?? booking.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-teal-400" />
                      <span className="text-sm font-semibold text-teal-400">
                        {booking.volume_delivered ?? booking.volume_ordered}L
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        {formatINR(booking.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
