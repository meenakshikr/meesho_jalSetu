'use client'

import { Tanker } from '@/types'
import { formatINR } from '@/lib/utils'
import { Truck, Shield, Star } from 'lucide-react'

interface TankerCardProps {
  tanker: Tanker
  onClick?: () => void
  showAiReason?: boolean
}

export default function TankerCard({ tanker, onClick, showAiReason }: TankerCardProps) {
  const rating = tanker.rating ?? 5.0

  return (
    <div
      onClick={onClick}
      className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4 space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-950 border border-teal-900 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{tanker.operator_name}</p>
            <p className="text-xs text-slate-400">{tanker.vehicle_number}</p>
          </div>
        </div>
        {tanker.is_certified && (
          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs font-medium px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" />
            Certified
          </span>
        )}
      </div>

      <div className="h-px bg-[#1E3A5F]" />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Price/Liter</p>
          <p className="text-teal-400 font-bold text-base">{formatINR(tanker.price_per_liter)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Capacity</p>
          <p className="text-white font-semibold text-sm">{tanker.capacity_liters}L</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Distance</p>
          <p className="text-white font-semibold text-sm">
            {tanker.distance_km != null ? `${Number(tanker.distance_km).toFixed(1)} km` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
          ))}
          <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-slate-400">{tanker.total_deliveries} deliveries</span>
      </div>

      {showAiReason && tanker.ai_rank_reason && (
        <div className="bg-teal-950/50 border border-teal-900/50 rounded-lg px-3 py-2">
          <p className="text-xs text-teal-300">{tanker.ai_rank_reason}</p>
        </div>
      )}
    </div>
  )
}
