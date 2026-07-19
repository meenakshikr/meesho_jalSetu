'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tanker, User } from '@/types'
import TankerCard from '@/components/TankerCard'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'

export default function CreateBookingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [selectedTanker, setSelectedTanker] = useState<Tanker | null>(null)
  const [totalVolume, setTotalVolume] = useState('')
  const [bookingOpenUntil, setBookingOpenUntil] = useState('')
  const [householdCount, setHouseholdCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [userRes, tankerRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/tankers'),
      ])
      if (!userRes.ok || !tankerRes.ok) throw new Error('Failed to load data')
      const profile: User = await userRes.json()
      setUser(profile)
      const tankerData: Tanker[] = await tankerRes.json()
      setTankers(tankerData.filter(t => t.is_available))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTanker || !totalVolume || !bookingOpenUntil || !user?.ward_id) return

    setSubmitting(true)
    setError(null)
    try {
      const totalAmount = Number(totalVolume) * selectedTanker.price_per_liter
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'community',
          status: 'open',
          tanker_id: selectedTanker.id,
          ward_id: user.ward_id,
          volume_ordered: Number(totalVolume),
          price_per_liter: selectedTanker.price_per_liter,
          total_amount: totalAmount,
          delivery_address: '',
          scheduled_at: new Date(bookingOpenUntil).toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to create booking')
      const booking = await res.json()
      router.push(`/coordinator/booking/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setSubmitting(false)
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

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      </div>
    )
  }

  const volumeNum = Number(totalVolume) || 0
  const volumeInvalid = volumeNum > 0 && (volumeNum < 5000 || volumeNum > 12000)
  const estCostPerHH = selectedTanker && householdCount > 0
    ? (volumeNum * selectedTanker.price_per_liter) / householdCount
    : 0

  return (
    <div className="min-h-screen bg-[#021B3A] px-4 py-6">
      <div className="max-w-[430px] md:max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Create Community Booking</h1>
        <p className="text-sm text-slate-400 mb-6">Select a tanker and set your booking details</p>

        {error && (
          <div className="bg-red-950 border border-red-900 rounded-xl p-3 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Available Tankers
            </label>
            <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
              {tankers.map(tanker => (
                <div
                  key={tanker.id}
                  onClick={() => setSelectedTanker(tanker)}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedTanker?.id === tanker.id ? 'ring-2 ring-[#0D9488] rounded-xl' : 'opacity-80'
                  }`}
                >
                  <TankerCard tanker={tanker} />
                </div>
              ))}
              {tankers.length === 0 && (
                <p className="text-sm text-slate-400">No tankers available right now.</p>
              )}
            </div>
          </div>

          <div className="h-px bg-[#1E3A5F]" />

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Total Volume Required (Liters)
            </label>
            <input
              type="number"
              value={totalVolume}
              onChange={e => setTotalVolume(e.target.value)}
              className="w-full bg-[#0A2744] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              placeholder="e.g. 10000"
              min={5000}
              max={12000}
              required
            />
            <p className="text-xs text-slate-500 mt-1">Min 5000L — Max 12000L</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Booking Open Until
            </label>
            <input
              type="datetime-local"
              value={bookingOpenUntil}
              onChange={e => setBookingOpenUntil(e.target.value)}
              className="w-full bg-[#0A2744] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              required
            />
          </div>

          {selectedTanker && volumeNum > 0 && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Estimated Cost per Household</p>
              <p className="text-lg font-semibold text-[#0D9488]">
                {householdCount > 0 ? formatINR(estCostPerHH) : 'Enter household count'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Total: {formatINR(volumeNum * selectedTanker.price_per_liter)} @ {formatINR(selectedTanker.price_per_liter)}/L
              </p>
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Households in ward
                </label>
                <input
                  type="number"
                  value={householdCount}
                  onChange={e => setHouseholdCount(Number(e.target.value))}
                  className="w-full bg-[#0A2744] border border-[#1E3A5F] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  placeholder="Number of households"
                  min="1"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedTanker || !totalVolume || !bookingOpenUntil || volumeInvalid}
            className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg h-12 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : volumeInvalid ? 'Volume must be 5000–12000L' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
