'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Tanker, User } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, Truck, Droplets, MapPin, CheckCircle, AlertTriangle, Crosshair } from 'lucide-react'

const VOLUME_PRESETS = [5000, 7500, 10000, 12000]
const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const
const DAY_OFFSETS = [
  { label: 'Today', value: 0 },
  { label: 'Tomorrow', value: 1 },
  { label: 'Day After', value: 2 },
]

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [tanker, setTanker] = useState<Tanker | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(5000)
  const [customVolume, setCustomVolume] = useState('')
  const [useSubsidy, setUseSubsidy] = useState(false)
  const [dayOffset, setDayOffset] = useState(1)
  const [timeSlot, setTimeSlot] = useState<typeof TIME_SLOTS[number]>('morning')
  const [address, setAddress] = useState('')
  const [booking, setBooking] = useState(false)
  const [anomalyResult, setAnomalyResult] = useState<{ is_anomaly: boolean; reason: string; percent_above: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`
          setAddress(addr)
        } catch {
          setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        } finally {
          setGeoLoading(false)
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [tankerRes, userRes] = await Promise.all([
        fetch(`/api/tankers/${id}`),
        fetch('/api/auth/me'),
      ])

      if (!tankerRes.ok) throw new Error('Failed to load tanker details')
      if (!userRes.ok) throw new Error('Failed to load profile')

      const tankerData: Tanker = await tankerRes.json()
      const userData: User = await userRes.json()

      setTanker(tankerData)
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData()
  }, [id])

  const effectiveVolume = customVolume ? parseInt(customVolume, 10) || 0 : volume
  const volumeInvalid = effectiveVolume < 5000 || effectiveVolume > 12000
  const price = tanker ? effectiveVolume * tanker.price_per_liter : 0
  const subsidyApplied = useSubsidy && user ? Math.min(user.subsidy_points, price) : 0
  const finalPrice = price - subsidyApplied

  const scheduledDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + DAY_OFFSETS.find((x) => x.value === dayOffset)!.value)
    return d.toISOString().split('T')[0]
  }, [dayOffset])

  const handleBooking = async () => {
    if (!tanker || !address || effectiveVolume <= 0 || volumeInvalid) return
    try {
      setBooking(true)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanker_id: tanker.id,
          type: 'individual',
          volume_ordered: effectiveVolume,
          delivery_address: address,
          scheduled_at: `${scheduledDate}T${timeSlot === 'morning' ? '09:00' : timeSlot === 'afternoon' ? '14:00' : '18:00'}:00Z`,
          use_subsidy_points: useSubsidy,
        }),
      })
      if (!res.ok) throw new Error('Failed to create booking')
      const data = await res.json()

      try {
        const anomalyRes = await fetch('/api/ai/anomaly-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: data.id }),
        })
        if (anomalyRes.ok) {
          const result = await anomalyRes.json()
          if (result.is_anomaly) setAnomalyResult(result)
        }
      } catch {}

      router.push(`/resident/payment/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error || !tanker) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <ErrorState message={error || 'Tanker not found'} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Book Water</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-white">{tanker.operator_name}</p>
              <p className="text-xs text-slate-400">{tanker.vehicle_number}</p>
            </div>
            {tanker.is_certified && (
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-lg">Certified</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Capacity: {tanker.capacity_liters}L at {formatINR(tanker.price_per_liter)}/L
          </p>
        </div>

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Select Volume</p>
          <div className="flex gap-2 mb-3">
            {VOLUME_PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setVolume(v)
                  setCustomVolume('')
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  volume === v && !customVolume
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#0A2744] border border-[#1E3A5F] text-slate-200 hover:bg-[#0D2D4F]'
                }`}
              >
                {v}L
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Custom volume (5000–12000L)"
            value={customVolume}
            onChange={(e) => setCustomVolume(e.target.value)}
            min={5000}
            max={12000}
            className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">Min 5000L — Max 12000L</p>
        </div>

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Price</p>
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>{effectiveVolume}L at {formatINR(tanker.price_per_liter)}/L</span>
            <span className="text-white">{formatINR(price)}</span>
          </div>
          {user && user.subsidy_points > 0 && (
            <div className="mt-3 pt-3 border-t border-[#1E3A5F]">
              <button
                onClick={() => setUseSubsidy(!useSubsidy)}
                className="flex items-center gap-2 w-full"
              >
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    useSubsidy ? 'bg-teal-600 border-teal-600' : 'border-slate-500'
                  }`}
                >
                  {useSubsidy && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-slate-200">Use subsidy points ({user.subsidy_points} pts)</span>
              </button>
            </div>
          )}
          {subsidyApplied > 0 && (
            <div className="flex justify-between text-sm text-emerald-400 mt-2">
              <span>Subsidy discount</span>
              <span>-{formatINR(subsidyApplied)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-white mt-2 pt-2 border-t border-[#1E3A5F]">
            <span>Total</span>
            <span className="text-teal-400">{formatINR(finalPrice)}</span>
          </div>
        </div>

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Schedule Delivery</p>
          <div className="flex gap-2 mb-3">
            {DAY_OFFSETS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDayOffset(d.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                  dayOffset === d.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#0A2744] border border-[#1E3A5F] text-slate-400 hover:bg-[#0D2D4F]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setTimeSlot(slot)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                  timeSlot === slot
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#0A2744] border border-[#1E3A5F] text-slate-400 hover:bg-[#0D2D4F]'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Delivery Address</p>
            <button
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50"
            >
              <Crosshair className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
              {geoLoading ? 'Detecting...' : 'Auto-detect'}
            </button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <textarea
              placeholder="Enter your delivery address or tap Auto-detect"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-teal-600 w-full text-sm resize-none"
            />
          </div>
        </div>

        {anomalyResult && anomalyResult.is_anomaly && (
          <div className="bg-red-950 border border-red-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Price Alert Detected</span>
            </div>
            <p className="text-xs text-red-300">{anomalyResult.reason}</p>
            <p className="text-xs text-slate-500 mt-1">
              You can still proceed. This has been flagged for review.
            </p>
          </div>
        )}

        <button
          disabled={booking || !address || effectiveVolume <= 0 || volumeInvalid}
          onClick={handleBooking}
          className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Droplets className="w-4 h-4" />
          {volumeInvalid ? 'Volume must be 5000–12000L' : booking ? 'Booking...' : `Confirm Booking — ${formatINR(finalPrice)}`}
        </button>
      </motion.div>
    </div>
  )
}