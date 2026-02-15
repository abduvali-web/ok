'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

type LatLng = { lat: number; lng: number }

export type DispatchMapMarker = {
  id: string
  position: LatLng
  color: string
  label: string
  popup?: string
}

export type DispatchMapPolyline = {
  id: string
  color: string
  positions: LatLng[]
}

// Fix Leaflet default icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function createLabeledIcon(color: string, label: string) {
  const safeLabel = String(label ?? '')
  const html = `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 9999px;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
      display:flex;
      align-items:center;
      justify-content:center;
      color: #0b1220;
      font-weight: 800;
      font-size: 12px;
    ">
      ${safeLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  })
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 13, { duration: 0.5 })
  }, [center, map])
  return null
}

export default function DispatchLeafletMap({
  warehouse,
  markers,
  polylines,
}: {
  warehouse?: LatLng | null
  markers: DispatchMapMarker[]
  polylines: DispatchMapPolyline[]
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const center = useMemo<[number, number]>(() => {
    if (warehouse) return [warehouse.lat, warehouse.lng]
    if (markers.length > 0) return [markers[0].position.lat, markers[0].position.lng]
    return [41.2995, 69.2401]
  }, [markers, warehouse])

  if (!isMounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg" />

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {warehouse && (
        <Marker position={[warehouse.lat, warehouse.lng]} icon={defaultIcon}>
          <Popup>Склад (точка старта)</Popup>
        </Marker>
      )}

      {polylines.map((line) => (
        <Polyline
          key={line.id}
          positions={line.positions.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: line.color, weight: 4, opacity: 0.8 }}
        />
      ))}

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.position.lat, m.position.lng]}
          icon={createLabeledIcon(m.color, m.label)}
        >
          <Popup>{m.popup || m.label}</Popup>
        </Marker>
      ))}

      <MapUpdater center={center} />
    </MapContainer>
  )
}

