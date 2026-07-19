'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Booking, HeatwaveAlert, NudgeLog } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import HeatwaveAlertBanner from '@/components/HeatwaveAlert'
import { formatINR, getBookingStatusLabel } from '@/lib/utils'
import { motion } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'
import { ClipboardList, Truck, Send, Bell, Home, User as UserIcon, ChevronRight, Clock, CheckCircle, LogOut, MapPin, Phone, X } from 'lucide-react'

export default function CoordinatorHome() {
  const router = useRouter()
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [heatwave, setHeatwave] = useState<HeatwaveAlert | null>(null)
  const [nudges, setNudges] = useState<NudgeLog[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [userRes, nudgeRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/nudges'),
      ])

      if (!userRes.ok) throw new Error('Failed to load profile')
      const profile: User = await userRes.json()
      setUser(profile)

      if (profile.ward_id) {
        const [bookingRes, heatwaveRes] = await Promise.all([
          fetch(`/api/bookings?ward_id=${profile.ward_id}&type=community&status=open`),
          fetch(`/api/heatwave?district=${profile.ward?.district ?? ''}`),
        ])

        if (bookingRes.ok) {
          const bookings: Booking[] = await bookingRes.json()
          if (bookings.length > 0) setActiveBooking(bookings[0])
        }

        if (heatwaveRes.ok) {
          const alert: HeatwaveAlert | null = await heatwaveRes.json()
          if (alert) setHeatwave(alert)
        }
      }

      if (nudgeRes.ok) {
        const nudgeData: NudgeLog[] = await nudgeRes.json()
        setNudges(nudgeData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={2} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="button" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error} onRetry={loadAll} />
        </div>
      </div>
    )
  }

  const participantCount = activeBooking?.participants?.length ?? 0
  const targetParticipantCount = Math.max(
    1,
    Math.ceil((activeBooking?.volume_ordered ?? 0) / 1000)
  )
  const progressPct = Math.min(100, Math.round((participantCount / targetParticipantCount) * 100))
  const unreadNudges = nudges.filter(n => !n.read).length

  const statCards = [
    { label: 'Active Bookings', value: activeBooking ? 1 : 0, icon: ClipboardList, color: 'text-teal-400' },
    { label: 'Pending', value: activeBooking ? participantCount : 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Assigned', value: activeBooking?.tanker ? 1 : 0, icon: Truck, color: 'text-blue-400' },
    { label: 'Delivered', value: 0, icon: CheckCircle, color: 'text-emerald-400' },
  ]

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/coordinator')}
          className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Coordinator Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {unreadNudges > 0 && (
            <button className="relative p-2 rounded-xl hover:bg-[#0A2744] transition-colors">
              <Bell className="w-5 h-5 text-slate-300" />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadNudges}
              </span>
            </button>
          )}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <UserIcon className="w-5 h-5" />
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
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">{user?.name || 'Coordinator'}</span>
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
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] md:max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#0A2744] border border-[#1E3A5F] rounded-2xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.ward?.name ?? 'Coordinator'}</p>
              <p className="text-xs text-slate-400">{user?.ward?.city ?? ''}</p>
            </div>
          </div>

          {heatwave && (
            <div className="mb-1">
              <HeatwaveAlertBanner alert={heatwave} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {activeBooking ? (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Active Community Booking</h2>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md">
                  {getBookingStatusLabel(activeBooking.status)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-400">
                <span>{formatINR(activeBooking.total_amount)}</span>
                <span>{activeBooking.volume_ordered}L total</span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{participantCount} joined</span>
                  <span>{targetParticipantCount} target</span>
                </div>
                <div className="w-full bg-[#1E3A5F] rounded-full h-1.5">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {activeBooking.tanker && (
                <div className="flex items-center justify-between bg-[#021B3A] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-400" />
                    <span className="text-sm text-white font-medium">{activeBooking.tanker.operator_name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{activeBooking.tanker.vehicle_number}</span>
                </div>
              )}

              <button
                onClick={() => router.push(`/coordinator/booking/${activeBooking.id}`)}
                className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                Dispatch Tanker
              </button>
            </div>
          ) : (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <p className="text-sm text-slate-400 mb-3">
                No active community bookings. Create one to get started.
              </p>
              <button
                onClick={() => router.push('/coordinator/create')}
                className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Create Community Booking
              </button>
            </div>
          )}

          {!activeBooking && (
            <button
              onClick={() => router.push('/coordinator/create')}
              className="w-full border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Create Community Booking
            </button>
          )}

          <button
            onClick={() => router.push('/coordinator/history')}
            className="w-full border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            View Booking History
          </button>
        </div>
      </motion.div>
    </div>
  )
}
