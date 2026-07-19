'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { User, Booking, Tanker } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { getBookingStatusLabel } from '@/lib/utils'
import { geocodeAddress } from '@/lib/geocode'
import { motion } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'
import { Package, Truck, Clock, CheckCircle, Droplets, ChevronRight, MapPin, User as UserIcon, LogOut, Phone, X, Home } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="w-full h-full bg-[#021B3A] rounded-2xl animate-pulse" /> })

export default function DriverOrdersToday() {
  const router = useRouter()
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) throw new Error('Failed to load profile')
      const profile: User = await userRes.json()
      setUser(profile)

      const [allTankersRes, bookingRes] = await Promise.all([
        fetch(`/api/driver/tankers?driver_id=${profile.id}`),
        fetch(`/api/driver/bookings?driver_id=${profile.id}`),
      ])

      if (!allTankersRes.ok) throw new Error('Failed to load tankers')
      const myTankers: Tanker[] = await allTankersRes.json()
      setTankers(myTankers)

      if (!bookingRes.ok) throw new Error('Failed to load bookings')
      const allBookings: Booking[] = await bookingRes.json()
      const activeStatuses = ['confirmed', 'dispatched']
      const myBookings = allBookings.filter(b => activeStatuses.includes(b.status))

      const missingCoords = myBookings.filter(b => !b.delivery_lat && !b.delivery_lng && b.delivery_address)
      if (missingCoords.length > 0) {
        await Promise.all(missingCoords.map(async (b) => {
          const coords = await geocodeAddress(b.delivery_address!)
          if (coords) {
            b.delivery_lat = coords.lat
            b.delivery_lng = coords.lng
          }
        }))
      }

      setBookings(myBookings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto">
            <LoadingSkeleton type="text" lines={1} />
          </div>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="max-w-[430px] mx-auto space-y-3">
            <LoadingSkeleton type="list" lines={3} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto">
            <h1 className="text-xl font-semibold text-white">My Orders</h1>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="max-w-[430px] mx-auto">
            <ErrorState message={error} onRetry={loadData} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push('/driver')}
          className="w-10 h-10 rounded-xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">My Orders</h1>
            <ThemeToggle />
          </div>
          {tankers.length > 0 && (
            <p className="text-sm text-slate-400 mt-0.5">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} assigned
            </p>
          )}
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
                    <span className="text-sm text-white">{user?.name || 'Driver'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{user?.phone || '—'}</span>
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
        <div className="max-w-[430px] mx-auto md:grid md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3 space-y-3">
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl h-10 text-sm font-medium bg-teal-600 text-white transition-colors flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Active
              </button>
              <button className="flex-1 rounded-xl h-10 text-sm font-medium border border-[#1E3A5F] text-slate-400 hover:bg-[#0A2744] transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full border border-[#1E3A5F] flex items-center justify-center">
                    <Truck className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">No Orders</p>
                  <p className="text-sm text-slate-400">
                    No dispatched orders right now
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => {
                  const statusOrder = ['dispatched', 'arrived', 'loading', 'delivering', 'delivered']
                  const currentIdx = statusOrder.indexOf(booking.status)

                  return (
                    <div
                      key={booking.id}
                      className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 cursor-pointer hover:border-teal-600/50 transition-colors"
                      onClick={() => router.push(`/driver/delivery/${booking.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">
                          {booking.resident?.name ?? 'Customer'}
                        </span>
                        <span className="bg-amber-950 text-amber-400 border border-amber-900 text-xs font-medium px-2 py-0.5 rounded-md">
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{booking.delivery_address}</span>
                      </div>

                      {booking.delivery_lat && booking.delivery_lng && (
                        <div className="mb-3 rounded-2xl overflow-hidden border border-[#1E3A5F]" style={{ height: 140 }}>
                          <MapView
                            lat={booking.delivery_lat}
                            lng={booking.delivery_lng}
                            zoom={13}
                            height={140}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        {[
                          { icon: Clock, label: 'Arrived' },
                          { icon: Package, label: 'Loaded' },
                          { icon: Truck, label: 'En Route' },
                          { icon: CheckCircle, label: 'Done' },
                        ].map((step, i) => {
                          const isActive = currentIdx > 0 && i < currentIdx
                          const isCurrent = i === currentIdx - 1 && currentIdx > 0
                          return (
                            <div key={step.label} className="flex items-center gap-1 flex-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isActive ? 'bg-teal-600 text-white' :
                                isCurrent ? 'bg-teal-600/20 text-teal-400 border border-teal-600' :
                                'bg-[#021B3A] text-slate-600 border border-[#1E3A5F]'
                              }`}>
                                <step.icon className="w-3 h-3" />
                              </div>
                              {i < 3 && (
                                <div className={`flex-1 h-0.5 rounded ${
                                  isActive || isCurrent ? 'bg-teal-600' : 'bg-[#1E3A5F]'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-teal-400" />
                          <span className="text-sm font-semibold text-teal-400">
                            {booking.volume_ordered}L
                          </span>
                        </div>
                        {booking.scheduled_at && (
                          <span className="text-sm text-slate-400">
                            {new Date(booking.scheduled_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
