'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useBooking } from '@/hooks/useBooking'
import { BillSplitItem, DriverLocation } from '@/types'
import BillSplit from '@/components/BillSplit'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR, getBookingStatusLabel } from '@/lib/utils'
import { Radio, Truck } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Props {
  params: { id: string }
}

export default function ActiveBookingPage({ params }: Props) {
  const router = useRouter()
  const { booking, loading, error, refetch } = useBooking(params.id)
  const [closing, setClosing] = useState(false)
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [driverName, setDriverName] = useState<string>('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const participants = booking?.participants ?? []

  async function fetchDriverLocation() {
    if (!booking?.driver_id) return
    try {
      const res = await fetch(`/api/driver/location/${booking.driver_id}`)
      if (!res.ok) return
      const data: { location: DriverLocation | null } = await res.json()
      if (data.location) {
        setDriverLoc({ lat: data.location.lat, lng: data.location.lng })
      }
    } catch { }
  }

  useEffect(() => {
    if (booking?.driver_id) {
      fetchDriverLocation()
      if (booking.status === 'confirmed' || booking.status === 'dispatched') {
        pollRef.current = setInterval(fetchDriverLocation, 5000)
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [booking?.driver_id, booking?.status])

  useEffect(() => {
    if (booking?.driver) {
      setDriverName(booking.driver.name || '')
    }
  }, [booking?.driver])

  async function handleCloseBooking() {
    if (!booking) return
    setClosing(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (!res.ok) throw new Error('Failed to close booking')
      router.push(`/coordinator/delivery/${params.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close booking')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={2} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="list" lines={3} />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error ?? 'Booking not found'} onRetry={refetch} />
        </div>
      </div>
    )
  }

  const participantCount = participants.length
  const targetCount = Math.max(1, Math.ceil((booking.volume_ordered ?? 0) / 1000))
  const progressPct = Math.min(100, Math.round((participantCount / targetCount) * 100))

  const billSplitItems: BillSplitItem[] = participants.map(p => ({
    user_id: p.user_id,
    name: p.user?.name ?? 'Unknown',
    share_liters: p.share_liters,
    share_amount: p.share_amount,
    payment_status: p.payment_status,
  }))

  const showTracking = booking.driver_id && (booking.status === 'confirmed' || booking.status === 'dispatched')
  const hasDeliveryCoords = booking.delivery_lat && booking.delivery_lng

  return (
    <div className="min-h-screen bg-[#021B3A] px-4 py-6">
      <div className="max-w-[430px] md:max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 border border-[#1E3A5F] text-slate-200 hover:bg-[#0A2744] rounded-lg h-12 px-4 text-sm font-medium transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Community Booking</h1>
            <p className="text-xs text-slate-400">ID: {booking.id.slice(0, 8)}...</p>
          </div>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md">
            {getBookingStatusLabel(booking.status)}
          </span>
        </div>

          <div className="space-y-3">
          {showTracking && hasDeliveryCoords && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-[#1E3A5F] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-medium text-white">Live Tracking</span>
                </div>
                {driverLoc && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {driverName ? `${driverName} — ` : ''}On the way
                  </div>
                )}
                {!driverLoc && (
                  <span className="text-xs text-slate-400">Waiting for driver...</span>
                )}
              </div>
              <MapView
                lat={booking.delivery_lat!}
                lng={booking.delivery_lng!}
                zoom={13}
                markers={[
                  { lat: booking.delivery_lat!, lng: booking.delivery_lng!, label: 'Delivery point', color: '#EF4444' },
                ]}
                driverLocation={driverLoc || undefined}
                height={220}
              />
            </div>
          )}

          {!showTracking && hasDeliveryCoords && (
            <MapView
              lat={booking.delivery_lat!}
              lng={booking.delivery_lng!}
              zoom={14}
              markers={[{ lat: booking.delivery_lat!, lng: booking.delivery_lng!, label: booking.delivery_address || 'Delivery location' }]}
              className="h-48"
            />
          )}

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-slate-400">Volume Ordered</p>
                <p className="text-lg font-semibold text-white">{booking.volume_ordered}L</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Amount</p>
                <p className="text-lg font-semibold text-[#0D9488]">{formatINR(booking.total_amount)}</p>
              </div>
            </div>

            <div className="mb-1">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{participantCount} participants joined</span>
                <span>{targetCount} target</span>
              </div>
              <div className="w-full bg-[#1E3A5F] rounded-full h-1.5">
                <div
                  className="bg-[#0D9488] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {booking.driver && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Assigned Driver</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{booking.driver.name}</p>
                  <p className="text-xs text-slate-400">{booking.driver.phone}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Bill Split</h2>
            {billSplitItems.length > 0 ? (
              <BillSplit
                items={billSplitItems}
                totalAmount={booking.total_amount}
                totalVolume={booking.volume_ordered}
              />
            ) : (
              <p className="text-sm text-slate-400">No participants yet.</p>
            )}
          </div>

          {booking.status === 'open' && (
            <button
              onClick={handleCloseBooking}
              disabled={closing}
              className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg h-12 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {closing ? 'Closing...' : 'Close Booking & Dispatch Tanker'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
