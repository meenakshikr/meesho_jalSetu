'use client'

import { Receipt } from '@/types'
import { formatINR } from '@/lib/utils'
import { Receipt as ReceiptIcon } from 'lucide-react'

interface ReceiptCardProps {
  receipt: Receipt
}

export default function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <div className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <ReceiptIcon className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Receipt</p>
        <span className="text-xs text-slate-500 ml-auto">#{receipt.id.slice(0, 8)}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Date</span>
          <span className="text-sm text-slate-200">{new Date(receipt.issued_at).toLocaleDateString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Volume</span>
          <span className="text-sm text-white">{receipt.volume_liters}L</span>
        </div>
        <div className="h-px bg-[#1E3A5F]" />
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">Amount Paid</span>
          <span className="text-lg font-bold text-teal-400">{formatINR(receipt.amount)}</span>
        </div>
      </div>
    </div>
  )
}
