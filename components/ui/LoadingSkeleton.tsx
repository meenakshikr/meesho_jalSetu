'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Package } from 'lucide-react'

export function LoadingSkeleton({ className, lines = 3, type = 'text' }: {
  className?: string
  lines?: number
  type?: 'text' | 'card' | 'list' | 'avatar' | 'button'
}) {
  if (type === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#1E3A5F] rounded w-3/4" />
                <div className="h-2 bg-[#1E3A5F] rounded w-1/2" />
              </div>
            </div>
            <div className="h-px bg-[#1E3A5F]" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => <div key={j} className="h-8 bg-[#1E3A5F] rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="h-32 bg-[#0A2744] border border-[#1E3A5F] rounded-2xl animate-pulse" />
        <div className="h-4 bg-[#1E3A5F] rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-[#1E3A5F] rounded w-1/2 animate-pulse" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('h-4 bg-[#1E3A5F] rounded animate-pulse', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-950 border border-red-900 rounded-2xl p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-red-300 mb-1">Something went wrong</p>
      <p className="text-xs text-red-400 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="bg-red-900 hover:bg-red-800 text-red-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Try Again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#0A2744] border border-[#1E3A5F] flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-7 h-7 text-slate-500" /> : <Package className="w-7 h-7 text-slate-500" />}
      </div>
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-slate-400 max-w-[200px]">{description}</p>
    </div>
  )
}
