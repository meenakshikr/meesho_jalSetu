'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Booking, PaymentMethod } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { formatINR } from '@/lib/utils'
import { loadRazorpayScript, RazorpayWindow, RazorpayResponse } from '@/lib/razorpay'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Banknote, Star, CheckCircle, AlertTriangle } from 'lucide-react'

const PAYMENT_METHODS = [
  { key: 'upi' as const, label: 'UPI Payment', icon: CreditCard, desc: 'Pay via Google Pay, PhonePe, etc.' },
  { key: 'cash' as const, label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when water is delivered' },
  { key: 'points' as const, label: 'Subsidy Points', icon: Star, desc: 'Use your subsidy balance' },
]

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [anomalyResult, setAnomalyResult] = useState<{ is_anomaly: boolean; reason: string; percent_above: number } | null>(null)

  const fetchBooking = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/bookings/${id}`)
      if (!res.ok) throw new Error('Failed to load booking')
      const data: Booking = await res.json()
      setBooking(data)

      if (data.anomaly_flagged) {
        setAnomalyResult({
          is_anomaly: true,
          reason: data.anomaly_reason || 'Price significantly above district average',
          percent_above: 0,
        })
      }

      fetch('/api/ai/anomaly-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: id }),
      }).then(r => r.json()).then(result => {
        if (result.is_anomaly) setAnomalyResult(result)
      }).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBooking()
  }, [id])

  const handlePayment = async () => {
    if (!booking || !method) return
    try {
      setProcessing(true)
      setError(null)

      if (method === 'upi') {
        const scriptLoaded = await loadRazorpayScript()
        if (!scriptLoaded) throw new Error('Failed to load payment gateway')

        const orderRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking.id, amount: booking.total_amount, method: 'upi' }),
        })
        if (!orderRes.ok) throw new Error('Failed to create payment order')
        const orderData = await orderRes.json()

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: Math.round(booking.total_amount * 100),
          currency: 'INR',
          name: 'JalSetu',
          description: `Water delivery - ${booking.volume_ordered}L`,
          order_id: orderData.razorpay_order_id,
          handler: async (response: RazorpayResponse) => {
            await fetch('/api/receipts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                booking_id: booking.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            router.push(`/resident/tracking/${booking.id}`)
          },
          prefill: { name: '' },
          theme: { color: '#0D9488' },
          modal: { ondismiss: () => setProcessing(false) },
        }
        const win = window as unknown as RazorpayWindow
        const rzp = new win.Razorpay(options)
        rzp.open()
        return
      }

      if (method === 'cash') {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking.id, amount: booking.total_amount, method: 'cash' }),
        })
        router.push(`/resident/tracking/${booking.id}`)
        return
      }

      if (method === 'points') {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking.id, amount: booking.total_amount, method: 'points' }),
        })
        router.push(`/resident/tracking/${booking.id}`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-[#021B3A] pb-24">
        <div className="px-4 py-4">
          <ErrorState message={error} onRetry={fetchBooking} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Payment</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Volume</span>
            <span className="text-sm text-white">{booking!.volume_ordered}L</span>
          </div>
          <div className="h-px bg-[#1E3A5F]" />
          <div className="flex justify-between mt-2">
            <span className="text-base font-semibold text-white">Total</span>
            <span className="text-lg font-bold text-teal-400">{formatINR(booking!.total_amount)}</span>
          </div>
        </div>

        {anomalyResult && anomalyResult.is_anomaly && (
          <div className="bg-red-950 border border-red-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Price Alert Detected</span>
            </div>
            <p className="text-xs text-red-300">{anomalyResult.reason}</p>
            <p className="text-xs text-red-400 mt-1">{anomalyResult.percent_above.toFixed(0)}% above district average</p>
          </div>
        )}

        <div className="space-y-3">
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`w-full bg-[#0A2744] rounded-2xl p-4 text-left transition-colors ${
                  method === m.key
                    ? 'border-2 border-teal-600'
                    : 'border border-[#1E3A5F] hover:border-[#1E3A5F]/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    method === m.key ? 'bg-teal-600/20 border border-teal-600/30' : 'bg-[#0A2744] border border-[#1E3A5F]'
                  }`}>
                    <Icon className={`w-5 h-5 ${method === m.key ? 'text-teal-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{m.label}</p>
                    <p className="text-xs text-slate-400">{m.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      method === m.key ? 'border-teal-600 bg-teal-600' : 'border-slate-500'
                    }`}
                  >
                    {method === m.key && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-950 border border-red-900 rounded-xl p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          disabled={processing || !method}
          onClick={handlePayment}
          className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {processing ? 'Processing...' : method === 'cash' ? 'Confirm Cash Payment' : method === 'points' ? 'Pay with Points' : 'Pay Now'}
        </button>
      </motion.div>
    </div>
  )
}