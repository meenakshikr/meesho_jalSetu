'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Booking } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertTriangle, CheckCircle, Truck, Package } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default function AnomalyReportPage({ params }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)
  const [escalating, setEscalating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${params.id}`)
      if (!res.ok) throw new Error('Failed to load booking')
      const data: Booking = await res.json()
      setBooking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleEscalate() {
    setEscalating(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disputed' }),
      })
      if (!res.ok) throw new Error('Failed to escalate')
      router.push('/coordinator/history')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to escalate')
    } finally {
      setEscalating(false)
    }
  }

  async function handleResolve() {
    setResolving(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', anomaly_flagged: false }),
      })
      if (!res.ok) throw new Error('Failed to resolve')
      router.push('/coordinator/history')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={2} />
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error ?? 'Booking not found'} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  const priceDiff = booking.total_amount - (booking.volume_ordered * (booking.tanker?.price_per_liter ?? 0))
  const pctDiff = booking.total_amount > 0 ? Math.round((priceDiff / booking.total_amount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Anomaly Report</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] md:max-w-3xl mx-auto space-y-3">
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Detected Anomaly</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Anomaly Type
                </span>
                <span className="text-amber-400 font-medium text-sm">Price Overcharge</span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Tanker
                </span>
                <span className="text-white font-medium text-sm">
                  {booking.tanker?.operator_name ?? 'Unknown'} ({booking.tanker?.vehicle_number ?? '-'})
                </span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Charged Amount</span>
                <span className="text-red-400 font-semibold text-sm">{formatINR(booking.total_amount)}</span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Expected Amount</span>
                <span className="text-white font-medium text-sm">
                  {formatINR(booking.volume_ordered * (booking.tanker?.price_per_liter ?? 0))}
                </span>
              </div>
              <div className="h-px bg-[#1E3A5F]" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Discrepancy</span>
                <span className="text-red-400 font-semibold text-sm">+{pctDiff}%</span>
              </div>
            </div>

            {booking.anomaly_reason && (
              <div className="bg-[#021B3A] rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">AI Reason</p>
                <p className="text-sm text-slate-200">{booking.anomaly_reason}</p>
              </div>
            )}
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Resolution Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-[#021B3A] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 py-3 h-24 focus:outline-none focus:border-teal-600 text-sm resize-none"
              placeholder="Add notes about this anomaly resolution..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEscalate}
              disabled={escalating}
              className="bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              {escalating ? 'Escalating...' : 'Escalate'}
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {resolving ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
