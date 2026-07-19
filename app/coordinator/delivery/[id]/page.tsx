'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Booking } from '@/types'
import CVScanner from '@/components/CVScanner'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { getBookingStatusLabel } from '@/lib/utils'

interface Props {
  params: { id: string }
}

export default function DeliveryPage({ params }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cvResult, setCvResult] = useState<{
    volume_estimate: number
    estimated_liters: number
    confidence: number
    verdict: string
    discrepancy_liters: number
    before_fill_percent?: number
    after_fill_percent?: number
  } | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [disputing, setDisputing] = useState(false)

  const fetchBooking = useCallback(async () => {
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
    fetchBooking()
  }, [fetchBooking])

  async function handleCVScan(beforeFile: File, afterFile: File) {
    setCvLoading(true)
    try {
      const formData = new FormData()
      formData.append('booking_id', params.id)
      formData.append('volume_ordered', String(booking?.volume_ordered || 2000))
      formData.append('tank_capacity', String(booking?.tanker?.capacity_liters || 5000))
      formData.append('before_image', beforeFile)
      formData.append('after_image', afterFile)
      const res = await fetch('/api/ai/cv-volume', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('CV scan failed')
      const data = await res.json()
      const confidenceMap: Record<string, number> = { high: 0.9, medium: 0.65, low: 0.3 }
      setCvResult({
        volume_estimate: data.estimated_liters ?? data.volume_estimate ?? 0,
        estimated_liters: data.estimated_liters ?? 0,
        confidence: typeof data.confidence === 'number' ? data.confidence : (confidenceMap[data.confidence] ?? 0.5),
        verdict: data.verdict ?? 'confirmed',
        discrepancy_liters: data.discrepancy_liters ?? 0,
        before_fill_percent: data.before_fill_percent,
        after_fill_percent: data.after_fill_percent,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'CV scan failed')
    } finally {
      setCvLoading(false)
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'delivered',
          volume_delivered: cvResult?.estimated_liters ?? booking?.volume_ordered,
          cv_confirmed: cvResult?.verdict === 'confirmed',
        }),
      })
      if (!res.ok) throw new Error('Failed to confirm delivery')
      router.push('/coordinator/history')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm delivery')
    } finally {
      setConfirming(false)
    }
  }

  async function handleDispute() {
    setDisputing(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disputed' }),
      })
      if (!res.ok) throw new Error('Failed to dispute')
      router.push('/coordinator/history')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dispute')
    } finally {
      setDisputing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={2} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="button" />
          <LoadingSkeleton type="button" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error ?? 'Booking not found'} onRetry={fetchBooking} />
        </div>
      </div>
    )
  }

  const tanker = booking.tanker

  return (
    <div className="min-h-screen bg-[#021B3A] px-4 py-6">
      <div className="max-w-[430px] md:max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 border border-[#1E3A5F] text-slate-200 hover:bg-[#0A2744] rounded-lg h-12 px-4 text-sm font-medium transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-xl font-semibold text-white tracking-tight mb-1">Delivery</h1>
        <p className="text-sm text-slate-400 mb-4">Track and confirm tanker delivery</p>

        {booking && (
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md mb-4 inline-block">
            {getBookingStatusLabel(booking.status)}
          </span>
        )}

        <div className="space-y-3">
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
            {tanker ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Operator</span>
                  <span className="text-sm text-white font-medium">{tanker.operator_name}</span>
                </div>
                <div className="h-px bg-[#1E3A5F]" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Vehicle</span>
                  <span className="text-sm text-white font-medium">{tanker.vehicle_number}</span>
                </div>
                {tanker.driver && (
                  <>
                    <div className="h-px bg-[#1E3A5F]" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Driver</span>
                      <span className="text-sm text-white font-medium">{tanker.driver.name}</span>
                    </div>
                    <div className="h-px bg-[#1E3A5F]" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Driver Phone</span>
                      <span className="text-sm text-white font-medium">{tanker.driver.phone}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Tanker info not available</p>
            )}
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3 font-medium">Volume Verification</p>
            <CVScanner
              onCapture={handleCVScan}
              result={cvResult}
              loading={cvLoading}
            />
          </div>

          {cvResult && cvResult.verdict === 'short' && (
            <button
              onClick={handleDispute}
              disabled={disputing}
              className="w-full bg-red-950 text-red-400 border border-red-900 rounded-lg h-12 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {disputing ? 'Disputing...' : 'File Dispute'}
            </button>
          )}

          {cvResult && cvResult.verdict !== 'short' && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg h-12 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
