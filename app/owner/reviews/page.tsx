'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { cn } from '@/lib/utils'
import type { Tanker, Review } from '@/types'

interface TankerReviews {
  tanker: Tanker
  reviews: Review[]
  avgRating: number
}

export default function OwnerReviewsPage() {
  const router = useRouter()
  const [tankerReviewsList, setTankerReviewsList] = useState<TankerReviews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchReviews() {
    setLoading(true)
    setError(null)
    try {
      const fleetRes = await fetch('/api/owner/fleet')
      if (!fleetRes.ok) throw new Error('Failed to fetch fleet')
      const fleetData = await fleetRes.json()
      const tankers: Tanker[] = fleetData.tankers || []

      const results = await Promise.all(
        tankers.map(async (tanker) => {
          try {
            const reviewRes = await fetch(`/api/reviews/tanker/${tanker.id}`)
            if (!reviewRes.ok) return { tanker, reviews: [], avgRating: tanker.rating }
            const reviewData = await reviewRes.json()
            const reviews: Review[] = reviewData.reviews || []
            const avgRating =
              reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : tanker.rating
            return { tanker, reviews, avgRating }
          } catch {
            return { tanker, reviews: [], avgRating: tanker.rating }
          }
        })
      )

      setTankerReviewsList(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const totalReviews = tankerReviewsList.reduce((sum, tr) => sum + tr.reviews.length, 0)
  const overallAvg =
    tankerReviewsList.length > 0
      ? tankerReviewsList.reduce((sum, tr) => sum + tr.avgRating, 0) / tankerReviewsList.length
      : 0

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
          <h1 className="text-xl font-semibold text-white">Reviews & Ratings</h1>
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
          <h1 className="text-xl font-semibold text-white">Reviews & Ratings</h1>
        </div>
        <div className="px-4 py-4 space-y-3">
          <ErrorState message={error} onRetry={fetchReviews} />
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
        <h1 className="text-xl font-semibold text-white">Reviews & Ratings</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        {tankerReviewsList.length === 0 ? (
          <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
            <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center py-2">No tankers found</p>
          </div>
        ) : (
          <>
            <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <p className="text-4xl font-bold text-white">{overallAvg.toFixed(1)}</p>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < Math.round(overallAvg) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{totalReviews} total reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{tankerReviewsList.length} tankers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span className="text-sm text-teal-400 font-medium">95% response rate</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {tankerReviewsList.map(({ tanker, reviews, avgRating }) => (
                <div key={tanker.id}>
                  <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{tanker.operator_name}</h3>
                          <p className="text-xs text-slate-400">{tanker.vehicle_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3.5 h-3.5',
                                i < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
                      <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                      <p className="text-sm text-slate-400 text-center py-2">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'w-4 h-4',
                                    i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(review.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-200 mb-1">{review.comment}</p>
                          )}
                          <p className="text-xs text-slate-400">
                            {review.user?.name || 'Anonymous'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
