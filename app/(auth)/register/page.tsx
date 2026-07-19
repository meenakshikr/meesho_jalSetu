'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserRole } from '@/types'
import { createSupabaseClient } from '@/lib/supabase-client'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Phone, Droplets, MapPin, Shield, Truck, Home } from 'lucide-react'

const ROLE_ROUTES: Record<string, string> = {
  resident: '/resident',
  coordinator: '/coordinator',
  driver: '/driver',
  owner: '/owner',
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  resident: <Home className="w-4 h-4" />,
  coordinator: <Shield className="w-4 h-4" />,
  driver: <Truck className="w-4 h-4" />,
  owner: <User className="w-4 h-4" />,
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('resident')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [wards, setWards] = useState<{ id: string; name: string }[]>([])
  const [selectedWard, setSelectedWard] = useState('')
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([])
  const [selectedOwner, setSelectedOwner] = useState('')

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await fetch('/api/wards')
        if (res.ok) {
          const data = await res.json()
          setWards(data)
        }
      } catch {
        //wards unavailable
      }
    }
    const fetchOwners = async () => {
      try {
        const res = await fetch('/api/users?role=owner')
        if (res.ok) {
          const data = await res.json()
          setOwners(data)
        }
      } catch {
        //owners unavailable
      }
    }
    fetchWards()
    fetchOwners()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseClient()

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          role,
          ward_id: selectedWard || null,
          owner_id: (role === 'driver' && selectedOwner) ? selectedOwner : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        window.location.href = '/login'
        return
      }

      window.location.href = ROLE_ROUTES[role] || '/resident'
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
          <p className="text-sm text-slate-400 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="bg-[#0A2744] border border-[#1E3A5F] rounded-2xl p-5 space-y-4">
          {error && (
            <div className="bg-red-950 border border-red-900 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                placeholder="9999999901"
                required
              />
            </div>
          </div>

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
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['resident', 'coordinator', 'driver', 'owner'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl text-sm font-medium capitalize flex items-center justify-center gap-2 transition-colors ${
                    role === r
                      ? 'bg-teal-600 text-white'
                      : 'bg-[#0A2744] text-slate-400 border border-[#1E3A5F] hover:bg-[#0A2744]/80'
                  }`}
                >
                  {ROLE_ICONS[r]}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {(role === 'resident' || role === 'coordinator') && wards.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Ward <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                  required
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {role === 'driver' && owners.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Owner</label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="bg-[#0A2744] border border-[#1E3A5F] text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 h-12 focus:outline-none focus:border-teal-600 w-full text-sm"
                >
                  <option value="">Select owner</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold rounded-xl h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <User className="w-4 h-4" />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-400 font-medium hover:text-teal-300 transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}