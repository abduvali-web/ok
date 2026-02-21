'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Admin, Client, Order } from '@/components/admin/dashboard/types'
import { extractCoordsFromText } from '@/lib/geo'
import { getCourierColor } from '@/lib/courier-colors'
import { Layers, LocateFixed, Navigation, RefreshCw, Users } from 'lucide-react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LiveMapPoint = {
  id: string
  name: string
  lat: number
  lng: number
}

type OrderPoint = {
  id: string
  orderNumber: number
  customerName: string
  status: string
  lat: number
  lng: number
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizePoints(points: LiveMapPoint[]) {
  return [...points].sort((a, b) => a.id.localeCompare(b.id))
}

function equalPoints(a: LiveMapPoint[], b: LiveMapPoint[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].name !== b[i].name ||
      a[i].lat !== b[i].lat ||
      a[i].lng !== b[i].lng
    ) {
      return false
    }
  }
  return true
}

function toCourierPoints(couriers: Admin[]): LiveMapPoint[] {
  return normalizePoints(
    couriers
      .filter((c) => isFiniteCoord(c.latitude) && isFiniteCoord(c.longitude))
      .map((c) => ({
        id: c.id,
        name: c.name || 'Courier',
        lat: c.latitude as number,
        lng: c.longitude as number,
      }))
  )
}

function toClientPoints(clients: Client[]): LiveMapPoint[] {
  return normalizePoints(
    clients
      .filter((c) => isFiniteCoord(c.latitude) && isFiniteCoord(c.longitude))
      .map((c) => ({
        id: c.id,
        name: c.nickName?.trim() || c.name || 'Client',
        lat: c.latitude as number,
        lng: c.longitude as number,
      }))
  )
}

function toOrderPoints(orders: Order[]): OrderPoint[] {
  return orders
    .map((o) => {
      const parsed = extractCoordsFromText(o.deliveryAddress || '')
      const lat = isFiniteCoord(o.latitude) ? o.latitude : parsed?.lat
      const lng = isFiniteCoord(o.longitude) ? o.longitude : parsed?.lng
      if (!isFiniteCoord(lat) || !isFiniteCoord(lng)) return null
      return {
        id: o.id,
        orderNumber: typeof o.orderNumber === 'number' ? o.orderNumber : 0,
        customerName: o.customer?.name || o.customerName || 'Client',
        status: o.orderStatus || 'NEW',
        lat,
        lng,
      } satisfies OrderPoint
    })
    .filter((item): item is OrderPoint => !!item)
}

function createCourierIcon(color: string, label: string) {
  const safeLabel = String(label || '?').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 2).toUpperCase()
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `
      <div style="
        width:34px;
        height:34px;
        border-radius:9999px;
        background:${color};
        border:2px solid rgba(255,255,255,0.95);
        display:flex;
        align-items:center;
        justify-content:center;
        color:#0f172a;
        font-size:11px;
        font-weight:800;
        box-shadow:0 10px 24px rgba(2, 6, 23, 0.35);
      ">
        ${safeLabel}
      </div>
    `,
  })
}

function FitToVisiblePoints({ points, fitTick }: { points: Array<[number, number]>; fitTick: number }) {
  const map = useMap()

  useEffect(() => {
    if (fitTick <= 0 || points.length === 0) return
    const task = setTimeout(() => {
      map.invalidateSize()
      if (points.length === 1) {
        map.flyTo(points[0], 14, { duration: 0.5 })
        return
      }
      map.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 15,
      })
    }, 20)

    return () => clearTimeout(task)
  }, [fitTick, map, points])

  return null
}

