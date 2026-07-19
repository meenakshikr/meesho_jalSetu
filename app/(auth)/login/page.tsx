'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase-client'
import { motion } from 'framer-motion'
import { Droplets, Mail, Lock } from 'lucide-react'

const ROLE_ROUTES: Record<string, string> = {
  resident: '/resident',
  coordinator: '/coordinator',
  driver: '/driver',
  owner: '/owner',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (!profile) {
        setError('User profile not found. Please register first.')
        return
      }

      window.location.href = ROLE_ROUTES[profile.role] || '/resident'
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#021B3A] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[430px]"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">JalSetu</h1>
          <p className="text-sm text-slate-400 mt-2">Water for Everyone</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-5 space-y-4">
          {error && (
            <div className="bg-red-950 border border-red-900 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Droplets className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-teal-400 font-medium hover:text-teal-300 transition-colors">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}