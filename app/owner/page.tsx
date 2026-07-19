'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Calendar,
  Truck,
  AlertTriangle,
  Activity,
  ChevronRight,
  BarChart3,
  Star,
  User as UserIcon,
  LogOut,
  Phone,
  X,
  TrendingUp,
  Users,
  Package,
  Home,
} from 'lucide-react'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import type { Tanker, Booking } from '@/types'

interface OwnerStats {
  todayRevenue: number
  totalDeliveriesToday: number
  avgRating: number
  totalRevenue: number
  totalDeliveries: number
}

interface FleetTanker extends Tanker {
  driver_name: string
  today_deliveries: number
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<OwnerStats | null>(null)
  const [fleet, setFleet] = useState<FleetTanker[]>([])
  const [anomalies, setAnomalies] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [userName, setUserName] = useState<string>('')

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, fleetRes] = await Promise.all([
        fetch('/api/owner/stats'),
        fetch('/api/owner/fleet'),
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')
      if (!fleetRes.ok) throw new Error('Failed to fetch fleet')

      const statsData = await statsRes.json()
      const fleetData = await fleetRes.json()

      setStats(statsData)
      setFleet(fleetData.tankers || [])

      const flagged = (fleetData.anomalies || []) as Booking[]
      setAnomalies(flagged)

      const userRes = await fetch('/api/auth/me')
      if (userRes.ok) {
        const profile = await userRes.json()
        setUserName(profile.name || 'Owner')
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
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Fleet Dashboard</h1>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
          </div>
          <LoadingSkeleton type="list" lines={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Fleet Dashboard</h1>
        </div>
        <div className="px-4 py-4 space-y-3">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/owner')}
          className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">Fleet Dashboard</h1>
        </div>
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
                    <span className="text-sm text-white">{userName || 'Owner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">—</span>
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 text-center">
            <DollarSign className="w-4 h-4 text-teal-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-sm font-bold text-teal-500">
              {formatINR((stats?.todayRevenue ?? 0) || (stats?.totalRevenue ?? 0))}
            </p>
            {stats?.todayRevenue === 0 && (stats?.totalRevenue ?? 0) > 0 && (
              <p className="text-[10px] text-slate-500">all time</p>
            )}
          </div>
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 text-center">
            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Deliveries</p>
            <p className="text-sm font-bold text-white">
              {(stats?.totalDeliveriesToday ?? 0) || (stats?.totalDeliveries ?? 0)}
            </p>
            {stats?.totalDeliveriesToday === 0 && (stats?.totalDeliveries ?? 0) > 0 && (
              <p className="text-[10px] text-slate-500">all time</p>
            )}
          </div>
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 text-center">
            <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Avg Rating</p>
            <p className="text-sm font-bold text-amber-400">
              <Star className="w-3 h-3 inline mr-0.5" />
              {(stats?.avgRating ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        {anomalies.length > 0 && (
          <div className="bg-red-950/50 border border-red-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">
                {anomalies.length} Anomaly Flagged Booking{anomalies.length !== 1 ? 's' : ''}
              </p>
            </div>
            {anomalies.map((a) => (
              <div key={a.id} className="text-sm text-red-400/70 mb-1">
                Booking {a.id.slice(0, 8)} — {a.anomaly_reason || 'Suspicious activity detected'}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push('/owner/bookings')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Booking Inbox</p>
              <p className="text-xs text-white/70">View & assign drivers to bookings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push('/owner/demand')}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:from-teal-700 active:to-cyan-700 text-white font-semibold rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Water Demand Forecast</p>
              <p className="text-xs text-white/70">See which wards need tankers most</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => router.push('/owner/fleet')}
          className="w-full bg-[#0A2744] border border-[#1E3A5F] hover:border-teal-600 text-white font-semibold rounded-2xl p-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Manage Fleet & Drivers</p>
              <p className="text-xs text-slate-400">Assign drivers to tankers</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">7-Day Revenue</p>
          </div>
          <div className="flex items-end gap-2 h-24">
            {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-teal-600/30 rounded-t-md"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="w-full bg-teal-600 rounded-t-md"
                    style={{ height: `${h}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-[10px] text-slate-500 flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>

        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Bookings</p>
        {fleet.length === 0 ? (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center py-2">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fleet.map((tanker) => (
              <div
                key={tanker.id}
                className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 cursor-pointer hover:border-teal-600 transition-colors"
                onClick={() => router.push('/owner/fleet')}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{tanker.operator_name}</h3>
                      <p className="text-xs text-slate-400">{tanker.vehicle_number}</p>
                    </div>
                  </div>
                  <span
                    className={
                      tanker.is_available
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-lg'
                        : 'bg-red-950 text-red-400 border border-red-900 text-xs font-medium px-2 py-0.5 rounded-lg'
                    }
                  >
                    {tanker.is_available ? 'Active' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Driver: </span>
                      <span className="text-slate-200">{tanker.driver?.name || tanker.driver_name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Today: </span>
                      <span className="text-teal-400 font-semibold">{tanker.today_deliveries} trips</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