export default function MiddleLiveMap({
  active,
  couriers,
  clients,
  orders,
}: {
  active: boolean
  couriers: Admin[]
  clients: Client[]
  orders: Order[]
}) {
  const [liveCouriers, setLiveCouriers] = useState<LiveMapPoint[]>(() => toCourierPoints(couriers))
  const [liveClients, setLiveClients] = useState<LiveMapPoint[]>(() => toClientPoints(clients))
  const [showCouriers, setShowCouriers] = useState(true)
  const [showClients, setShowClients] = useState(true)
  const [showOrders, setShowOrders] = useState(true)
  const [fitTick, setFitTick] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const didAutofitRef = useRef(false)
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const etagRef = useRef<string | null>(null)

  useEffect(() => {
    const fallback = toCourierPoints(couriers)
    setLiveCouriers((prev) => (equalPoints(prev, fallback) ? prev : fallback))
  }, [couriers])

  useEffect(() => {
    const fallback = toClientPoints(clients)
    setLiveClients((prev) => (equalPoints(prev, fallback) ? prev : fallback))
  }, [clients])

  const orderPoints = useMemo(() => toOrderPoints(orders), [orders])

  const courierIcons = useMemo(() => {
    const iconMap = new Map<string, L.DivIcon>()
    for (const point of liveCouriers) {
      const color = getCourierColor(point.id)
      iconMap.set(point.id, createCourierIcon(color, point.name.slice(0, 2)))
    }
    return iconMap
  }, [liveCouriers])

  const visiblePoints = useMemo<Array<[number, number]>>(() => {
    const next: Array<[number, number]> = []
    if (showCouriers) {
      for (const p of liveCouriers) next.push([p.lat, p.lng])
    }
    if (showClients) {
      for (const p of liveClients) next.push([p.lat, p.lng])
    }
    if (showOrders) {
      for (const p of orderPoints) next.push([p.lat, p.lng])
    }
    return next
  }, [liveClients, liveCouriers, orderPoints, showClients, showCouriers, showOrders])

  const mapCenter = useMemo<[number, number]>(() => {
    if (visiblePoints.length > 0) return visiblePoints[0]
    return [41.2995, 69.2401]
  }, [visiblePoints])

  useEffect(() => {
    if (didAutofitRef.current) return
    if (visiblePoints.length === 0) return
    didAutofitRef.current = true
    setFitTick((v) => v + 1)
  }, [visiblePoints.length])

  const syncLiveData = useCallback(async () => {
    if (!active || typeof document === 'undefined' || document.hidden) return
    if (inFlightRef.current) return

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    inFlightRef.current = true
    setIsSyncing(true)

    try {
      const headers: HeadersInit = {}
      if (etagRef.current) headers['If-None-Match'] = etagRef.current

      const res = await fetch('/api/admin/live-map', {
        method: 'GET',
        cache: 'no-store',
        headers,
        signal: controller.signal,
      })

      if (res.status === 304) {
        setLastSyncAt(new Date().toISOString())
        return
      }
      if (!res.ok) return

      const nextEtag = res.headers.get('etag')
      if (nextEtag) etagRef.current = nextEtag

      const data = await res.json().catch(() => null)
      const nextCouriers = normalizePoints(
        Array.isArray(data?.couriers)
          ? data.couriers
              .filter((item: any) => isFiniteCoord(item?.lat) && isFiniteCoord(item?.lng) && typeof item?.id === 'string')
              .map((item: any) => ({
                id: item.id,
                name: typeof item?.name === 'string' && item.name.trim() ? item.name : 'Courier',
                lat: item.lat,
                lng: item.lng,
              }))
          : []
      )
      const nextClients = normalizePoints(
        Array.isArray(data?.clients)
          ? data.clients
              .filter((item: any) => isFiniteCoord(item?.lat) && isFiniteCoord(item?.lng) && typeof item?.id === 'string')
              .map((item: any) => ({
                id: item.id,
                name: typeof item?.name === 'string' && item.name.trim() ? item.name : 'Client',
                lat: item.lat,
                lng: item.lng,
              }))
          : []
      )

      setLiveCouriers((prev) => (equalPoints(prev, nextCouriers) ? prev : nextCouriers))
      setLiveClients((prev) => (equalPoints(prev, nextClients) ? prev : nextClients))
      setLastSyncAt(typeof data?.serverTime === 'string' ? data.serverTime : new Date().toISOString())
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Live map sync failed:', error)
      }
    } finally {
      inFlightRef.current = false
      setIsSyncing(false)
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    void syncLiveData()
    const intervalId = setInterval(() => {
      void syncLiveData()
    }, 6000)

    const onVisibility = () => {
      if (!document.hidden) void syncLiveData()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
      abortRef.current?.abort()
    }
  }, [active, syncLiveData])

  return (
    <Card className="relative overflow-hidden border border-cyan-200/50 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_35%)] p-3 shadow-md sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-900 p-1.5 text-white">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Realtime Ops</p>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Live courier + client map</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => setFitTick((v) => v + 1)}
            >
              <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
              Center
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => void syncLiveData()}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] text-white">
            Couriers: {liveCouriers.length}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] text-cyan-800">
            Clients: {liveClients.length}
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] text-amber-800">
            Orders: {orderPoints.length}
          </Badge>
          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px]">
            <Layers className="mr-1 h-3 w-3" />
            Layers
          </Badge>
          {lastSyncAt && (
            <span className="text-[11px] text-muted-foreground">
              Updated {new Date(lastSyncAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={showCouriers ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCouriers((v) => !v)}
            className="h-8 rounded-full px-3 text-xs"
          >
            <Navigation className="mr-1.5 h-3.5 w-3.5" />
            Couriers
          </Button>
          <Button
            type="button"
            variant={showClients ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowClients((v) => !v)}
            className="h-8 rounded-full px-3 text-xs"
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Clients
          </Button>
          <Button
            type="button"
            variant={showOrders ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOrders((v) => !v)}
            className="h-8 rounded-full px-3 text-xs"
          >
            Orders
          </Button>
        </div>

        <div className="h-[360px] overflow-hidden rounded-xl border border-slate-200/70 bg-card shadow-inner sm:h-[430px]">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl
            preferCanvas
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              updateWhenIdle
              updateWhenZooming={false}
              keepBuffer={4}
            />

            {showClients &&
              liveClients.map((client) => (
                <CircleMarker
                  key={`client-${client.id}`}
                  center={[client.lat, client.lng]}
                  radius={4}
                  pathOptions={{
                    color: '#0f172a',
                    weight: 1,
                    fillColor: '#22d3ee',
                    fillOpacity: 0.75,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Client</div>
                      <div className="text-sm font-semibold">{client.name}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {showOrders &&
              orderPoints.map((order) => (
                <CircleMarker
                  key={`order-${order.id}`}
                  center={[order.lat, order.lng]}
                  radius={6}
                  pathOptions={{
                    color: '#92400e',
                    weight: 1,
                    fillColor: '#f59e0b',
                    fillOpacity: 0.8,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-amber-700">Order #{order.orderNumber}</div>
                      <div className="text-sm font-semibold">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">Status: {order.status}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

            {showCouriers &&
              liveCouriers.map((courier) => (
                <Marker
                  key={`courier-${courier.id}`}
                  position={[courier.lat, courier.lng]}
                  icon={courierIcons.get(courier.id)}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Courier</div>
                      <div className="text-sm font-semibold">{courier.name}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            <FitToVisiblePoints points={visiblePoints} fitTick={fitTick} />
          </MapContainer>
        </div>
      </div>
    </Card>
  )
}
