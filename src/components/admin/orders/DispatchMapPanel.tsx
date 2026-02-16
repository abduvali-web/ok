'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Admin, Order } from '@/components/admin/dashboard/types'
import { extractCoordsFromText, isShortGoogleMapsUrl, type LatLng } from '@/lib/geo'
import { getCourierColor } from '@/lib/courier-colors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GripVertical, RefreshCw, Save, Route, Users } from 'lucide-react'

const DispatchLeafletMap = dynamic(() => import('./DispatchLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
      Загрузка карты...
    </div>
  ),
})

type ContainerId = string

function haversineDistance(a: LatLng, b: LatLng) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function optimizeNearestNeighbor(startPoint: LatLng, locations: Array<{ id: string; coords: LatLng }>) {
  if (locations.length <= 1) return locations.map((l) => l.id)

  const visited = new Set<string>()
  const route: string[] = []
  let current = startPoint

  while (visited.size < locations.length) {
    let bestId: string | null = null
    let bestDist = Infinity

    for (const loc of locations) {
      if (visited.has(loc.id)) continue
      const d = haversineDistance(current, loc.coords)
      if (d < bestDist) {
        bestDist = d
        bestId = loc.id
      }
    }

    if (!bestId) break
    visited.add(bestId)
    route.push(bestId)
    const picked = locations.find((l) => l.id === bestId)
    if (picked) current = picked.coords
  }

  return route
}

function findContainerForId(containers: Record<ContainerId, string[]>, id: string): ContainerId | null {
  if (id in containers) return id
  for (const key of Object.keys(containers)) {
    if (containers[key].includes(id)) return key
  }
  return null
}

function renumberInOrder(
  orderIds: string[],
  orderNumberById: Record<string, number | undefined>
): Record<string, number | undefined> {
  const numbers = orderIds.map((id) => orderNumberById[id]).filter((n): n is number => typeof n === 'number').sort((a, b) => a - b)
  const next = { ...orderNumberById }
  for (let i = 0; i < orderIds.length; i++) {
    const id = orderIds[i]
    const n = numbers[i]
    if (typeof n === 'number') next[id] = n
  }
  return next
}

function extractShortGoogleMapsUrl(input: string): string | null {
  if (!input) return null
  const match = input.match(/https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl)\/[^\s)]+/i)
  return match ? match[0] : null
}

function extractAnyUrl(input: string): string | null {
  if (!input) return null
  const match = input.match(/https?:\/\/[^\s)]+/i)
  return match ? match[0] : null
}

function isGoogleMapsLikeUrl(url: string): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  return (
    u.includes('google.com/maps') ||
    u.includes('maps.google.com') ||
    u.includes('maps.app.goo.gl') ||
    u.includes('goo.gl/maps')
  )
}

