'use client'

import { useRouter, useParams } from 'next/navigation'
import { useBooking } from '@/hooks/useBooking'
import BookingStatusTimeline from '@/components/BookingStatus'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import MapView from '@/components/MapView'
import { ArrowLeft, Clock, Phone, ChevronRight } from 'lucide-react'

export default function TrackingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { booking, loading, error, refetch } = useBooking(id)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <ErrorState message={error || 'Booking not found'} onRetry={refetch} />
        </div>
      </div>
    )
  }

  const eta = booking.scheduled_at
    ? new Date(booking.scheduled_at).toLocaleString('en-IN', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Track Delivery</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${
              booking.status === 'delivered'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                : booking.status === 'dispatched'
                ? 'bg-amber-950 text-amber-400 border-amber-900'
                : booking.status === 'confirmed'
                ? 'bg-teal-950 text-teal-400 border-teal-900'
                : 'bg-[#0A2744] text-slate-400 border-[#1E3A5F]'
            }`}>
              {booking.status}
            </span>
          </div>
          <BookingStatusTimeline status={booking.status} />
        </div>

        {booking.delivery_lat && booking.delivery_lng && (
          <MapView
            lat={booking.delivery_lat}
            lng={booking.delivery_lng}
            zoom={14}
            markers={[{ lat: booking.delivery_lat, lng: booking.delivery_lng, label: booking.delivery_address || 'Delivery location' }]}
            className="h-48"
          />
        )}

        {eta && (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-400">Estimated Delivery</p>
            </div>
            <p className="text-base font-semibold text-white">{eta}</p>
          </div>
        )}

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Volume</span>
              <span className="text-sm text-white">{booking.volume_ordered}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Amount</span>
              <span className="text-sm text-white">{formatINR(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-400">Address</span>
              <span className="text-xs text-white text-right max-w-[60%]">{booking.delivery_address}</span>
            </div>
          </div>
        </div>

        {booking.tanker?.driver?.phone && (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Contact Driver</p>
            <p className="text-xs text-slate-400 mb-3">{booking.tanker.driver.name || 'Driver'}</p>
            <button
              onClick={() => {
                window.location.href = `tel:${booking.tanker!.driver!.phone}`
              }}
              className="w-full border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Driver
            </button>
          </div>
        )}

        {booking.status === 'delivered' && (
          <button
            onClick={() => router.push(`/resident/delivery/${booking.id}`)}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            View Delivery Details
          </button>
        )}
      </motion.div>
    </div>
  )
}