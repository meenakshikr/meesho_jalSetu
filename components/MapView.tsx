'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Marker {
  lat: number
  lng: number
  label?: string
  color?: string
  id?: string
}

interface MapViewProps {
  lat: number
  lng: number
  zoom?: number
  markers?: Marker[]
  route?: { lat: number; lng: number }[]
  driverLocation?: { lat: number; lng: number }
  className?: string
  height?: number
  onDriverLocationUpdate?: (loc: { lat: number; lng: number }) => void
}

function createIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function createDriverIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#0D9488;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function MapView({
  lat, lng, zoom = 14, markers = [], route, driverLocation, className = '', height = 200,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    mapInstance.current = map

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    const destIcon = createIcon('#EF4444')
    const userIcon = createIcon('#3B82F6')

    L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('Destination')

    markers.forEach(m => {
      L.marker([m.lat, m.lng], { icon: m.color ? createIcon(m.color) : destIcon })
        .addTo(map)
        .bindPopup(m.label || '')
    })

    if (driverLocation) {
      L.marker([driverLocation.lat, driverLocation.lng], { icon: createDriverIcon() })
        .addTo(map)
        .bindPopup('Driver')
    }
  }, [lat, lng, JSON.stringify(markers), driverLocation?.lat, driverLocation?.lng])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (driverLocation) {
      const bounds = L.latLngBounds([
        [lat, lng],
        [driverLocation.lat, driverLocation.lng],
      ])
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [driverLocation?.lat, driverLocation?.lng])

  useEffect(() => {
    if (!route || route.length < 2) return
    setRouteCoords(route)
  }, [JSON.stringify(route)])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || routeCoords.length < 2) return

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
    }

    const latlngs = routeCoords.map(c => [c.lat, c.lng] as [number, number])
    const line = L.polyline(latlngs, {
      color: '#0D9488',
      weight: 4,
      opacity: 0.8,
      dashArray: '8 4',
    }).addTo(map)

    routeLineRef.current = line
  }, [routeCoords])

  return <div ref={mapRef} className={`rounded-2xl overflow-hidden ${className}`} style={{ height }} />
}
