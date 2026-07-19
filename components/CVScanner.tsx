'use client'

import { useState, useRef } from 'react'
import { Camera, CheckCircle, RotateCcw } from 'lucide-react'

interface CVScannerProps {
  onCapture: (beforeFile: File, afterFile: File) => void
  result?: {
    volume_estimate: number
    estimated_liters: number
    confidence: number
    verdict: string
    discrepancy_liters: number
    before_fill_percent?: number
    after_fill_percent?: number
  } | null
  loading?: boolean
}

export default function CVScanner({ onCapture, result, loading }: CVScannerProps) {
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [step, setStep] = useState<'before' | 'after' | 'ready'>('before')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)

    if (step === 'before') {
      setBeforePreview(url)
      setBeforeFile(file)
    } else if (step === 'after') {
      setAfterPreview(url)
      setAfterFile(file)
      setStep('ready')
    }
    e.target.value = ''
  }

  const handleAnalyze = () => {
    if (beforeFile && afterFile) {
      onCapture(beforeFile, afterFile)
    }
  }

  const handleRetake = (which: 'before' | 'after') => {
    if (which === 'before') {
      setBeforePreview(null)
      setBeforeFile(null)
      setAfterPreview(null)
      setAfterFile(null)
      setStep('before')
    } else {
      setAfterPreview(null)
      setAfterFile(null)
      setStep('after')
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {step === 'before' && !beforePreview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-48 border border-dashed border-[#1E3A5F] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-teal-600/40 transition-colors bg-[#0A2744]"
        >
          <Camera className="w-8 h-8 text-slate-500" />
          <span className="text-sm text-slate-400">Photo 1 of 2 — Before Delivery</span>
          <span className="text-xs text-slate-500">Photograph tanker tank before pumping water</span>
        </button>
      )}

      {step === 'before' && beforePreview && (
        <div className="space-y-3">
          <div className="relative">
            <img src={beforePreview} alt="Before" className="w-full h-48 object-cover rounded-2xl border border-[#1E3A5F]" />
            <span className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-medium">Before</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRetake('before')}
              className="flex-1 border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-11 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={() => setStep('after')}
              className="flex-1 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm & Next
            </button>
          </div>
        </div>
      )}

      {step === 'after' && !afterPreview && (
        <div className="space-y-3">
          {beforePreview && (
            <div className="relative">
              <img src={beforePreview} alt="Before" className="w-full h-32 object-cover rounded-2xl border border-emerald-700 opacity-60" />
              <span className="absolute top-2 left-2 bg-emerald-900/80 text-emerald-300 px-2 py-1 rounded-lg text-xs font-medium">Before ✓</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-48 border border-dashed border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-500/70 transition-colors bg-[#0A2744]"
          >
            <Camera className="w-8 h-8 text-amber-400" />
            <span className="text-sm text-amber-300">Photo 2 of 2 — After Delivery</span>
            <span className="text-xs text-slate-500">Photograph tanker tank after pumping water</span>
          </button>
        </div>
      )}

      {step === 'ready' && beforePreview && afterPreview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <img src={beforePreview} alt="Before" className="w-full h-32 object-cover rounded-2xl border border-[#1E3A5F]" />
              <span className="absolute top-1 left-1 bg-black/60 text-white px-2 py-0.5 rounded-lg text-xs">Before</span>
            </div>
            <div className="relative">
              <img src={afterPreview} alt="After" className="w-full h-32 object-cover rounded-2xl border border-[#1E3A5F]" />
              <span className="absolute top-1 left-1 bg-black/60 text-white px-2 py-0.5 rounded-lg text-xs">After</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRetake('after')}
              className="border border-[#1E3A5F] hover:bg-[#0A2744] text-slate-300 font-medium rounded-xl h-11 px-4 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze Volume'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full" />
          <span className="ml-2 text-sm text-slate-400">AI analyzing before & after photos...</span>
        </div>
      )}

      {result && (
        <div className={`rounded-2xl p-4 border ${
          result.verdict === 'confirmed'
            ? 'bg-emerald-950 border-emerald-900'
            : result.verdict === 'excess'
            ? 'bg-amber-950 border-amber-900'
            : 'bg-red-950 border-red-900'
        }`}>
          <div className="space-y-2">
            {result.before_fill_percent != null && result.after_fill_percent != null && (
              <div className="flex gap-4 text-xs text-slate-400">
                <span>Before: {result.before_fill_percent}%</span>
                <span>After: {result.after_fill_percent}%</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {result.verdict === 'confirmed' && (
                <span className="text-emerald-400 text-sm font-semibold">{result.estimated_liters}L delivered — matched {result.volume_estimate ?? ''}L order</span>
              )}
              {result.verdict === 'short' && (
                <span className="text-red-400 text-sm font-semibold">Short by {Math.abs(result.discrepancy_liters)}L — dispute raised</span>
              )}
              {result.verdict === 'excess' && (
                <span className="text-amber-400 text-sm font-semibold">Excess: {result.estimated_liters}L delivered</span>
              )}
            </div>
            <p className="text-xs text-slate-400">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
