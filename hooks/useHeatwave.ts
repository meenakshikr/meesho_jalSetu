'use client'

import { useState, useEffect } from 'react'
import { HeatwaveAlert } from '@/types'

export function useHeatwave(district?: string) {
  const [alert, setAlert] = useState<HeatwaveAlert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!district) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchHeatwave() {
      setLoading(true)
      try {
        const res = await fetch(`/api/heatwave?district=${encodeURIComponent(district!)}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data) setAlert(data)
      } catch { } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHeatwave()
    return () => { cancelled = true }
  }, [district])

  return { alert, loading }
}
