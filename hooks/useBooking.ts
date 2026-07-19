'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import { Booking } from '@/types'

export function useBooking(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/bookings/${bookingId}`)
      if (!res.ok) throw new Error('Failed to fetch booking')
      const data = await res.json()
      setBooking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  useEffect(() => {
    if (!bookingId) return

    const channel = supabase
      .channel('booking_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          setBooking((prev) => prev ? { ...prev, ...(payload.new as Partial<Booking>) } : null)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId, supabase])

  return { booking, loading, error, refetch: fetchBooking }
}
