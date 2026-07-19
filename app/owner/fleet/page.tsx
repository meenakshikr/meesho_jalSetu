'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Truck,
  Star,
  MapPin,
  Package,
  Activity,
  User,
} from 'lucide-react'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import type { Tanker, User as UserType } from '@/types'

export default function OwnerFleetPage() {
  const router = useRouter()
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [drivers, setDrivers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newOperator, setNewOperator] = useState('')
  const [newVehicle, setNewVehicle] = useState('')
  const [newCapacity, setNewCapacity] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchFleet() {
    setLoading(true)
    setError(null)
    try {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) throw new Error('Failed to load profile')
      const meData = await meRes.json()
      const ownerId = meData.id

      const [fleetRes, driversRes] = await Promise.all([
        fetch('/api/owner/fleet'),
        fetch(`/api/users?role=driver&owner_id=${ownerId}`),
      ])
      if (!fleetRes.ok) throw new Error('Failed to fetch fleet')
      const data = await fleetRes.json()
      setTankers(data.tankers || [])
      if (driversRes.ok) {
        const dData = await driversRes.json()
        setDrivers(dData.users || dData || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFleet()
  }, [])

  async function handleSavePrice(tankerId: string) {
    setSaving(true)
    try {
      const price = parseFloat(editPrice)
      if (isNaN(price) || price <= 0) throw new Error('Invalid price')
      const res = await fetch(`/api/tankers/${tankerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_liter: price }),
      })
      if (!res.ok) throw new Error('Failed to update price')
      setTankers((prev) =>
        prev.map((t) => (t.id === tankerId ? { ...t, price_per_liter: price } : t))
      )
      setEditingId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAvailability(tankerId: string, current: boolean) {
    try {
      const res = await fetch(`/api/tankers/${tankerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !current }),
      })
      if (!res.ok) throw new Error('Failed to update availability')
      setTankers((prev) =>
        prev.map((t) => (t.id === tankerId ? { ...t, is_available: !current } : t))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  async function handleAssignDriver(tankerId: string, driverId: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tankers/${tankerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId || null }),
      })
      if (!res.ok) throw new Error('Failed to assign driver')
      const driver = drivers.find((d) => d.id === driverId)
      setTankers((prev) =>
        prev.map((t) => (t.id === tankerId ? { ...t, driver_id: driverId, driver: driver || undefined } : t))
      )
      setAssigningId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTanker(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch('/api/tankers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_name: newOperator,
          vehicle_number: newVehicle,
          capacity_liters: parseFloat(newCapacity),
          price_per_liter: parseFloat(newPrice),
        }),
      })
      if (!res.ok) throw new Error('Failed to add tanker')
      setNewOperator('')
      setNewVehicle('')
      setNewCapacity('')
      setNewPrice('')
      fetchFleet()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add tanker')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-[#1E3A5F] flex items-center justify-center text-slate-300 hover:bg-[#0A2744] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold text-white">My Fleet</h1>
        </div>
        <div className="px-4 py-4 space-y-3">
          <LoadingSkeleton type="list" lines={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-[#1E3A5F] flex items-center justify-center text-slate-300 hover:bg-[#0A2744] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold text-white">My Fleet</h1>
        </div>
        <div className="px-4 py-4 space-y-3">
          <ErrorState message={error} onRetry={fetchFleet} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] max-w-[430px] mx-auto pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl border border-[#1E3A5F] flex items-center justify-center text-slate-300 hover:bg-[#0A2744] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-semibold text-white">My Fleet</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        {tankers.length === 0 ? (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center py-2">No tankers yet. Add one below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tankers.map((tanker) => (
              <div key={tanker.id} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-teal-400" />
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

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#021B3A] rounded-xl p-2.5 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Capacity</p>
                      <p className="text-xs font-semibold text-white">{tanker.capacity_liters}L</p>
                    </div>
                  </div>
                  <div className="bg-[#021B3A] rounded-xl p-2.5 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rating</p>
                      <p className="text-xs font-semibold text-amber-400">{tanker.rating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {editingId === tanker.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="flex-1 bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 text-sm"
                        placeholder="Price/L"
                        step="0.50"
                      />
                      <button
                        disabled={saving}
                        onClick={() => handleSavePrice(tanker.id)}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl h-12 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 px-4 flex items-center justify-center transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(tanker.id)
                        setEditPrice(String(tanker.price_per_liter))
                      }}
                      className="text-sm text-teal-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {formatINR(tanker.price_per_liter)}/L — tap to edit
                    </button>
                  )}
                </div>

                <div className="bg-[#021B3A] rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400">Driver:</span>
                      <span className="text-xs font-medium text-white">
                        {tanker.driver?.name || 'Unassigned'}
                      </span>
                    </div>
                    <button
                      onClick={() => setAssigningId(assigningId === tanker.id ? null : tanker.id)}
                      className="text-xs text-teal-400 font-medium hover:underline"
                    >
                      {assigningId === tanker.id ? 'Cancel' : 'Assign'}
                    </button>
                  </div>
                  {assigningId === tanker.id && (
                    <div className="mt-2 space-y-1">
                      {drivers.length === 0 ? (
                        <p className="text-xs text-slate-500">No drivers available</p>
                      ) : (
                        drivers.map((driver) => (
                          <button
                            key={driver.id}
                            disabled={saving}
                            onClick={() => handleAssignDriver(tanker.id, driver.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                              tanker.driver_id === driver.id
                                ? 'bg-teal-600/20 border border-teal-600/30 text-teal-400'
                                : 'bg-[#0A2744] border border-[#1E3A5F] text-slate-300 hover:border-teal-600'
                            }`}
                          >
                            <span className="font-medium">{driver.name}</span>
                            <span className="text-slate-500 ml-2">{driver.phone}</span>
                            {tanker.driver_id === driver.id && (
                              <span className="text-teal-400 ml-2">✓ Assigned</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggleAvailability(tanker.id, tanker.is_available)}
                  className={
                    tanker.is_available
                      ? 'w-full border border-red-900 hover:bg-red-950/50 text-red-400 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors'
                      : 'w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors'
                  }
                >
                  <Activity className="w-4 h-4" />
                  {tanker.is_available ? 'Set Offline' : 'Set Available'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="h-px bg-[#1E3A5F]" />
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Add New Tanker</p>
          <form onSubmit={handleAddTanker} className="space-y-3">
            <input
              type="text"
              value={newOperator}
              onChange={(e) => setNewOperator(e.target.value)}
              placeholder="Operator name"
              required
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
            />
            <input
              type="text"
              value={newVehicle}
              onChange={(e) => setNewVehicle(e.target.value)}
              placeholder="Vehicle number (e.g. MH-12-AB-1234)"
              required
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
            />
            <input
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              placeholder="Capacity in liters"
              required
              min="1"
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price per liter"
              required
              min="0"
              step="0.50"
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
            />
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add Tanker'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
