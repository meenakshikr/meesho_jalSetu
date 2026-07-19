'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tanker, User } from '@/types'
import { useLocation } from '@/hooks/useLocation'
import TankerCard from '@/components/TankerCard'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin } from 'lucide-react'

type FilterMode = 'all' | 'certified' | 'lowest'

function MarketplaceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCommunity = searchParams.get('community') === 'true'
  const { lat, lng, error: locationError } = useLocation()
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [user, setUser] = useState<User | null>(null)

  const fetchTankers = async (userWardId?: string, userLat?: number | null, userLng?: number | null) => {
    try {
      setLoading(true)
      setError(null)

      if (userWardId) {
        const res = await fetch('/api/ai/rank-tankers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ward_id: userWardId,
            volume_needed: 2000,
            user_lat: userLat ?? lat,
            user_lng: userLng ?? lng,
          }),
        })
        if (!res.ok) throw new Error('Failed to fetch ranked tankers')
        const data = await res.json()
        setTankers((data.tankers || []).filter((t: Tanker) => t.is_available))
      } else {
        const params = new URLSearchParams()
        if (lat && lng) {
          params.set('lat', String(lat))
          params.set('lng', String(lng))
        }
        const res = await fetch(`/api/tankers?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch tankers')
        const data = await res.json()
        if (Array.isArray(data)) {
          setTankers(data.filter((t: Tanker) => t.is_available))
        } else if (data.error) {
          throw new Error(data.error)
        } else {
          setTankers([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const userData: User = await res.json()
          setUser(userData)
          fetchTankers(userData.ward_id || undefined)
          return
        }
      } catch {}
      fetchTankers()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  const filteredTankers = useMemo(() => {
    let result = [...tankers]
    if (filter === 'certified') result = result.filter((t) => t.is_certified)
    if (filter === 'lowest') result.sort((a, b) => a.price_per_liter - b.price_per_liter)
    return result
  }, [tankers, filter])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasAiRanked = tankers.some((t: any) => t.ai_rank_score)

  if (loading) {
    return (
      <div className="px-4 py-4">
        <LoadingSkeleton type="list" lines={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <ErrorState message={error} onRetry={() => fetchTankers(user?.ward_id || undefined)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">
          {isCommunity ? 'Community Booking' : 'Marketplace'}
        </h1>
      </div>

      {locationError && (
        <div className="mx-4 mt-3 bg-amber-950/50 border border-amber-900 rounded-xl px-3 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">{locationError}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <p className="text-xs text-slate-400">
          {filteredTankers.length} tankers available nearby
          {hasAiRanked && ' — ranked by AI'}
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            { key: 'all', label: 'All' },
            { key: 'certified', label: 'Certified Only' },
            { key: 'lowest', label: 'Lowest Price' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-xl px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#0A2744] text-slate-400 border border-[#1E3A5F] hover:bg-[#0D2D4F]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredTankers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-base text-slate-400 mb-1">No tankers found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTankers.map((tanker) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const showAi = !!(tanker as any).ai_rank_score
              return (
                <TankerCard
                  key={tanker.id}
                  tanker={tanker}
                  showAiReason={showAi}
                  onClick={() => router.push(`/resident/booking/${tanker.id}`)}
                />
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function Marketplace() {
  return (
    <Suspense fallback={<div className="px-4 py-4"><LoadingSkeleton type="list" lines={5} /></div>}>
      <MarketplaceContent />
    </Suspense>
  )
}
