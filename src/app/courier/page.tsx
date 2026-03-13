'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  LogOut,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Pause,
  Phone,
  Play,
  RefreshCw,
  User,
  Utensils,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { CourierProfile } from '@/components/courier/CourierProfile'
import { ChatTab } from '@/components/chat/ChatTab'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RouteOptimizeButton } from '@/components/admin/RouteOptimizeButton'
import { extractCoordsFromText } from '@/lib/geo'

const CourierMap = dynamic(() => import('@/components/courier/CourierMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
      Loading...
    </div>
  ),
})

interface Order {
  id: string
  orderNumber: number
  customer: {
    name: string
    phone: string
    address?: string
    latitude?: number | null
    longitude?: number | null
  }
  deliveryAddress: string
  latitude: number | null
  longitude: number | null
  deliveryTime: string
  quantity: number
  calories: number
  specialFeatures: string
  orderStatus: string
  deliveryDate?: string
  createdAt: string
}

export default function CourierPage() {
  const { t, language } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [activeTab, setActiveTab] = useState('orders')
  const [courierData, setCourierData] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderOpen, setIsOrderOpen] = useState(false)
  const [isOrderPaused, setIsOrderPaused] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [lastOrdersSyncAt, setLastOrdersSyncAt] = useState<Date | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_DELIVERY' | 'PAUSED'>('ALL')
  const lastSentLocationRef = useRef<{ lat: number; lng: number; at: number } | null>(null)
  const isSendingLocationRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)

  const uiText = useMemo(
    () => ({
      en: {
        notSynced: 'Not synced yet',
        metersAway: 'm away',
        kmAway: 'km away',
        active: 'Active',
        paused: 'Paused',
        lastSync: 'Last sync',
        deliveryMomentum: 'Delivery progress',
        nextStop: 'Next stop',
        inRoute: 'In route',
        pending: 'Pending',
        noPendingStop: 'No pending stop in queue.',
        navigate: 'Navigate',
        review: 'Review',
        refresh: 'Refresh',
        all: 'All',
        noOrdersInStatus: 'No orders in this status',
        tryAnotherStatus: 'Try another status filter or refresh queue.',
        delivered: 'Delivered',
        notes: 'Notes',
        details: 'Details',
        new: 'New',
        note: 'Note',
        quantityUnit: 'pcs',
        amountReceived: 'Amount received from client',
      },
      uz: {
        notSynced: 'Sinxronlanmagan',
        metersAway: 'm qoldi',
        kmAway: 'km qoldi',
        active: 'Faol',
        paused: 'Pauza',
        lastSync: 'Oxirgi sinxron',
        deliveryMomentum: 'Yetkazish progressi',
        nextStop: 'Keyingi nuqta',
        inRoute: 'Yolda',
        pending: 'Kutilmoqda',
        noPendingStop: 'Navbatda keyingi nuqta yoq.',
        navigate: 'Yonaltirish',
        review: 'Korib chiqish',
        refresh: 'Yangilash',
        all: 'Barchasi',
        noOrdersInStatus: 'Bu holatda buyurtmalar yoq',
        tryAnotherStatus: 'Boshqa holatni tanlang yoki yangilang.',
        delivered: 'Yetkazildi',
        notes: 'Izohlar',
        details: 'Batafsil',
        new: 'Yangi',
        note: 'Izoh',
        quantityUnit: 'dona',
        amountReceived: 'Mijozdan olingan summa',
      },
      ru: {
        notSynced: 'Еще не синхронизировано',
        metersAway: 'м до точки',
        kmAway: 'км до точки',
        active: 'Активные',
        paused: 'На паузе',
        lastSync: 'Последняя синхронизация',
        deliveryMomentum: 'Прогресс доставки',
        nextStop: 'Следующая точка',
        inRoute: 'В пути',
        pending: 'Ожидает',
        noPendingStop: 'В очереди нет следующей точки.',
        navigate: 'Маршрут',
        review: 'Проверить',
        refresh: 'Обновить',
        all: 'Все',
        noOrdersInStatus: 'Нет заказов с этим статусом',
        tryAnotherStatus: 'Выберите другой статус или обновите список.',
        delivered: 'Доставлен',
        notes: 'Комментарий',
        details: 'Детали',
        new: 'Новый',
        note: 'Примечание',
        quantityUnit: 'шт',
        amountReceived: 'Получено от клиента',
      },
    })[language],
    [language]
  )

  const activeOrdersCount = useMemo(
    () => orders.filter((order) => order.orderStatus === 'IN_DELIVERY' || order.orderStatus === 'PENDING').length,
    [orders]
  )

  const pausedOrdersCount = useMemo(
    () => orders.filter((order) => order.orderStatus === 'PAUSED').length,
    [orders]
  )

  const pendingOrdersCount = useMemo(
    () => orders.filter((order) => order.orderStatus === 'PENDING').length,
    [orders]
  )

  const inDeliveryOrdersCount = useMemo(
    () => orders.filter((order) => order.orderStatus === 'IN_DELIVERY').length,
    [orders]
  )

  const lastSyncLabel = useMemo(
    () =>
      lastOrdersSyncAt
        ? lastOrdersSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : uiText.notSynced,
    [lastOrdersSyncAt, uiText.notSynced]
  )

  const visibleOrders = useMemo(() => {
    if (orderStatusFilter === 'ALL') return orders
    return orders.filter((order) => order.orderStatus === orderStatusFilter)
  }, [orderStatusFilter, orders])

  const nextStopOrder = useMemo(
    () => orders.find((order) => order.orderStatus === 'IN_DELIVERY' || order.orderStatus === 'PENDING') || null,
    [orders]
  )

  const deliveryMomentum = useMemo(() => {
    if (activeOrdersCount === 0) return 0
    return Math.round((inDeliveryOrdersCount / activeOrdersCount) * 100)
  }, [activeOrdersCount, inDeliveryOrdersCount])

  const orderedVisibleOrders = useMemo(() => {
    const statusPriority: Record<string, number> = {
      IN_DELIVERY: 0,
      PENDING: 1,
      PAUSED: 2,
    }

    return [...visibleOrders].sort((a, b) => {
      const statusDiff = (statusPriority[a.orderStatus] ?? 99) - (statusPriority[b.orderStatus] ?? 99)
      if (statusDiff !== 0) return statusDiff
      return (a.orderNumber ?? 0) - (b.orderNumber ?? 0)
    })
  }, [visibleOrders])

  const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371e3
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
  }

  const nextStopDistanceLabel = useMemo(() => {
    if (!nextStopOrder || !currentLocation) return null
    if (nextStopOrder.latitude == null || nextStopOrder.longitude == null) return null

    const meters = distanceMeters(currentLocation, { lat: nextStopOrder.latitude, lng: nextStopOrder.longitude })
    if (!Number.isFinite(meters)) return null
    if (meters < 1000) return `${Math.round(meters)} ${uiText.metersAway}`
    return `${(meters / 1000).toFixed(1)} ${uiText.kmAway}`
  }, [currentLocation, nextStopOrder, uiText.kmAway, uiText.metersAway])

  const sendLocationUpdate = async (lat: number, lng: number, force = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    if (isSendingLocationRef.current) return

    const now = Date.now()
    const previous = lastSentLocationRef.current
    const minDistanceMeters = 20
    const minIntervalMs = 10_000
    const movedEnough = previous ? distanceMeters(previous, { lat, lng }) >= minDistanceMeters : true
    const waitedEnough = previous ? now - previous.at >= minIntervalMs : true

    if (!force && !movedEnough && !waitedEnough) return

    isSendingLocationRef.current = true
    try {
      const response = await fetch('/api/courier/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
        keepalive: true,
      })
      if (response.ok) {
        lastSentLocationRef.current = { lat, lng, at: now }
      }
    } catch (error) {
      console.error('Error sending courier location:', error)
    } finally {
      isSendingLocationRef.current = false
    }
  }

  const applyLocation = (lat: number, lng: number, forceSend = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    setCurrentLocation({ lat, lng })
    void sendLocationUpdate(lat, lng, forceSend)
  }

  useEffect(() => {
    const loadCourierData = async () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setCourierData(user)
        } catch {
          // ignore
        }
      }

      try {
        const response = await fetch('/api/courier/profile')
        if (response.ok) {
          const data = await response.json()
          const payload = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: 'COURIER',
          }
          setCourierData(payload)
          localStorage.setItem('user', JSON.stringify(payload))
        }
      } catch (error) {
        console.error('Error fetching courier profile:', error)
      }
    }

    void loadCourierData()
    void fetchOrders()
    getCurrentLocation(true)

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          applyLocation(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error('Location watch error:', error)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 12000,
        }
      )
    }

    const locationInterval = setInterval(() => getCurrentLocation(false), 45000)
    const ordersInterval = setInterval(() => {
      void fetchOrders(true)
    }, 60000)

    return () => {
      clearInterval(locationInterval)
      clearInterval(ordersInterval)
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  const getCurrentLocation = (forceSend = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          applyLocation(position.coords.latitude, position.coords.longitude, forceSend)
        },
        (error) => {
          console.error('Error getting location:', error)
          setCurrentLocation((prev) => prev ?? { lat: 41.2995, lng: 69.2401 })
        },
        {
          enableHighAccuracy: false,
          maximumAge: 10000,
          timeout: 12000,
        }
      )
    }
  }

  const getLocalIsoDate = (d: Date = new Date()) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const fetchOrders = async (background = false) => {
    if (!background) setLoading(true)
    else setIsRefreshing(true)

    try {
      const today = getLocalIsoDate()
      const response = await fetch(`/api/courier/orders?date=${encodeURIComponent(today)}`)

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

        if (response.ok) {
          const ordersData = await response.json()

        const normalized: Order[] = (Array.isArray(ordersData) ? ordersData : []).map((o: any) => {
          const orderLat = typeof o?.latitude === 'number' ? o.latitude : null
          const orderLng = typeof o?.longitude === 'number' ? o.longitude : null
          const customerLat = typeof o?.customer?.latitude === 'number' ? o.customer.latitude : null
          const customerLng = typeof o?.customer?.longitude === 'number' ? o.customer.longitude : null
          const parsed = extractCoordsFromText(String(o?.deliveryAddress ?? ''))

          const latitude = orderLat ?? customerLat ?? parsed?.lat ?? null
          const longitude = orderLng ?? customerLng ?? parsed?.lng ?? null

          return {
            ...o,
            latitude,
            longitude,
            customer: o?.customer ?? { name: '', phone: '' },
          } as Order
        })

        const activeAndPendingOrders = normalized
          .filter(
            (order: Order) =>
              order.orderStatus === 'PENDING' || order.orderStatus === 'IN_DELIVERY' || order.orderStatus === 'PAUSED'
          )
          .sort((a: Order, b: Order) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
        setOrders(activeAndPendingOrders)
        setLastOrdersSyncAt(new Date())

        if (selectedOrder) {
          const updatedSelectedOrder = activeAndPendingOrders.find((o: Order) => o.id === selectedOrder.id)
          if (updatedSelectedOrder) {
            setSelectedOrder(updatedSelectedOrder)
            setIsOrderPaused(updatedSelectedOrder.orderStatus === 'PAUSED')
          } else {
            setSelectedOrder(null)
            setIsOrderOpen(false)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (!background) toast.error(t.common.error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderOpen(true)
    setIsOrderPaused(order.orderStatus === 'PAUSED')
    setAmountReceived('')
  }

  const handleCloseOrderDetailSheet = () => {
    setIsOrderOpen(false)
    setSelectedOrder(null)
    setAmountReceived('')
  }

  const handleStartDelivery = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'start_delivery' }),
      })

      if (response.ok) {
        toast.success(t.courier.startDelivery, {
          description: t.courier.activeOrder,
        })

        setOrders((prevOrders) => prevOrders.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: 'IN_DELIVERY' } : o)))
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: 'IN_DELIVERY' } : null))
        setIsOrderPaused(false)
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handleCompleteDelivery = async () => {
    if (!selectedOrder) return

    const confirmClose = window.confirm(`${t.courier.completeDelivery}?`)
    if (!confirmClose) return

    if (isCompleting) return
    setIsCompleting(true)

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'complete_delivery',
          amountReceived: amountReceived ? parseFloat(amountReceived) : null,
        }),
      })

      if (response.ok) {
        toast.success(t.common.success)
        handleCloseOrderDetailSheet()
        void fetchOrders()
      } else if (response.status === 401) {
        window.location.href = '/login'
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || t.common.error)
      }
    } catch (error) {
      console.error('Error completing delivery:', error)
      toast.error(t.common.error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handlePauseOrder = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'pause_delivery' }),
      })

      if (response.ok) {
        setIsOrderPaused(true)
        toast.info(t.courier.pauseDelivery)
        setOrders((prevOrders) => prevOrders.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: 'PAUSED' } : o)))
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: 'PAUSED' } : null))
      }
    } catch (error) {
      console.error('Error pausing delivery:', error)
      toast.error(t.common.error)
    }
  }

  const handleResumeOrder = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'resume_delivery' }),
      })

      if (response.ok) {
        setIsOrderPaused(false)
        toast.success(t.courier.resumeDelivery)
        setOrders((prevOrders) => prevOrders.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: 'IN_DELIVERY' } : o)))
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: 'IN_DELIVERY' } : null))
      }
    } catch (error) {
      console.error('Error resuming delivery:', error)
      toast.error(t.common.error)
    }
  }

  const openRouteForOrder = (order: Order) => {
    try {
      const hasCoords = order.latitude != null && order.longitude != null
      const destination = hasCoords ? `${order.latitude},${order.longitude}` : order.deliveryAddress

      let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`

      if (currentLocation) {
        url += `&origin=${currentLocation.lat},${currentLocation.lng}`
      }

      window.open(url, '_blank')
    } catch (error) {
      console.error('Error opening maps:', error)
      toast.error(t.common.error)
    }
  }

  const handleGetRoute = () => {
    if (!selectedOrder) return
    openRouteForOrder(selectedOrder)
  }

  const handleLogout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await signOut({ callbackUrl: '/', redirect: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-[#06060a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-40" />
        <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.06] blur-[100px] pointer-events-none animate-pulse-glow" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mb-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
        </motion.div>
        <p className="text-zinc-400 dark:text-white/40 font-medium relative z-10">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#06060a] pb-20 relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-dot-grid pointer-events-none opacity-30" />
      <div className="fixed top-[-200px] right-[-50px] w-[400px] h-[400px] rounded-full bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] blur-[100px] pointer-events-none animate-pulse-glow" />
      
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#06060a]/80 backdrop-blur-2xl safe-top accent-line">
        <div className="max-w-3xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Package className="w-4.5 h-4.5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">{t.courier.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            {isRefreshing && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4 text-zinc-400 dark:text-white/40" />
              </motion.div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 dark:text-white/40 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 p-1.5 bg-zinc-100/80 dark:bg-white/[0.04] rounded-xl">
            <TabsTrigger value="orders" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-sm font-semibold text-[13px]">
              <Package className="w-4 h-4" />
              {t.courier.orders}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-sm font-semibold text-[13px]">
              <MessageSquare className="w-4 h-4" />
              {t.courier.chat}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-sm font-semibold text-[13px]">
              <User className="w-4 h-4" />
              {t.courier.profile}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card className="rounded-2xl border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl shadow-sm">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-500/[0.06] p-3 border border-indigo-100 dark:border-indigo-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <p className="text-[11px] font-semibold text-indigo-600/70 dark:text-indigo-400/60 tracking-wider uppercase">{uiText.active}</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{activeOrdersCount}</p>
                </div>
                <div className="rounded-xl bg-amber-50/50 dark:bg-amber-500/[0.06] p-3 border border-amber-100 dark:border-amber-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <p className="text-[11px] font-semibold text-amber-600/70 dark:text-amber-400/60 tracking-wider uppercase">{uiText.paused}</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pausedOrdersCount}</p>
                </div>
                <div className="rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] p-3 border border-zinc-100 dark:border-white/[0.04]">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-white/35 tracking-wider uppercase mb-1">{uiText.lastSync}</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-white/80">{lastSyncLabel}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-500/[0.06] p-3 border border-emerald-100 dark:border-emerald-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <p className="text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-400/60 tracking-wider uppercase">{uiText.deliveryMomentum}</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{deliveryMomentum}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-zinc-200/80 dark:border-white/[0.06] shadow-sm">
              <CardContent className="p-0 h-[300px] relative z-0">
                <CourierMap orders={orders} currentLocation={currentLocation} onMarkerClick={handleOpenOrder} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{uiText.nextStop}</p>
                    {nextStopOrder ? (
                      <>
                        <p className="mt-1 text-base font-semibold">
                          #{nextStopOrder.orderNumber} {nextStopOrder.customer.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              nextStopOrder.orderStatus === 'IN_DELIVERY'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }
                          >
                            {nextStopOrder.orderStatus === 'IN_DELIVERY' ? uiText.inRoute : uiText.pending}
                          </Badge>
                          {nextStopDistanceLabel && (
                            <span className="text-xs text-muted-foreground">{nextStopDistanceLabel}</span>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{nextStopOrder.deliveryAddress}</span>
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{uiText.noPendingStop}</p>
                    )}
                  </div>
                  {nextStopOrder && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-md" onClick={() => openRouteForOrder(nextStopOrder)}>
                        {uiText.navigate}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md" onClick={() => handleOpenOrder(nextStopOrder)}>
                        {uiText.review}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {t.courier.todayOrders} ({orderedVisibleOrders.length}
                  {orderStatusFilter !== 'ALL' ? `/${orders.length}` : ''})
                </h2>
                <Button variant="outline" size="sm" className="rounded-md" onClick={() => fetchOrders(true)} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {uiText.refresh}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ALL' as const, label: `${uiText.all} (${orders.length})` },
                  { id: 'PENDING' as const, label: `${uiText.pending} (${pendingOrdersCount})` },
                  { id: 'IN_DELIVERY' as const, label: `${uiText.inRoute} (${inDeliveryOrdersCount})` },
                  { id: 'PAUSED' as const, label: `${uiText.paused} (${pausedOrdersCount})` },
                ].map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={orderStatusFilter === option.id ? 'default' : 'outline'}
                    className="rounded-md"
                    onClick={() => setOrderStatusFilter(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {orderedVisibleOrders.length > 0 && (
                <RouteOptimizeButton
                  orders={orderedVisibleOrders.map((o) => ({
                    id: o.id,
                    deliveryAddress: o.deliveryAddress,
                    latitude: o.latitude,
                    longitude: o.longitude,
                    customerName: o.customer.name,
                  }))}
                  onOptimized={(orderedIds) => {
                    const orderedOrders = orderedIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as typeof orders
                    const untouchedOrders = orders.filter((order) => !orderedIds.includes(order.id))
                    setOrders([...orderedOrders, ...untouchedOrders])
                  }}
                  startPoint={currentLocation}
                  variant="outline"
                  size="sm"
                />
              )}

              <AnimatePresence mode="popLayout">
                {orderedVisibleOrders.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card py-12 text-center">
                    <div className="bg-muted w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                      {orderStatusFilter === 'ALL' ? t.courier.noOrders : uiText.noOrdersInStatus}
                    </h3>
                    <p className="text-slate-500">
                      {orderStatusFilter === 'ALL' ? t.courier.noOrders : uiText.tryAnotherStatus}
                    </p>
                    <Button onClick={() => fetchOrders()} variant="outline" className="mt-4">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {uiText.refresh}
                    </Button>
                  </motion.div>
                ) : (
                  orderedVisibleOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        className={`overflow-hidden border transition-colors duration-200 ${
                          order.orderStatus === 'DELIVERED' ? 'bg-muted/50' : 'bg-card'
                        }`}
                        onClick={() => handleOpenOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">#{order.orderNumber}</span>
                                {order.orderStatus === 'DELIVERED' && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {uiText.delivered}
                                  </Badge>
                                )}
                                {order.orderStatus === 'IN_DELIVERY' && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                    <Navigation className="w-3 h-3 mr-1" />
                                    {uiText.inRoute}
                                  </Badge>
                                )}
                                {order.orderStatus === 'PAUSED' && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                    <Pause className="w-3 h-3 mr-1" />
                                    {uiText.paused}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-medium text-slate-900">{order.customer.name}</h3>
                              <div className="flex items-center text-slate-500 text-sm">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="line-clamp-1">{order.deliveryAddress}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-medium text-slate-900">{order.deliveryTime}</div>
                              <div className="text-xs text-slate-500 mt-1">{order.calories} kcal</div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center">
                                <Utensils className="w-4 h-4 mr-1.5 text-slate-400" />
                                {order.quantity} {uiText.quantityUnit}
                              </div>
                              {order.specialFeatures && order.specialFeatures !== '{}' && (
                                <div className="flex items-center text-amber-600">
                                  <AlertCircle className="w-4 h-4 mr-1.5" />
                                  {uiText.notes}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 -mr-2">
                              {uiText.details}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {courierData && <ChatTab />}
          </TabsContent>
          <TabsContent value="profile">{courierData && <CourierProfile courier={courierData} />}</TabsContent>
        </Tabs>
      </main>

      <Sheet open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-lg p-0">
          {selectedOrder && (
            <div className="h-full flex flex-col">
              <div className="p-6 pb-0">
                <SheetHeader className="mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2 border-border text-muted-foreground">
                        #{selectedOrder.orderNumber}
                      </Badge>
                      <SheetTitle className="text-2xl font-bold text-slate-900">{selectedOrder.customer.name}</SheetTitle>
                      <SheetDescription className="flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedOrder.deliveryTime}
                      </SheetDescription>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={`px-3 py-1 ${
                          isOrderPaused
                            ? 'bg-yellow-100 text-yellow-700'
                            : selectedOrder.orderStatus === 'IN_DELIVERY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isOrderPaused ? t.courier.pauseDelivery : selectedOrder.orderStatus === 'IN_DELIVERY' ? t.courier.activeOrder : uiText.new}
                      </Badge>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-4">
                  <div className="flex items-start rounded-md bg-muted p-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500 mb-0.5">{t.courier.deliveryAddress}</p>
                      <p className="font-medium text-slate-900 leading-snug">{selectedOrder.deliveryAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center rounded-md bg-muted p-3">
                    <Phone className="w-5 h-5 text-primary mr-3 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500 mb-0.5">{t.common.phone}</p>
                      <a href={`tel:${selectedOrder.customer.phone}`} className="font-medium text-slate-900 hover:text-primary">
                        {selectedOrder.customer.phone}
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted p-3">
                      <div className="flex items-center mb-1">
                        <Package className="w-4 h-4 text-primary mr-2" />
                        <span className="text-xs text-slate-500">{t.common.quantity}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{selectedOrder.quantity} {uiText.quantityUnit}.</p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <div className="flex items-center mb-1">
                        <Utensils className="w-4 h-4 text-primary mr-2" />
                        <span className="text-xs text-slate-500">{t.common.calories}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{selectedOrder.calories}</p>
                    </div>
                  </div>

                  {selectedOrder.specialFeatures && selectedOrder.specialFeatures !== '{}' && (
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center mb-1 text-yellow-700">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-xs font-medium">{uiText.note}</span>
                      </div>
                      <p className="text-sm text-yellow-900">{selectedOrder.specialFeatures}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto p-6 bg-muted/50 border-t border-border space-y-3">
                {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') && (
                  <div className="mb-2 rounded-md border border-border bg-card p-3 shadow-sm">
                    <label className="mb-1 block text-sm font-medium text-slate-700">{uiText.amountReceived}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="0"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 text-sm">UZS</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 text-base font-medium" onClick={handleGetRoute}>
                    <Navigation className="w-5 h-5 mr-2" />
                    {t.courier.buildRoute}
                  </Button>

                  {selectedOrder.orderStatus === 'PENDING' && (
                    <Button className="h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white" onClick={handleStartDelivery}>
                      <Play className="w-5 h-5 mr-2" />
                      {t.courier.apply}
                    </Button>
                  )}

                  {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') &&
                    (isOrderPaused ? (
                      <Button className="h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white" onClick={handleResumeOrder}>
                        <Play className="w-5 h-5 mr-2" />
                        {t.courier.resumeDelivery}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="h-12 text-base font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        onClick={handlePauseOrder}
                      >
                        <Pause className="w-5 h-5 mr-2" />
                        {t.courier.pauseDelivery}
                      </Button>
                    ))}
                </div>

                {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') && (
                  <Button
                    className="h-12 w-full text-base font-semibold"
                    onClick={handleCompleteDelivery}
                    disabled={isCompleting}
                  >
                    <CheckCircle className="w-6 h-6 mr-2" />
                    {isCompleting ? t.common.loading : t.courier.completeDelivery}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}