function SortableOrderItem({
  order,
  color,
  courierName,
  number,
  coords,
  onNumberChange,
}: {
  order: Order
  color: string
  courierName: string
  number: number
  coords: LatLng | null | undefined
  onNumberChange: (next: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-md border bg-background p-2 ${isDragging ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <div className="font-semibold text-sm truncate">#{number}</div>
          {!coords && <Badge variant="outline" className="text-[10px]">Без координат</Badge>}
        </div>
        <div className="text-xs text-slate-600 truncate">{order.customer?.name || order.customerName || 'Клиент'}</div>
        <div className="text-[11px] text-slate-400 truncate">{order.deliveryAddress}</div>
        <div className="mt-1 text-[10px] text-slate-400 truncate">Курьер: {courierName}</div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <Input
          type="number"
          value={number}
          onChange={(e) => onNumberChange(parseInt(e.target.value, 10))}
          className="h-8 w-24 text-sm"
        />
      </div>
    </div>
  )
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-primary/40 rounded-lg' : undefined}>
      {children}
    </div>
  )
}

export function DispatchMapPanel({
  open,
  onOpenChange,
  orders,
  couriers,
  selectedDateLabel,
  warehousePoint,
  autoSortOnOpen = true,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: Order[]
  couriers: Admin[]
  selectedDateLabel: string
  warehousePoint: LatLng | null
  autoSortOnOpen?: boolean
  onSaved: () => void
}) {
  const safeOrders: Order[] = Array.isArray(orders) ? orders : []
  const safeCouriers: Admin[] = Array.isArray(couriers) ? couriers : []

  const UNASSIGNED = 'unassigned'
  const [containers, setContainers] = useState<Record<ContainerId, string[]>>({})
  const [orderNumberById, setOrderNumberById] = useState<Record<string, number>>({})
  const [coordsById, setCoordsById] = useState<Record<string, LatLng | null | undefined>>({})
  const [routeStatsByContainer, setRouteStatsByContainer] = useState<Record<string, { durationSec: number | null; source: string }>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roadPolylineByContainer, setRoadPolylineByContainer] = useState<Record<string, LatLng[]>>({})

  const expandedCache = useRef(new Map<string, string>())

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const orderById = useMemo(() => new Map(safeOrders.map((o) => [o.id, o])), [safeOrders])

  const courierNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of safeCouriers) m.set(c.id, c.name)
    return m
  }, [safeCouriers])

  const courierStartById = useMemo(() => {
    const m = new Map<string, LatLng>()
    for (const c of safeCouriers) {
      if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
        m.set(c.id, { lat: c.latitude, lng: c.longitude })
      }
    }
    return m
  }, [safeCouriers])

  const allContainerIds = useMemo<ContainerId[]>(() => {
    const base = safeCouriers.map((c) => c.id)
    const ids = new Set<string>([...base, UNASSIGNED])
    // include any courierId referenced by orders but missing from couriers list
    for (const o of safeOrders) {
      if (o.courierId) ids.add(o.courierId)
    }
    return Array.from(ids)
  }, [safeCouriers, safeOrders])

  // Initialize container state + numbers when opening
  useEffect(() => {
    if (!open) return
    const grouped: Record<ContainerId, string[]> = {}
    for (const id of allContainerIds) grouped[id] = []

    const numbers: Record<string, number> = {}
    for (const o of safeOrders) {
      numbers[o.id] = o.orderNumber
      const containerId = o.courierId || UNASSIGNED
      if (!grouped[containerId]) grouped[containerId] = []
      grouped[containerId].push(o.id)
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => (numbers[a] ?? 0) - (numbers[b] ?? 0))
    }

    setContainers(grouped)
    setOrderNumberById(numbers)
    setRoadPolylineByContainer({})
    setSearch('')
  }, [allContainerIds, open, safeOrders])

  // Resolve coordinates for orders
  useEffect(() => {
    if (!open) return
    let cancelled = false

    const coerceLatLng = (latRaw: unknown, lngRaw: unknown): LatLng | null => {
      const lat =
        typeof latRaw === 'number' ? latRaw :
          typeof latRaw === 'string' ? Number(latRaw) :
            NaN
      const lng =
        typeof lngRaw === 'number' ? lngRaw :
          typeof lngRaw === 'string' ? Number(lngRaw) :
            NaN

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      if (lat < -90 || lat > 90) return null
      if (lng < -180 || lng > 180) return null
      return { lat, lng }
    }

    const base: Record<string, LatLng | null | undefined> = {}
    const toExpand: Array<{ id: string; url: string }> = []

    for (const o of safeOrders) {
      const saved = coerceLatLng((o as any).latitude, (o as any).longitude)
      if (saved) {
        base[o.id] = saved
        continue
      }

      const raw = o.deliveryAddress || ''
      const parsed = extractCoordsFromText(raw)
      if (parsed) {
        base[o.id] = parsed
        continue
      }

      const shortUrl = isShortGoogleMapsUrl(raw) ? raw : extractShortGoogleMapsUrl(raw)
      if (shortUrl) {
        base[o.id] = null
        toExpand.push({ id: o.id, url: shortUrl })
        continue
      }

      const anyUrl = extractAnyUrl(raw)
      if (anyUrl && isGoogleMapsLikeUrl(anyUrl)) {
        const fromUrl = extractCoordsFromText(anyUrl)
        if (fromUrl) {
          base[o.id] = fromUrl
        } else {
          base[o.id] = null
          toExpand.push({ id: o.id, url: anyUrl })
        }
        continue
      }

      base[o.id] = null
    }

    setCoordsById(base)

    ;(async () => {
      for (const item of toExpand) {
        if (cancelled) return
        try {
          const cached = expandedCache.current.get(item.url)
          const expanded =
            cached ??
            (await fetch(`/api/admin/expand-url?url=${encodeURIComponent(item.url)}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => (d && typeof d.expandedUrl === 'string' ? d.expandedUrl : null)))

          if (expanded) expandedCache.current.set(item.url, expanded)
          const coords = (expanded ? extractCoordsFromText(expanded) : null) ?? extractCoordsFromText(item.url)
          if (!cancelled) {
            setCoordsById((prev) => ({ ...prev, [item.id]: coords }))
          }
        } catch {
          if (!cancelled) setCoordsById((prev) => ({ ...prev, [item.id]: null }))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, safeOrders])

  const filteredOrderIds = useMemo(() => {
    if (!search.trim()) return null
    const q = search.trim().toLowerCase()
    const result = new Set<string>()
    for (const o of safeOrders) {
      const hay = `${o.orderNumber} ${o.customer?.name || ''} ${o.customerName || ''} ${o.deliveryAddress || ''}`.toLowerCase()
      if (hay.includes(q)) result.add(o.id)
    }
    return result
  }, [safeOrders, search])

  const buildMapData = useMemo(() => {
    const markers: Array<{ id: string; position: LatLng; color: string; label: string; popup?: string }> = []
    const polylines: Array<{ id: string; color: string; positions: LatLng[] }> = []

    for (const containerId of Object.keys(containers)) {
      if (containerId === UNASSIGNED) continue
      const ids = containers[containerId] || []
      const color = getCourierColor(containerId)
      const courierName = courierNameById.get(containerId) || 'Курьер'
      const routeStart = courierStartById.get(containerId) ?? warehousePoint ?? null
      const roadPolyline = roadPolylineByContainer[containerId]

      const linePositions: LatLng[] = []
      if (routeStart) {
        linePositions.push(routeStart)
        markers.push({
          id: `courier-${containerId}`,
          position: routeStart,
          color,
          label: 'C',
          popup: `${courierName} • start`,
        })
      }

      for (const id of ids) {
        const coords = coordsById[id]
        const n = orderNumberById[id]
        const o = orderById.get(id)
        if (!o) continue
        if (coords) {
          markers.push({
            id,
            position: coords,
            color,
            label: String(n ?? ''),
            popup: `${o.customer?.name || o.customerName || 'Клиент'} • #${n ?? ''}`,
          })
          linePositions.push(coords)
        }
      }

      if (Array.isArray(roadPolyline) && roadPolyline.length >= 2) {
        polylines.push({ id: containerId, color, positions: roadPolyline })
      } else if (linePositions.length >= 2) {
        polylines.push({ id: containerId, color, positions: linePositions })
      }
    }

    // Unassigned markers (gray, no polyline)
    const unassignedIds = containers[UNASSIGNED] || []
    const unassignedLine: LatLng[] = []
    if (warehousePoint) unassignedLine.push(warehousePoint)
    for (const id of unassignedIds) {
      const coords = coordsById[id]
      const n = orderNumberById[id]
      const o = orderById.get(id)
      if (!o) continue
      if (coords) {
        unassignedLine.push(coords)
        markers.push({
          id,
          position: coords,
          color: '#94A3B8',
          label: String(n ?? ''),
          popup: `${o.customer?.name || o.customerName || 'Клиент'} • #${n ?? ''} • Без курьера`,
        })
      }
    }
    const unassignedRoadPolyline = roadPolylineByContainer[UNASSIGNED]
    if (Array.isArray(unassignedRoadPolyline) && unassignedRoadPolyline.length >= 2) {
      polylines.push({ id: UNASSIGNED, color: '#94A3B8', positions: unassignedRoadPolyline })
    } else if (unassignedLine.length >= 2) {
      polylines.push({ id: 'unassigned', color: '#94A3B8', positions: unassignedLine })
    }

    return { markers, polylines }
  }, [containers, coordsById, courierNameById, courierStartById, orderById, orderNumberById, roadPolylineByContainer, warehousePoint])

  const applyAutoSortAll = async () => {
    const hasCourierStart = safeCouriers.some((c) => typeof c.latitude === 'number' && typeof c.longitude === 'number')
    if (!warehousePoint && !hasCourierStart) {
      toast.error('Set warehouse coordinates or enable courier geolocation')
      return
    }

    const currentContainers = { ...containers }
    const nextContainers = { ...currentContainers }
    const withoutCoordsByContainer: Record<string, string[]> = {}
    const withCoordsByContainer: Record<string, Array<{ id: string; coords: LatLng }>> = {}
    const routeRequests: Array<{
      containerId: string
      startPoint: LatLng | null
      stops: Array<{ orderId: string; lat: number; lng: number }>
    }> = []

    for (const containerId of Object.keys(nextContainers)) {
      const ids = nextContainers[containerId] || []
      const withCoords: Array<{ id: string; coords: LatLng }> = []
      const withoutCoords: string[] = []
      for (const id of ids) {
        const coords = coordsById[id]
        if (coords) withCoords.push({ id, coords })
        else withoutCoords.push(id)
      }
      withCoordsByContainer[containerId] = withCoords
      withoutCoordsByContainer[containerId] = withoutCoords

      if (withCoords.length > 0) {
        const startPoint = courierStartById.get(containerId) ?? warehousePoint ?? null
        routeRequests.push({
          containerId,
          startPoint,
          stops: withCoords.map((w) => ({ orderId: w.id, lat: w.coords.lat, lng: w.coords.lng })),
        })
      } else {
        nextContainers[containerId] = [...withoutCoords]
      }
    }

    let roadPolylinesNext: Record<string, LatLng[]> = {}
    let statsNext: Record<string, { durationSec: number | null; source: string }> = {}
    let usedServerOptimization = false

    if (routeRequests.length > 0) {
      try {
        const response = await fetch('/api/admin/dispatch/ors-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routes: routeRequests }),
        })
        if (response.ok) {
          const data = await response.json().catch(() => null)
          const routes = Array.isArray(data?.routes) ? data.routes : []
          const byContainer = new Map<string, any>(routes.map((r: any) => [String(r.containerId), r]))

          for (const containerId of Object.keys(nextContainers)) {
            const route = byContainer.get(containerId)
            const withCoords = withCoordsByContainer[containerId] || []
            const withoutCoords = withoutCoordsByContainer[containerId] || []
            const allowed = new Set(withCoords.map((w) => w.id))

            if (route) {
              const durationSec = typeof route.durationSec === 'number' && Number.isFinite(route.durationSec) ? route.durationSec : null
              const source = typeof route.source === 'string' ? route.source : 'unknown'
              statsNext[containerId] = { durationSec, source }
            } else {
              statsNext[containerId] = { durationSec: null, source: 'none' }
            }

            if (route && Array.isArray(route.orderedOrderIds)) {
              const ordered = route.orderedOrderIds
                .map((id: unknown) => String(id))
                .filter((id: string) => allowed.has(id))
              const missing = withCoords.map((w) => w.id).filter((id) => !ordered.includes(id))
              nextContainers[containerId] = [...ordered, ...missing, ...withoutCoords]
            } else if (withCoords.length > 0) {
              const startPoint = courierStartById.get(containerId) ?? warehousePoint
              const orderedWithCoords = startPoint
                ? optimizeNearestNeighbor(startPoint, withCoords)
                : withCoords.map((w) => w.id)
              nextContainers[containerId] = [...orderedWithCoords, ...withoutCoords]
            }

            if (route && Array.isArray(route.polyline)) {
              const polyline = route.polyline
                .map((p: any) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
                .filter((p: LatLng) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
              if (polyline.length >= 2) {
                roadPolylinesNext[containerId] = polyline
              }
            }
          }

          usedServerOptimization = true
        }
      } catch {
        // Fallback below
      }
    }

    if (!usedServerOptimization) {
      roadPolylinesNext = {}
      statsNext = {}
      for (const containerId of Object.keys(nextContainers)) {
        const withCoords = withCoordsByContainer[containerId] || []
        const withoutCoords = withoutCoordsByContainer[containerId] || []
        if (withCoords.length === 0) {
          statsNext[containerId] = { durationSec: null, source: 'none' }
          continue
        }
        const startPoint = courierStartById.get(containerId) ?? warehousePoint
        const orderedWithCoords = startPoint
          ? optimizeNearestNeighbor(startPoint, withCoords)
          : withCoords.map((w) => w.id)
        nextContainers[containerId] = [...orderedWithCoords, ...withoutCoords]

        const line: LatLng[] = []
        if (startPoint) line.push(startPoint)
        for (const id of orderedWithCoords) {
          const c = coordsById[id]
          if (c) line.push(c)
        }
        const totalKm = line.reduce((acc, cur, idx) => {
          if (idx === 0) return 0
          return acc + haversineDistance(line[idx - 1], cur)
        }, 0)
        const durationSec = Number.isFinite(totalKm) && totalKm > 0 ? (totalKm / 25) * 3600 : null
        statsNext[containerId] = { durationSec, source: 'fallback' }
      }
    }

    setContainers(nextContainers)
    setRoadPolylineByContainer(roadPolylinesNext)
    setRouteStatsByContainer(statsNext)
    setOrderNumberById((prevNumbers) => {
      let numbersNext: Record<string, number | undefined> = { ...prevNumbers }
      for (const containerId of Object.keys(nextContainers)) {
        numbersNext = renumberInOrder(nextContainers[containerId] || [], numbersNext)
      }
      return numbersNext as Record<string, number>
    })
  }

  useEffect(() => {
    if (!open) return
    if (!autoSortOnOpen) return
    // allow initial state to mount first
    const t = setTimeout(() => {
      void applyAutoSortAll()
    }, 50)
    return () => clearTimeout(t)
  }, [open, autoSortOnOpen])

  useEffect(() => {
    if (!open) return
    if (!autoSortOnOpen) return
    if (Object.keys(coordsById).length === 0) return

    const t = setTimeout(() => {
      void applyAutoSortAll()
    }, 250)
    return () => clearTimeout(t)
  }, [coordsById, open, autoSortOnOpen])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    if (!overId) return

    const active = String(event.active.id)
    const over = String(overId)
    setRoadPolylineByContainer({})

    setContainers((prev) => {
      const activeContainer = findContainerForId(prev, active)
      const overContainer = findContainerForId(prev, over)
      if (!activeContainer || !overContainer) return prev
      if (activeContainer === overContainer) return prev

      const activeItems = prev[activeContainer] || []
      const overItems = prev[overContainer] || []
      const activeIndex = activeItems.indexOf(active)
      if (activeIndex === -1) return prev

      const nextActive = activeItems.filter((id) => id !== active)

      const overIndex = overItems.includes(over) ? overItems.indexOf(over) : overItems.length
      const nextOver = [...overItems.slice(0, overIndex), active, ...overItems.slice(overIndex)]

      const next = { ...prev, [activeContainer]: nextActive, [overContainer]: nextOver }

      // Renumber affected containers
      setOrderNumberById((numbersPrev) => {
        let numbersNext = { ...numbersPrev }
        numbersNext = renumberInOrder(next[activeContainer], numbersNext) as Record<string, number>
        numbersNext = renumberInOrder(next[overContainer], numbersNext) as Record<string, number>
        return numbersNext
      })

      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    setRoadPolylineByContainer({})

    setContainers((prev) => {
      const containerId = findContainerForId(prev, activeId)
      const overContainerId = findContainerForId(prev, overId)
      if (!containerId || !overContainerId) return prev
      if (containerId !== overContainerId) return prev

      const items = prev[containerId] || []
      const oldIndex = items.indexOf(activeId)
      const newIndex = items.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev

      const nextItems = arrayMove(items, oldIndex, newIndex)
      const next = { ...prev, [containerId]: nextItems }

      setOrderNumberById((numbersPrev) => (renumberInOrder(nextItems, numbersPrev) as Record<string, number>))
      return next
    })
  }

  const swapOrderNumbers = (orderId: string, nextNumber: number) => {
    if (!Number.isFinite(nextNumber)) return
    setRoadPolylineByContainer({})
    const allIds = Object.values(containers).flat()
    const targetId = allIds.find((id) => orderNumberById[id] === nextNumber)
    if (!targetId) {
      toast.error('Можно указать только номер из текущего списка')
      return
    }
    if (targetId === orderId) return

    setOrderNumberById((prev) => {
      const a = prev[orderId]
      const b = prev[targetId]
      if (typeof a !== 'number' || typeof b !== 'number') return prev
      return { ...prev, [orderId]: b, [targetId]: a }
    })
  }

  const save = async () => {
    const orderIds = Object.values(containers).flat()
    if (orderIds.length === 0) return

    setIsSaving(true)
    try {
      const updates = orderIds.map((id) => {
        const containerId = findContainerForId(containers, id)
        return {
          orderId: id,
          orderNumber: orderNumberById[id],
          courierId: !containerId || containerId === UNASSIGNED ? null : containerId,
        }
      })

      const res = await fetch('/api/admin/orders/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && data.error) || 'Ошибка сохранения')
      }

      toast.success('Сохранено')
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[95vw] sm:max-w-6xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Карта/Маршруты — {selectedDateLabel}
          </SheetTitle>
          <SheetDescription>
            Перетащите заказы между курьерами, изменяйте порядок и номера. Цвет заказа = цвет курьера.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Поиск (номер, клиент, адрес)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:w-[320px]"
              />
              <Button variant="outline" onClick={() => void applyAutoSortAll()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Сортировать заново
              </Button>
            </div>

            <Button onClick={save} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>

          <Card className="p-2">
            <div className="h-[40vh] sm:h-[52vh] w-full">
              <DispatchLeafletMap warehouse={warehousePoint} markers={buildMapData.markers} polylines={buildMapData.polylines} />
            </div>
          </Card>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {allContainerIds.map((containerId) => {
                const isUnassigned = containerId === UNASSIGNED
                const name = isUnassigned ? 'Без курьера' : courierNameById.get(containerId) || `Курьер ${containerId.slice(0, 6)}`
                const color = isUnassigned ? '#94A3B8' : getCourierColor(containerId)
                const ids = containers[containerId] || []
                const visibleIds = filteredOrderIds ? ids.filter((id) => filteredOrderIds.has(id)) : ids
                const stats = routeStatsByContainer[containerId]
                const durationSec = stats?.durationSec
                const durationMin = typeof durationSec === 'number' && Number.isFinite(durationSec) ? Math.max(1, Math.round(durationSec / 60)) : null
                const approx = stats?.source && stats.source !== 'ors'

                return (
                  <DroppableColumn key={containerId} id={containerId}>
                    <div className="rounded-lg border p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <div className="font-semibold text-sm truncate">{name}</div>
                          <Badge variant="outline" className="text-[10px]">{ids.length}</Badge>
                          {durationMin != null && (
                            <Badge variant="secondary" className="text-[10px]">
                              {approx ? '≈' : ''}{durationMin} min
                            </Badge>
                          )}
                        </div>
                      </div>

                      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 max-h-[42vh] overflow-auto pr-1">
                          {visibleIds.map((id) => {
                            const o = orderById.get(id)
                            if (!o) return null
                            const n = orderNumberById[id]
                            const coords = coordsById[id]
                            const courierName = isUnassigned ? 'Без курьера' : (courierNameById.get(containerId) || 'Курьер')
                            return (
                              <SortableOrderItem
                                key={id}
                                order={o}
                                color={color}
                                courierName={courierName}
                                number={n}
                                coords={coords}
                                onNumberChange={(next) => swapOrderNumbers(id, next)}
                              />
                            )
                          })}
                          {visibleIds.length === 0 && (
                            <div className="text-xs text-slate-400 py-6 text-center">Нет заказов</div>
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  </DroppableColumn>
                )
              })}
            </div>
          </DndContext>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-500" />
            <div className="text-slate-600">Couriers:</div>
            <div className="flex flex-wrap gap-2">
              {safeCouriers.map((c) => (
                <div key={c.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-background">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCourierColor(c.id) }} />
                  <div className="text-xs">{c.name}</div>
                </div>
              ))}
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-background">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#94A3B8' }} />
                <div className="text-xs">Unassigned</div>
              </div>
            </div>
          </div>

          {activeId && (
            <div className="text-xs text-slate-400">
              Перетаскивание: {orderNumberById[activeId] ? `#${orderNumberById[activeId]}` : activeId}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Закрыть
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
