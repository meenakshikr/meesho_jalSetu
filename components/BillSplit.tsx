'use client'

import { BillSplitItem } from '@/types'
import { formatINR } from '@/lib/utils'
import { User } from 'lucide-react'

interface BillSplitProps {
  items: BillSplitItem[]
  totalAmount: number
  totalVolume: number
}

export default function BillSplit({ items, totalAmount, totalVolume }: BillSplitProps) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Bill Split</p>
      <div>
        {items.map((item) => (
          <div key={item.user_id} className="flex items-center justify-between py-3 border-b border-[#1E3A5F] last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-950 border border-teal-900 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <span className="text-sm text-slate-200">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{formatINR(item.share_amount)}</p>
              <p className="text-xs text-slate-400">{item.share_liters}L</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 pt-3 border-t border-[#1E3A5F]">
        <span className="text-xs text-slate-400">Total</span>
        <span className="text-sm font-semibold text-white">{formatINR(totalAmount)} · {totalVolume}L</span>
      </div>
    </div>
  )
}
