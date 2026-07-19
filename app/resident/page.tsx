'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User as UserType, NudgeLog, Booking, HeatwaveAlert } from '@/types'
import HeatwaveAlertBanner from '@/components/HeatwaveAlert'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'
import { User, Droplets, Users, AlertTriangle, Package, ChevronRight, Clock, LogOut, MapPin, Phone, X, Home } from 'lucide-react'

export default function ResidentHome() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [nudges, setNudges] = useState<NudgeLog[]>([])
  const [lastBooking, setLastBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [heatwaveAlert, setHeatwaveAlert] = useState<HeatwaveAlert | null>(null)
  const [heatwaveLoading, setHeatwaveLoading] = useState(true)

  const fetchHeatwave = useCallback(async (district?: string) => {
    if (!district) { setHeatwaveLoading(false); return }
    try {
      setHeatwaveLoading(true)
      const res = await fetch(`/api/heatwave?district=${encodeURIComponent(district)}`)
      if (res.ok) {
        const data = await res.json()
        if (data) setHeatwaveAlert(data)
      }
    } catch { } finally {
      setHeatwaveLoading(false)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) throw new Error('Failed to load profile')
      const userData: UserType = await userRes.json()
      setUser(userData)

      if (userData.ward?.district) {
        fetchHeatwave(userData.ward.district)
      } else {
        setHeatwaveLoading(false)
      }

      const nudgeRes = await fetch('/api/nudges')
      if (nudgeRes.ok) {
        const nudgeData: NudgeLog[] = await nudgeRes.json()
        setNudges(nudgeData.filter((n) => !n.read))
      }

      if (userData.id) {
        const bookingRes = await fetch(`/api/bookings?resident_id=${userData.id}`)
        if (bookingRes.ok) {
          const bookingData: Booking[] = await bookingRes.json()
          const active = bookingData.find(
            (b) => !['delivered', 'cancelled', 'disputed'].includes(b.status)
          )
          setLastBooking(active || bookingData[0] || null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <LoadingSkeleton type="card" className="mb-4" />
          <LoadingSkeleton lines={2} className="mb-4" />
          <LoadingSkeleton type="button" className="mb-3" />
          <LoadingSkeleton type="button" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  const latestNudge = nudges[0]

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <header className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/resident')}
          className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">JalSetu</h1>
        </div>
        <ThemeToggle />
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-72 bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">Profile</p>
                  <button onClick={() => setShowProfile(false)}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="h-px bg-[#1E3A5F] mb-3" />
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white">{user?.name || 'Resident'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{user?.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{user?.ward?.name || 'No ward assigned'}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    window.location.href = '/login'
                  }}
                  className="w-full bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 font-medium rounded-xl h-11 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Welcome back</p>
          <h2 className="text-xl font-semibold text-white">{user?.name || 'Resident'}</h2>
        </div>

        {heatwaveAlert && !heatwaveLoading && (
          <div className="bg-amber-950/50 border border-amber-900 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <HeatwaveAlertBanner alert={heatwaveAlert} />
            </div>
          </div>
        )}

        {latestNudge && (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-900 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-200 leading-relaxed">{latestNudge.message}</p>
                <button
                  onClick={() => router.push('/resident/marketplace')}
                  className="mt-2 w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
                >
                  <Droplets className="w-4 h-4" />
                  Book Now
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/resident/marketplace')}
            className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-[#0D2D4F] transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Droplets className="w-7 h-7 text-teal-400" />
            </div>
            <p className="text-sm font-semibold text-white text-center">Book Water</p>
            <p className="text-xs text-slate-400 text-center mt-1">For yourself</p>
            <ChevronRight className="w-4 h-4 text-slate-500 mt-2" />
          </button>
          <button
            onClick={() => router.push('/resident/community')}
            className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-[#0D2D4F] transition-colors group"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7 text-teal-400" />
            </div>
            <p className="text-sm font-semibold text-white text-center">Community Booking</p>
            <p className="text-xs text-slate-400 text-center mt-1">Join together</p>
            <ChevronRight className="w-4 h-4 text-slate-500 mt-2" />
          </button>
        </div>

        {lastBooking && (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-white">Active Booking</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${
                lastBooking.status === 'delivered'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                  : lastBooking.status === 'dispatched'
                  ? 'bg-amber-950 text-amber-400 border-amber-900'
                  : 'bg-[#0A2744] text-teal-400 border-[#1E3A5F]'
              }`}>
                {lastBooking.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{lastBooking.volume_ordered}L</span>
              <span>{formatINR(lastBooking.total_amount)}</span>
              {lastBooking.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(lastBooking.scheduled_at).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push(`/resident/tracking/${lastBooking.id}`)}
              className="mt-3 w-full border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Track Order
            </button>
          </div>
        )}

        {!lastBooking && (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-6 text-center">
            <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">No active bookings</p>
            <p className="text-xs text-slate-500">
              Water delivery is just a tap away
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}