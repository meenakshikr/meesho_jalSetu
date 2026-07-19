'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, Tanker } from '@/types'
import TankerCard from '@/components/TankerCard'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import MapView from '@/components/MapView'
import { ArrowLeft, Truck, MapPin, User as UserIcon, Droplets } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default function AssignTankerPage({ params }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [selectedTankerId, setSelectedTankerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dispatching, setDispatching] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingRes, tankerRes] = await Promise.all([
        fetch(`/api/bookings/${params.id}`),
        fetch('/api/tankers'),
      ])
      if (!bookingRes.ok) throw new Error('Failed to load booking')
      const bookingData: Booking = await bookingRes.json()
      setBooking(bookingData)

      if (tankerRes.ok) {
        const tankerData: Tanker[] = await tankerRes.json()
        setTankers(tankerData.filter(t => t.is_available))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDispatch() {
    if (!selectedTankerId || !booking) return
    setDispatching(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanker_id: selectedTankerId, status: 'dispatched' }),
      })
      if (!res.ok) throw new Error('Failed to dispatch tanker')
      router.push(`/coordinator/booking/${booking.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dispatch tanker')
    } finally {
      setDispatching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={2} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error ?? 'Booking not found'} onRetry={fetchData} />
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
        <h1 className="text-xl font-semibold text-white">Assign Tanker</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] md:max-w-3xl mx-auto space-y-3">
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Booking Summary</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Volume
                </span>
                <span className="text-white font-medium text-sm">{booking.volume_ordered}L</span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </span>
                <span className="text-white font-medium text-sm">{booking.delivery_address || 'Ward location'}</span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Requester
                </span>
                <span className="text-white font-medium text-sm">{booking.resident?.name ?? 'Community'}</span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Amount</span>
                <span className="text-teal-400 font-semibold text-sm">{formatINR(booking.total_amount)}</span>
              </div>
            </div>
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

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Available Tankers</p>
            <div className="space-y-3">
              {tankers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No tankers available right now.</p>
              ) : (
                tankers.map(tanker => (
                  <div
                    key={tanker.id}
                    onClick={() => setSelectedTankerId(tanker.id)}
                    className={`cursor-pointer transition-all duration-200 rounded-2xl ${
                      selectedTankerId === tanker.id ? 'ring-2 ring-teal-600' : 'opacity-80'
                    }`}
                  >
                    <TankerCard tanker={tanker} showAiReason />
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleDispatch}
            disabled={!selectedTankerId || dispatching}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Truck className="w-4 h-4" />
            {dispatching ? 'Dispatching...' : 'Dispatch Tanker'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
