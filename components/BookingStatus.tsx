'use client'

import { BookingStatus } from '@/types'

import { CheckCircle, Truck, Package } from 'lucide-react'

const STEPS = [
  { key: 'confirmed', label: 'Booking Confirmed', icon: CheckCircle },
  { key: 'dispatched', label: 'Tanker Dispatched', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
] as const

interface BookingStatusProps {
  status: BookingStatus
}

export default function BookingStatusTimeline({ status }: BookingStatusProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === status)

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = currentIdx > i
        const active = currentIdx === i

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                done ? 'bg-teal-600 border-teal-600' : active ? 'bg-transparent border-teal-400' : 'bg-transparent border-[#1E3A5F]'
              }`}>
                <step.icon className={`w-4 h-4 ${done ? 'text-white' : active ? 'text-teal-400' : 'text-slate-600'}`} />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-teal-600' : 'bg-[#1E3A5F]'}`} />
              )}
            </div>
            <div className="pt-1.5 pb-8">
              <p className={`text-sm font-medium ${done || active ? 'text-white' : 'text-slate-500'}`}>
                {step.label}
              </p>
              {active && <p className="text-xs text-slate-500">Current status</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
