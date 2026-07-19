'use client'

import { useState, useEffect } from 'react'

interface LocationState {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  permission: 'granted' | 'denied' | 'prompt' | 'unavailable'
}

const DEFAULT_LAT = 12.9716
const DEFAULT_LNG = 77.5946

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
    permission: 'prompt',
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        loading: false,
        error: 'Geolocation not supported — using default location',
        permission: 'unavailable',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
          permission: 'granted',
        })
      },
      (err) => {
        setLocation({
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          loading: false,
          error: err.code === 1 ? 'Location access denied — using default' : 'Could not get location — using default',
          permission: err.code === 1 ? 'denied' : 'unavailable',
        })
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    )
  }, [])

  return location
}
