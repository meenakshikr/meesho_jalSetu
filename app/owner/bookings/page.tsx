'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Truck,
  User as UserIcon,
  MapPin,
  Droplets,
  Clock,
  ChevronRight,
  X,
  UserPlus,
  Package,
} from 'lucide-react'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR, getBookingStatusLabel } from '@/lib/utils'
import type { Booking, User } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-950 text-amber-400 border border-amber-900',
  open: 'bg-blue-950 text-blue-400 border border-blue-900',
  confirmed: 'bg-emerald-950 text-emerald-400 border border-emerald-900',
  dispatched: 'bg-purple-950 text-purple-400 border border-purple-900',
  delivered: 'bg-teal-950 text-teal-400 border border-teal-900',
  disputed: 'bg-red-950 text-red-400 border border-red-900',
  cancelled: 'bg-slate-800 text-slate-400 border border-slate-700',
}

const TAB_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Open', value: 'open' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'Delivered', value: 'delivered' },
]

export default function OwnerBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [drivers, setDrivers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [assignModal, setAssignModal] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) throw new Error('Failed to load profile')
      const meData = await meRes.json()
      const ownerId = meData.id

      const [bookingsRes, driversRes] = await Promise.all([
        fetch('/api/owner/bookings'),
        fetch(`/api/users?role=driver&owner_id=${ownerId}`),
      ])

      if (!bookingsRes.ok) throw new Error('Failed to load bookings')
      const bookingsData = await bookingsRes.json()
      setBookings(bookingsData)

      if (driversRes.ok) {
        setDrivers(await driversRes.json())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAssignDriver(bookingId: string, driverId: string) {
    setAssigning(true)
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to assign driver')
        return
      }

      setAssignModal(null)
      await loadData()
    } catch {
      alert('Failed to assign driver')
    } finally {
      setAssigning(false)
    }
  }

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
        </div>
        <div className="px-4 py-4">
          <LoadingSkeleton type="list" lines={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
        </div>
        <div className="px-4 py-4">
          <ErrorState message={error} onRetry={loadData} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/owner')} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Bookings</h1>
        <span className="ml-auto text-xs text-slate-400 bg-[#0A2744] border border-[#1E3A5F] px-2 py-1 rounded-lg">
          {bookings.length} total
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {TAB_FILTERS.map(tab => {
            const count = tab.value === 'all'
              ? bookings.length
              : bookings.filter(b => b.status === tab.value).length
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-[#0A2744] border border-[#1E3A5F] text-slate-400 hover:text-white'
                }`}
              >
                {tab.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 space-y-3"
      >
        {filtered.length === 0 ? (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-8 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">No Bookings</p>
            <p className="text-sm text-slate-400">
              {activeTab === 'all' ? 'No bookings for your tankers yet' : `No ${activeTab} bookings`}
            </p>
          </div>
        ) : (
          filtered.map(booking => (
            <div
              key={booking.id}
              className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {booking.resident?.name || booking.coordinator?.name || 'Customer'}
                    </span>
                    {booking.type === 'community' && (
                      <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900 px-1.5 py-0.5 rounded-md">
                        Community
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[250px]">{booking.delivery_address}</span>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${STATUS_COLORS[booking.status] || ''}`}>
                  {getBookingStatusLabel(booking.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300">{booking.tanker?.operator_name || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-teal-400 font-semibold">{booking.volume_ordered}L</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">{formatINR(booking.total_amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  {booking.driver ? (
                    <span className="text-sm text-emerald-400">{booking.driver.name}</span>
                  ) : (
                    <span className="text-sm text-amber-400">Unassigned</span>
                  )}
                </div>

                {!booking.driver_id && booking.status === 'pending' && (
                  <button
                    onClick={() => setAssignModal(booking.id)}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Driver
                  </button>
                )}

                {!booking.driver_id && booking.status === 'open' && (
                  <button
                    onClick={() => setAssignModal(booking.id)}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Driver
                  </button>
                )}
              </div>

              {booking.scheduled_at && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Scheduled: {new Date(booking.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
          ))
        )}
      </motion.div>

      {assignModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setAssignModal(null)} />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#0A2744] border-t border-[#1E3A5F] rounded-t-3xl p-5 max-w-[430px] mx-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Assign Driver</h3>
              <button onClick={() => setAssignModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select a driver for this booking. They will see it on their dashboard.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drivers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No drivers available</p>
              ) : (
                drivers.map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => handleAssignDriver(assignModal, driver.id)}
                    disabled={assigning}
                    className="w-full flex items-center gap-3 bg-[#021B3A] border border-[#1E3A5F] hover:border-teal-600 rounded-xl p-3 text-left transition-colors disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{driver.name}</p>
                      <p className="text-xs text-slate-400">{driver.phone}</p>
                    </div>
                    {assigning ? (
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
