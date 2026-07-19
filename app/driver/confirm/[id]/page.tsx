'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Booking, Payment } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { createSupabaseClient } from '@/lib/supabase-client'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Droplets, Camera, AlertTriangle, Loader2 } from 'lucide-react'

interface CVResult {
  before_fill_percent?: number
  after_fill_percent?: number
  estimated_liters: number
  volume_ordered: number
  discrepancy_liters: number
  discrepancy_percent: number
  confidence: string
  verdict: 'confirmed' | 'short' | 'excess'
}

interface Props {
  params: { id: string }
}

export default function ConfirmCollectPage({ params }: Props) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cashConfirming, setCashConfirming] = useState(false)
  const [delivering, setDelivering] = useState(false)

  const [cvResult, setCvResult] = useState<CVResult | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const bookingRes = await fetch(`/api/bookings/${params.id}`)
      if (!bookingRes.ok) throw new Error('Failed to load booking')
      const bookingData: Booking = await bookingRes.json()
      setBooking(bookingData)

      const supabase = createSupabaseClient()
      const { data: paymentRows, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', params.id)

      if (!payErr && paymentRows) {
        setPayments(paymentRows as Payment[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (type === 'before') setBeforePhoto(dataUrl)
      else setAfterPhoto(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function runCVScan() {
    if (!beforePhoto || !booking) return
    setCvLoading(true)
    try {
      const formData = new FormData()

      const beforeBlob = await fetch(beforePhoto).then(r => r.blob())
      formData.append('before_image', beforeBlob, 'before.jpg')

      if (afterPhoto) {
        const afterBlob = await fetch(afterPhoto).then(r => r.blob())
        formData.append('after_image', afterBlob, 'after.jpg')
      }

      formData.append('volume_ordered', String(booking.volume_ordered))
      formData.append('tank_capacity', String(booking.tanker?.capacity_liters || 5000))

      const res = await fetch('/api/ai/cv-volume', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('CV analysis failed')
      const result: CVResult = await res.json()
      setCvResult(result)

      if (result.verdict === 'short' && result.discrepancy_percent > 10) {
        await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'disputed',
            anomaly_flagged: true,
            anomaly_reason: `Short delivery: ${result.discrepancy_liters}L less than ordered (${result.discrepancy_percent.toFixed(1)}% discrepancy)`,
          }),
        })
        setBooking(prev => prev ? { ...prev, status: 'disputed' as const, anomaly_flagged: true } : prev)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV scan failed')
    } finally {
      setCvLoading(false)
    }
  }

  async function handleCashReceived(paymentId: string) {
    setCashConfirming(true)
    try {
      const res = await fetch(`/api/payments/${paymentId}/cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to mark cash received')
      setPayments(prev =>
        prev.map(p => (p.id === paymentId ? { ...p, status: 'success' as const } : p))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark cash received')
    } finally {
      setCashConfirming(false)
    }
  }

  async function handleDeliveryComplete() {
    setDelivering(true)
    try {
      const res = await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      })
      if (!res.ok) throw new Error('Failed to complete delivery')
      router.push('/driver')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to complete delivery')
    } finally {
      setDelivering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Confirm & Collect</h1>
          </div>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="max-w-[430px] mx-auto space-y-3">
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="button" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3">
          <div className="max-w-[430px] mx-auto flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Confirm & Collect</h1>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="max-w-[430px] mx-auto">
            <ErrorState message={error ?? 'Booking not found'} onRetry={fetchData} />
          </div>
        </div>
      </div>
    )
  }

  const cashPayments = payments.filter(p => p.method === 'cash' && p.status === 'pending')
  const upiPayments = payments.filter(p => p.method === 'upi')
  const allCashCollected = cashPayments.every(p => p.status === 'success')
  const hasUpiPending = upiPayments.some(p => p.status === 'pending')

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Confirm & Collect</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] mx-auto space-y-3">
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-sm text-slate-400 mb-1">Customer</p>
            <p className="text-sm font-semibold text-white mb-3">
              {booking.resident?.name ?? 'Customer'}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>{booking.delivery_address}</span>
            </div>
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                Volume
              </span>
              <span className="text-sm font-semibold text-teal-400">
                {booking.volume_ordered}L
              </span>
            </div>
            <div className="h-px bg-[#1E3A5F] my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Amount</span>
              <span className="text-sm font-bold text-white">
                {formatINR(booking.total_amount)}
              </span>
            </div>
          </div>

          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Volume Verification</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Take photos of the tanker hatch to verify delivery volume with AI.</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e, 'before')}
                />
                <button
                  onClick={() => beforeInputRef.current?.click()}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                    beforePhoto ? 'border-teal-600 bg-teal-950/30' : 'border-[#1E3A5F] bg-[#021B3A] hover:border-slate-500'
                  }`}
                >
                  {beforePhoto ? (
                    <CheckCircle className="w-5 h-5 text-teal-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-xs text-slate-400">Before Photo</span>
                </button>
              </div>
              <div>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e, 'after')}
                />
                <button
                  onClick={() => afterInputRef.current?.click()}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                    afterPhoto ? 'border-teal-600 bg-teal-950/30' : 'border-[#1E3A5F] bg-[#021B3A] hover:border-slate-500'
                  }`}
                >
                  {afterPhoto ? (
                    <CheckCircle className="w-5 h-5 text-teal-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-xs text-slate-400">After Photo</span>
                </button>
              </div>
            </div>

            {beforePhoto && (
              <button
                onClick={runCVScan}
                disabled={cvLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-10 text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {cvLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {cvLoading ? 'Analyzing...' : 'Scan Volume'}
              </button>
            )}

            {cvResult && (
              <div className={`mt-3 rounded-xl p-3 ${
                cvResult.verdict === 'short'
                  ? 'bg-red-950 border border-red-900'
                  : cvResult.verdict === 'excess'
                  ? 'bg-amber-950 border border-amber-900'
                  : 'bg-emerald-950 border border-emerald-900'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {cvResult.verdict === 'short' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    cvResult.verdict === 'short' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {cvResult.verdict === 'short' ? 'Short Delivery Detected' : cvResult.verdict === 'excess' ? 'Excess Delivery' : 'Volume Confirmed'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Estimated:</span>
                    <span className="text-white ml-1">{cvResult.estimated_liters}L</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Ordered:</span>
                    <span className="text-white ml-1">{cvResult.volume_ordered}L</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Discrepancy:</span>
                    <span className={`ml-1 ${cvResult.verdict === 'short' ? 'text-red-400' : 'text-white'}`}>
                      {cvResult.discrepancy_liters}L ({cvResult.discrepancy_percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-white ml-1 capitalize">{cvResult.confidence}</span>
                  </div>
                </div>
                {cvResult.verdict === 'short' && (
                  <p className="text-xs text-red-300 mt-2">Booking has been marked as disputed for review.</p>
                )}
              </div>
            )}
          </div>

          {upiPayments.length > 0 && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">UPI Payment</span>
              </div>
              {upiPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-sm text-slate-400">
                    {formatINR(payment.amount)}
                  </span>
                  <span
                    className={
                      payment.status === 'success'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md'
                        : payment.status === 'failed'
                        ? 'bg-red-950 text-red-400 border border-red-900 text-xs font-medium px-2 py-0.5 rounded-md'
                        : 'bg-amber-950 text-amber-400 border border-amber-900 text-xs font-medium px-2 py-0.5 rounded-md'
                    }
                  >
                    {payment.status === 'success'
                      ? 'Paid'
                      : payment.status === 'failed'
                      ? 'Failed'
                      : 'Pending'}
                  </span>
                </div>
              ))}
              {hasUpiPending && (
                <p className="text-sm text-amber-400 mt-2">
                  UPI payment is pending
                </p>
              )}
            </div>
          )}

          {payments.filter(p => p.method === 'cash').length > 0 && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Cash Payment</span>
              </div>
              {payments
                .filter(p => p.method === 'cash')
                .map(payment => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        {formatINR(payment.amount)}
                      </span>
                      <span
                        className={
                          payment.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-md'
                            : 'bg-amber-950 text-amber-400 border border-amber-900 text-xs font-medium px-2 py-0.5 rounded-md'
                        }
                      >
                        {payment.status === 'success' ? 'Received' : 'Pending'}
                      </span>
                    </div>
                    {payment.status === 'pending' && (
                      <button
                        disabled={cashConfirming}
                        onClick={() => handleCashReceived(payment.id)}
                        className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {cashConfirming ? 'Processing...' : 'Mark Cash Received'}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {payments.length === 0 && (
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <p className="text-sm text-slate-400 text-center py-2">
                No payment records found
              </p>
            </div>
          )}

          <button
            disabled={!allCashCollected || delivering}
            onClick={handleDeliveryComplete}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Truck className="w-4 h-4" />
            {delivering ? 'Completing...' : 'Complete Delivery'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
