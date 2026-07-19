'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase-client'
import { User } from '@/types'
import { formatINR } from '@/lib/utils'
import {
  Users,
  Droplets,
  Clock,
  ChevronLeft,
  Check,
  Banknote,
  Smartphone,
  Loader2,
  AlertCircle,
  UserPlus,
  ArrowRight,
} from 'lucide-react'

interface CommunityBooking {
  id: string
  volume_ordered: number
  price_per_liter: number
  scheduled_at: string
  status: string
  coordinator: { id: string; name: string; phone: string } | null
  tanker: { id: string; operator_name: string; capacity_liters: number; vehicle_number: string } | null
  participant_count: number
  my_participation: { id: string; share_liters: number; payment_status: string } | null
}

type View = 'list' | 'join' | 'success'

export default function CommunityBookingPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [bookings, setBookings] = useState<CommunityBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedBooking, setSelectedBooking] = useState<CommunityBooking | null>(null)
  const [volumeLiters, setVolumeLiters] = useState(500)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'points'>('upi')
  const [joining, setJoining] = useState(false)
  const [joinedCount, setJoinedCount] = useState(0)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) throw new Error('Not authenticated')
        const data = await res.json()
        setUser(data)
      } catch {
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/community-bookings')
      if (!res.ok) throw new Error('Failed to load bookings')
      const data = await res.json()
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) fetchBookings()
  }, [authLoading, user, fetchBookings])

  useEffect(() => {
    if (!selectedBooking) return
    setJoinedCount(selectedBooking.participant_count)

    const channel = supabase
      .channel(`community_booking_${selectedBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_participants',
          filter: `booking_id=eq.${selectedBooking.id}`,
        },
        () => {
          setJoinedCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedBooking?.id, supabase])

  const shareAmount = selectedBooking
    ? Math.round(volumeLiters * selectedBooking.price_per_liter * 100) / 100
    : 0

  const handleJoin = async () => {
    if (!selectedBooking) return
    setJoining(true)

    try {
      const joinRes = await fetch(`/api/bookings/${selectedBooking.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_liters: volumeLiters }),
      })

      if (!joinRes.ok) {
        const errData = await joinRes.json()
        throw new Error(errData.error || 'Failed to join booking')
      }

      await joinRes.json()

      const payRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          amount: shareAmount,
          method: paymentMethod,
        }),
      })

      if (!payRes.ok) {
        const errData = await payRes.json()
        throw new Error(errData.error || 'Payment failed')
      }

      setView('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setJoining(false)
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#0D9488] animate-spin" />
      </div>
    )
  }

  if (view === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-20 h-20 rounded-full bg-[#0D9488]/20 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-[#0D9488]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Joined Successfully!</h1>
        <p className="text-slate-400 text-center mb-2">
          Your {volumeLiters}L share ({formatINR(shareAmount)}) has been recorded.
        </p>
        <p className="text-slate-500 text-sm text-center mb-8">
          You&apos;ll be notified when the tanker is dispatched.
        </p>
        <button
          onClick={() => {
            setView('list')
            setSelectedBooking(null)
            fetchBookings()
          }}
          className="px-6 py-3 bg-[#0D9488] text-white rounded-xl font-medium"
        >
          Back to Bookings
        </button>
      </div>
    )
  }

  if (view === 'join' && selectedBooking) {
    return (
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-slate-400 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white mb-1">Join Community Booking</h1>
        <p className="text-slate-400 text-sm mb-6">Select your share and payment method</p>

        <div className="bg-[#0A1628] rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <p className="text-white font-medium">{selectedBooking.coordinator?.name || 'Coordinator'}</p>
              <p className="text-slate-500 text-xs">{selectedBooking.tanker?.operator_name || 'Tanker'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#021B3A] rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Volume Ordered</p>
              <p className="text-white font-medium">{selectedBooking.volume_ordered}L</p>
            </div>
            <div className="bg-[#021B3A] rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Price / Liter</p>
              <p className="text-white font-medium">{formatINR(selectedBooking.price_per_liter)}</p>
            </div>
            <div className="bg-[#021B3A] rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Joined</p>
              <p className="text-white font-medium">{joinedCount} households</p>
            </div>
            <div className="bg-[#021B3A] rounded-xl p-3">
              <p className="text-slate-500 text-xs mb-1">Scheduled</p>
              <p className="text-white font-medium">
                {new Date(selectedBooking.scheduled_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-2xl p-5 mb-4">
          <p className="text-white font-medium mb-3">Your Share (Liters)</p>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setVolumeLiters(Math.max(100, volumeLiters - 100))}
              className="w-10 h-10 rounded-xl bg-[#021B3A] text-white flex items-center justify-center text-lg font-bold"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold text-white">{volumeLiters}</span>
              <span className="text-slate-400 text-sm ml-1">L</span>
            </div>
            <button
              onClick={() => setVolumeLiters(Math.min(5000, volumeLiters + 100))}
              className="w-10 h-10 rounded-xl bg-[#021B3A] text-white flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={volumeLiters}
            onChange={(e) => setVolumeLiters(Number(e.target.value))}
            className="w-full accent-[#0D9488]"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>100L</span>
            <span>5000L</span>
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-2xl p-5 mb-4">
          <p className="text-white font-medium mb-3">Payment Method</p>
          <div className="space-y-2">
            {[
              { key: 'upi' as const, label: 'UPI', icon: Smartphone, desc: 'Pay via Razorpay' },
              { key: 'cash' as const, label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when water arrives' },
              { key: 'points' as const, label: 'Subsidy Points', icon: Banknote, desc: 'Use government subsidy' },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setPaymentMethod(m.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  paymentMethod === m.key
                    ? 'bg-[#0D9488]/20 border border-[#0D9488]'
                    : 'bg-[#021B3A] border border-transparent'
                }`}
              >
                <m.icon className={`w-5 h-5 ${paymentMethod === m.key ? 'text-[#0D9488]' : 'text-slate-500'}`} />
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${paymentMethod === m.key ? 'text-[#0D9488]' : 'text-white'}`}>
                    {m.label}
                  </p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
                {paymentMethod === m.key && <Check className="w-4 h-4 text-[#0D9488]" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Your Share Amount</span>
            <span className="text-2xl font-bold text-[#0D9488]">{formatINR(shareAmount)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-3 bg-[#0D9488] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Join & Pay {formatINR(shareAmount)}
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Community Bookings</h1>
        <p className="text-slate-400 text-sm">Join neighbours to save on tanker costs</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0A1628] rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-slate-700 rounded-xl" />
                <div className="h-14 bg-slate-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-6 py-2 bg-[#0D9488] text-white rounded-xl text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
            <Droplets className="w-8 h-8 text-[#0D9488]" />
          </div>
          <p className="text-white font-medium mb-1">No open bookings</p>
          <p className="text-slate-500 text-sm text-center">
            There are no community bookings open in your ward right now.
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-[#0A1628] rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488]/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{booking.coordinator?.name || 'Coordinator'}</p>
                  <p className="text-slate-500 text-xs">{booking.tanker?.operator_name || 'Tanker'}</p>
                </div>
                {booking.my_participation ? (
                  <span className="px-3 py-1 bg-[#0D9488]/20 text-[#0D9488] text-xs font-medium rounded-lg">
                    Joined
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-lg">
                    Open
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-[#021B3A] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">Volume</p>
                  </div>
                  <p className="text-white font-medium">{booking.volume_ordered}L</p>
                </div>
                <div className="bg-[#021B3A] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">Scheduled</p>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(booking.scheduled_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="bg-[#021B3A] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">Joined</p>
                  </div>
                  <p className="text-white font-medium">{booking.participant_count} households</p>
                </div>
                <div className="bg-[#021B3A] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets className="w-3 h-3 text-slate-500" />
                    <p className="text-slate-500 text-xs">Price/L</p>
                  </div>
                  <p className="text-white font-medium">{formatINR(booking.price_per_liter)}</p>
                </div>
              </div>

              {booking.my_participation ? (
                <div className="flex items-center gap-2 text-[#0D9488] text-sm">
                  <Check className="w-4 h-4" />
                  <span>You joined with {booking.my_participation.share_liters}L</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedBooking(booking)
                    setVolumeLiters(500)
                    setError(null)
                    setView('join')
                  }}
                  className="w-full py-3 bg-[#0D9488] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Join Booking
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
