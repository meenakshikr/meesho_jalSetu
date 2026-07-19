'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NudgeLog } from '@/types'
import { LoadingSkeleton, ErrorState } from '@/components/ui/LoadingSkeleton'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Bell, User as UserIcon, Clock } from 'lucide-react'

export default function NudgeHistoryPage() {
  const router = useRouter()
  const [nudges, setNudges] = useState<NudgeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/nudges')
      if (!res.ok) throw new Error('Failed to load nudges')
      const data: NudgeLog[] = await res.json()
      setNudges(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto space-y-4">
          <LoadingSkeleton type="text" lines={1} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#021B3A] px-4 py-6">
        <div className="max-w-[430px] mx-auto">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#021B3A] pb-24">
      <div className="sticky top-0 z-20 bg-[#021B3A]/95 backdrop-blur-md border-b border-[#1E3A5F] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-[#0A2744] transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">Nudge History</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 py-4 space-y-3"
      >
        <div className="max-w-[430px] md:max-w-3xl mx-auto space-y-3">
          {nudges.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-[#0A2744] border border-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 mb-1">No nudges sent yet.</p>
              <p className="text-xs text-slate-500">Nudges sent to users will appear here.</p>
            </div>
          ) : (
            nudges.map(nudge => (
              <div
                key={nudge.id}
                className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#021B3A] border border-[#1E3A5F] rounded-xl flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{nudge.user_id.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-500">{nudge.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {new Date(nudge.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="bg-[#021B3A] rounded-xl p-3">
                  <p className="text-sm text-slate-200">{nudge.message}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                    nudge.read
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                      : 'bg-[#021B3A] text-slate-400 border-[#1E3A5F]'
                  }`}>
                    {nudge.read ? 'Read' : 'Unread'}
                  </span>
                  <Send className="w-4 h-4 text-teal-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
