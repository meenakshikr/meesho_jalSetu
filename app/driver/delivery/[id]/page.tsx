'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Booking } from '@/types'
import CVScanner from '@/components/CVScanner'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, AlertTriangle, MapPin, Droplets, Navigation, Radio } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Props {
  params: { id: string }
}

export default function ActiveDeliveryPage({ params }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cvResult, setCvResult] = useState<{
    volume_estimate: number
    estimated_liters: number
    confidence: number
    verdict: string
    discrepancy_liters: number
    before_fill_percent?: number
    after_fill_percent?: number
  } | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([])
  const [tracking, setTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBooking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${params.id}`)
      if (!res.ok) throw new Error('Failed to load booking')
      const data: Booking = await res.json()
      setBooking(data)

      if (data.delivery_lat && data.delivery_lng && data.tanker?.current_lat && data.tanker?.current_lng) {
        fetchRoute(
          { lat: data.tanker.current_lat, lng: data.tanker.current_lng },
          { lat: data.delivery_lat, lng: data.delivery_lng }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  async function fetchRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      if (data.routes?.[0]?.geometry?.coordinates) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => ({ lat: c[1], lng: c[0] })
        )
        setRouteCoords(coords)
      }
    } catch { }
  }

  function startTracking() {
    if (!navigator.geolocation || !booking) return

    setTracking(true)

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setDriverLoc(loc)
      },
      () => { },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    watchIdRef.current = id

    pingIntervalRef.current = setInterval(async () => {
      if (!navigator.geolocation || !booking) return
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await fetch('/api/driver/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                driver_id: booking.driver_id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                booking_id: booking.id,
              }),
            })
          } catch { }
        },
        () => { },
        { enableHighAccuracy: true }
      )
    }, 5000)
  }

  function stopTracking() {
    setTracking(false)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }

  useEffect(() => {
    fetchBooking()
    return () => stopTracking()
  }, [fetchBooking])

  async function handleCVScan(beforeFile?: File, afterFile?: File) {
    setCvLoading(true)
    try {
      const formData = new FormData()
      formData.append('booking_id', params.id)
      formData.append('volume_ordered', String(booking?.volume_ordered || 2000))
      formData.append('tank_capacity', String(booking?.tanker?.capacity_liters || 5000))
      if (beforeFile) formData.append('before_image', beforeFile)
      if (afterFile) formData.append('after_image', afterFile)
      const res = await fetch('/api/ai/cv-volume', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('CV scan failed')
      const data = await res.json()
      const confidenceMap: Record<string, number> = { high: 0.9, medium: 0.65, low: 0.3 }
      setCvResult({
        volume_estimate: data.estimated_liters ?? data.volume_estimate ?? 0,
        estimated_liters: data.estimated_liters ?? 0,
        confidence: typeof data.confidence === 'number' ? data.confidence : (confidenceMap[data.confidence] ?? 0.5),
        verdict: data.verdict ?? 'confirmed',
        discrepancy_liters: data.discrepancy_liters ?? 0,
        before_fill_percent: data.before_fill_percent,
        after_fill_percent: data.after_fill_percent,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'CV scan failed')
    } finally {
      setCvLoading(false)
    }
  }

  async function handleDispute() {
    setDisputing(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disputed' }),
      })
      if (!res.ok) throw new Error('Failed to dispute')
      router.push('/driver')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dispute')
    } finally {
      setDisputing(false)
    }
  }

  function openNavigation() {
    if (!booking?.delivery_lat || !booking?.delivery_lng) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${booking.delivery_lat},${booking.delivery_lng}`,
      '_blank'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Delivery</h1>
          </div>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="max-w-[430px] mx-auto space-y-3">
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="button" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Delivery</h1>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="max-w-[430px] mx-auto">
            <ErrorState message={error ?? 'Booking not found'} onRetry={fetchBooking} />
          </div>
        </div>
      </div>
    )
  }

  const hasCoords = booking.delivery_lat && booking.delivery_lng

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Delivery</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] mx-auto space-y-3">
          {hasCoords && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl overflow-hidden">
              <MapView
                lat={booking.delivery_lat!}
                lng={booking.delivery_lng!}
                zoom={13}
                markers={driverLoc ? [] : [{ lat: booking.delivery_lat!, lng: booking.delivery_lng!, label: 'Delivery', color: '#EF4444' }]}
                route={routeCoords}
                driverLocation={driverLoc || undefined}
                height={220}
              />
              <div className="p-3 flex items-center gap-2">
                <button
                  onClick={tracking ? stopTracking : startTracking}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-colors ${
                    tracking
                      ? 'bg-red-950 border border-red-900 text-red-400'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  {tracking ? (
                    <>
                      <Radio className="w-4 h-4 animate-pulse" />
                      Stop Tracking
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      Start GPS Tracking
                    </>
                  )}
                </button>
                <button
                  onClick={openNavigation}
                  disabled={!hasCoords}
                  className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </button>
              </div>
              {tracking && (
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live location sharing active
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-1">Customer</p>
            <p className="text-sm font-semibold text-white mb-3">
              {booking.resident?.name ?? 'Customer'}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="leading-snug">{booking.delivery_address}</span>
            </div>
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-1">Volume Ordered</p>
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-5 h-5 text-teal-400" />
              <p className="text-3xl font-bold text-teal-400">
                {booking.volume_ordered}L
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {formatINR(booking.total_amount)}
            </p>
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-3 font-medium">Volume Verification</p>
            <CVScanner
              onCapture={handleCVScan}
              result={cvResult}
              loading={cvLoading}
            />
          </div>

          {cvResult && cvResult.verdict === 'short' && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <p className="text-sm font-semibold text-amber-400">
                  Short Delivery Detected
                </p>
              </div>
              <div className="space-y-1 mb-4">
                {cvResult.before_fill_percent != null && cvResult.after_fill_percent != null && (
                  <p className="text-sm text-slate-400">
                    Tank went from {cvResult.before_fill_percent}% to {cvResult.after_fill_percent}%
                  </p>
                )}
                <p className="text-sm text-slate-400">
                  Delivered: {cvResult.estimated_liters}L of {booking.volume_ordered}L ordered
                </p>
                <p className="text-sm text-slate-400">
                  Short by: {Math.abs(cvResult.discrepancy_liters)}L
                </p>
                <p className="text-sm text-slate-400">
                  Confidence: {(cvResult.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <button
                onClick={handleDispute}
                disabled={disputing}
                className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                {disputing ? 'Filing Dispute...' : 'File Dispute'}
              </button>
            </div>
          )}

          {cvResult && cvResult.verdict === 'confirmed' && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">
                  Volume Verified
                </p>
              </div>
              <div className="space-y-1 mb-4">
                {cvResult.before_fill_percent != null && cvResult.after_fill_percent != null && (
                  <p className="text-sm text-slate-400">
                    Tank went from {cvResult.before_fill_percent}% to {cvResult.after_fill_percent}%
                  </p>
                )}
                <p className="text-sm text-slate-400">
                  Delivered: {cvResult.estimated_liters}L
                </p>
                <p className="text-sm text-slate-400">
                  Confidence: {(cvResult.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <button
                onClick={() => router.push(`/driver/confirm/${booking.id}`)}
                className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Delivery
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
