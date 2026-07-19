'use client'

import { HeatwaveAlert } from '@/types'
import { getHeatwaveSeverityLabel } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'

interface HeatwaveBannerProps {
  alert: HeatwaveAlert
  onDismiss?: () => void
}

export default function HeatwaveAlertBanner({ alert, onDismiss }: HeatwaveBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-950 border border-amber-900 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
            {getHeatwaveSeverityLabel(alert.severity)}
          </span>
        </div>
        <span className="text-xs font-bold text-amber-300">{alert.temperature}°C</span>
      </div>
      <p className="text-sm text-amber-200 leading-relaxed">{alert.ai_advisory}</p>
      {onDismiss && (
        <button
          onClick={() => { setDismissed(true); onDismiss() }}
          className="mt-2 text-xs text-amber-400 font-medium flex items-center gap-1"
        >
          Dismiss <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  )
}
