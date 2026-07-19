'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Booking, Receipt } from '@/types'
import ReceiptCard from '@/components/ReceiptCard'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, AlertTriangle, Star, Home } from 'lucide-react'

export default function DeliveryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [bookingRes, receiptRes] = await Promise.all([
        fetch(`/api/bookings/${id}`),
        fetch(`/api/receipts?booking_id=${id}`),
      ])

      if (!bookingRes.ok) throw new Error('Failed to load booking details')
      const bookingData: Booking = await bookingRes.json()
      setBooking(bookingData)

      if (receiptRes.ok) {
        const receiptData = await receiptRes.json()
        const receipts: Receipt[] = Array.isArray(receiptData) ? receiptData : [receiptData]
        setReceipt(receipts[0] || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData()
  }, [id])

  const handleSubmitReview = async () => {
    if (!booking || rating === 0) return
    try {
      setSubmitting(true)
      setError(null)
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          tanker_id: booking.tanker_id,
          rating,
          comment: comment || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit review')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setSubmitting(false)
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
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  const delivered = booking!.volume_delivered ?? 0
  const ordered = booking!.volume_ordered
  const cvConfirmed = booking!.cv_confirmed
  const isShort = delivered < ordered * 0.9

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">Delivery Complete</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isShort ? 'bg-red-950 border border-red-900' : 'bg-emerald-950 border border-emerald-900'
            }`}>
              {isShort ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <p className={`text-base font-semibold ${isShort ? 'text-red-400' : 'text-emerald-400'}`}>
                {isShort ? 'Short Delivery Detected' : `${delivered}L Delivered`}
              </p>
              <p className="text-xs text-slate-400">
                Ordered: {ordered}L
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {cvConfirmed !== undefined && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${
                cvConfirmed
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                  : 'bg-amber-950 text-amber-400 border-amber-900'
              }`}>
                CV: {cvConfirmed ? 'Verified' : 'Pending'}
              </span>
            )}
            {booking!.anomaly_flagged && (
              <span className="bg-red-950 text-red-400 border border-red-900 text-xs font-medium px-2 py-0.5 rounded-lg">
                Anomaly flagged
              </span>
            )}
          </div>
        </div>

        {receipt && (
          <div>
            <ReceiptCard receipt={receipt} />
          </div>
        )}

        {!submitted ? (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Rate your experience</p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#1E3A5F]'}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional: Add a comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-600 w-full text-sm resize-none mb-3"
            />
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-xl p-3 mb-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            <button
              disabled={submitting || rating === 0}
              onClick={handleSubmitReview}
              className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        ) : (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-base font-semibold text-white mb-1">Thank you!</p>
            <p className="text-xs text-slate-400">Your review helps improve water delivery for everyone</p>
          </div>
        )}

        <button
          onClick={() => router.push('/resident')}
          className="w-full border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-12 flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
      </motion.div>
    </div>
  )
}