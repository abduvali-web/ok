'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
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
  Moon,
  Sun,
  Settings,
  History,
  Wallet,
  ChefHat,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSettingsContext } from '@/contexts/AdminSettingsContext'
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RouteOptimizeButton } from '@/components/admin/RouteOptimizeButton'
import { extractCoordsFromText } from '@/lib/geo'
import { CalendarRangeSelector } from '@/components/admin/dashboard/shared/CalendarRangeSelector'
import type { DateRange } from 'react-day-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChatSheet } from '@/components/chat/ChatSheet'

const CourierMap = dynamic(() => import('@/components/courier/CourierMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted/30 animate-pulse rounded-3xl flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-muted-foreground/40 animate-spin" />
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
  const { settings: adminSettings, updateSettings: updateAdminSettings } = useAdminSettingsContext()

  const systemPrefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  const isDark = adminSettings.theme === 'dark' || (adminSettings.theme === 'system' && systemPrefersDark)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { from: today, to: today }
  })
  const dateRangeRef = useRef<DateRange | undefined>(undefined)
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [courierData, setCourierData] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderOpen, setIsOrderOpen] = useState(false)
  const [isOrderPaused, setIsOrderPaused] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [lastOrdersSyncAt, setLastOrdersSyncAt] = useState<Date | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_DELIVERY' | 'PAUSED'>('ALL')
  const [showHistory, setShowHistory] = useState(false)
  const lastSentLocationRef = useRef<{ lat: number; lng: number; at: number } | null>(null)
  const isSendingLocationRef = useRef(false)
  const watchIdRef = useRef<number | null>(null)
  const didInitialRangeFetchRef = useRef(false)

  // Withdraw state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [courierBalance, setCourierBalance] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    dateRangeRef.current = dateRange
  }, [dateRange])

  const uiText = useMemo(
    () => ({
      en: {
        notSynced: 'Not synced yet',
        metersAway: 'm away',
        kmAway: 'km away',
        active: 'Active',
        paused: 'Paused',
        lastSync: 'Last sync',
        deliveryMomentum: 'Progress',
        nextStop: 'Next stop',
        inRoute: 'In route',
        pending: 'Pending',
        noPendingStop: 'No pending stop.',
        navigate: 'Navigate',
        review: 'Review',
        refresh: 'Refresh',
        all: 'All',
        noOrdersInStatus: 'No orders in this status',
        tryAnotherStatus: 'Try another status filter.',
        delivered: 'Delivered',
        notDelivered: 'Not delivered',
        notes: 'Notes',
        details: 'Details',
        new: 'New',
        note: 'Note',
        quantityUnit: 'pcs',
        amountReceived: 'Amount received',
        calendar: 'Calendar',
        today: 'Today',
        thisWeek: 'This week',
        thisMonth: 'This month',
        clearRange: 'Clear',
        allTime: 'All time',
        history: 'History',
        withdraw: 'Withdraw',
        withdrawFunds: 'Withdraw Funds',
        balance: 'Balance',
        amount: 'Amount (UZS)',
        withdrawSuccess: 'Withdrawal successful',
        withdrawError: 'Withdrawal failed',
      },
      uz: {
        notSynced: 'Sinxronlanmagan',
        metersAway: 'm qoldi',
        kmAway: 'km qoldi',
        active: 'Faol',
        paused: 'Pauza',
        lastSync: 'Oxirgi sinxron',
        deliveryMomentum: 'Progress',
        nextStop: 'Keyingi nuqta',
        inRoute: 'Yolda',
        pending: 'Kutilmoqda',
        noPendingStop: 'Keyingi nuqta yoq.',
        navigate: 'Yonaltirish',
        review: 'Korib chiqish',
        refresh: 'Yangilash',
        all: 'Barchasi',
        noOrdersInStatus: 'Bu holatda buyurtmalar yoq',
        tryAnotherStatus: 'Boshqa holatni tanlang.',
        delivered: 'Yetkazildi',
        notDelivered: 'Yetkazilmagan',
        notes: 'Izohlar',
        details: 'Batafsil',
        new: 'Yangi',
        note: 'Izoh',
        quantityUnit: 'dona',
        amountReceived: 'Olingan summa',
        calendar: 'Kalendar',
        today: 'Bugun',
        thisWeek: 'Shu hafta',
        thisMonth: 'Shu oy',
        clearRange: 'Tozalash',
        allTime: 'Barcha vaqt',
        history: 'Tarix',
        withdraw: 'Yechish',
        withdrawFunds: 'Pul yechish',
        balance: 'Balans',
        amount: 'Summa (UZS)',
        withdrawSuccess: 'Muvaffaqiyatli yechildi',
        withdrawError: 'Yechishda xatolik',
      },
      ru: {
        notSynced: 'Не синхронизировано',
        metersAway: 'м до точки',
        kmAway: 'км до точки',
        active: 'Активные',
        paused: 'На паузе',
        lastSync: 'Посл. синхр.',
        deliveryMomentum: 'Прогресс',
        nextStop: 'Следующая точка',
        inRoute: 'В пути',
        pending: 'Ожидает',
        noPendingStop: 'Нет следующей точки.',
        navigate: 'Маршрут',
        review: 'Проверить',
        refresh: 'Обновить',
        all: 'Все',
        noOrdersInStatus: 'Нет заказов',
        tryAnotherStatus: 'Выберите другой статус.',
        delivered: 'Доставлен',
        notDelivered: 'Не доставлено',
        notes: 'Комментарий',
        details: 'Детали',
        new: 'Новый',
        note: 'Примечание',
        quantityUnit: 'шт',
        amountReceived: 'Получено',
        calendar: 'Календарь',
        today: 'Сегодня',
        thisWeek: 'Эта неделя',
        thisMonth: 'Этот месяц',
        clearRange: 'Сбросить',
        allTime: 'За все время',
        history: 'История',
        withdraw: 'Вывод',
        withdrawFunds: 'Вывод средств',
        balance: 'Баланс',
        amount: 'Сумма (UZS)',
        withdrawSuccess: 'Вывод успешен',
        withdrawError: 'Ошибка вывода',
      },
    })[language],
    [language]
  )

  const activeOrdersCount = useMemo(
    () => orders.filter((o) => o.orderStatus === 'IN_DELIVERY' || o.orderStatus === 'PENDING').length,
    [orders]
  )
  const pausedOrdersCount = useMemo(() => orders.filter((o) => o.orderStatus === 'PAUSED').length, [orders])
  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.orderStatus === 'PENDING').length, [orders])
  const inDeliveryOrdersCount = useMemo(() => orders.filter((o) => o.orderStatus === 'IN_DELIVERY').length, [orders])
  const deliveredOrdersCount = useMemo(() => allOrders.filter((o) => o.orderStatus === 'DELIVERED').length, [allOrders])
  const notDeliveredOrdersCount = useMemo(
    () => allOrders.filter((o) => ['FAILED', 'CANCELED', 'CANCELLED'].includes(o.orderStatus)).length,
    [allOrders]
  )

  const lastSyncLabel = useMemo(
    () => lastOrdersSyncAt ? lastOrdersSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : uiText.notSynced,
    [lastOrdersSyncAt, uiText.notSynced]
  )

  const visibleOrders = useMemo(() => {
    if (showHistory) {
      return allOrders.filter((o) => ['DELIVERED', 'FAILED', 'CANCELED', 'CANCELLED'].includes(o.orderStatus))
    }
    if (orderStatusFilter === 'ALL') return orders
    return orders.filter((o) => o.orderStatus === orderStatusFilter)
  }, [orderStatusFilter, orders, allOrders, showHistory])

  const nextStopOrder = useMemo(
    () => orders.find((o) => o.orderStatus === 'IN_DELIVERY' || o.orderStatus === 'PENDING') || null,
    [orders]
  )

  const deliveryMomentum = useMemo(() => {
    if (activeOrdersCount === 0) return 0
    return Math.round((inDeliveryOrdersCount / activeOrdersCount) * 100)
  }, [activeOrdersCount, inDeliveryOrdersCount])

  const orderedVisibleOrders = useMemo(() => {
    const statusPriority: Record<string, number> = { IN_DELIVERY: 0, PENDING: 1, PAUSED: 2, DELIVERED: 3, FAILED: 4, CANCELED: 5, CANCELLED: 5 }
    return [...visibleOrders].sort((a, b) => {
      const d = (statusPriority[a.orderStatus] ?? 99) - (statusPriority[b.orderStatus] ?? 99)
      if (d !== 0) return d
      return (a.orderNumber ?? 0) - (b.orderNumber ?? 0)
    })
  }, [visibleOrders])

  const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371e3
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
  }

  const nextStopDistanceLabel = useMemo(() => {
    if (!nextStopOrder || !currentLocation || nextStopOrder.latitude == null || nextStopOrder.longitude == null) return null
    const meters = distanceMeters(currentLocation, { lat: nextStopOrder.latitude, lng: nextStopOrder.longitude })
    if (!Number.isFinite(meters)) return null
    return meters < 1000 ? `${Math.round(meters)} ${uiText.metersAway}` : `${(meters / 1000).toFixed(1)} ${uiText.kmAway}`
  }, [currentLocation, nextStopOrder, uiText.kmAway, uiText.metersAway])

  const sendLocationUpdate = async (lat: number, lng: number, force = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || isSendingLocationRef.current) return
    const now = Date.now()
    const prev = lastSentLocationRef.current
    if (!force && prev && distanceMeters(prev, { lat, lng }) < 20 && now - prev.at < 10_000) return
    isSendingLocationRef.current = true
    try {
      const r = await fetch('/api/courier/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude: lat, longitude: lng }), keepalive: true })
      if (r.ok) lastSentLocationRef.current = { lat, lng, at: now }
    } catch { /* ignore */ } finally { isSendingLocationRef.current = false }
  }

  const applyLocation = (lat: number, lng: number, force = false) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    setCurrentLocation({ lat, lng })
    void sendLocationUpdate(lat, lng, force)
  }

  useEffect(() => {
    const loadCourierData = async () => {
      const userStr = localStorage.getItem('user')
      if (userStr) try { setCourierData(JSON.parse(userStr)) } catch { /* */ }
      try {
        const r = await fetch('/api/courier/profile')
        if (r.ok) {
          const d = await r.json()
          const p = { id: d.id, name: d.name, email: d.email, role: 'COURIER' }
          setCourierData(p)
          setCourierBalance(d.balance ?? 0)
          localStorage.setItem('user', JSON.stringify(p))
        }
      } catch { /* */ }
    }
    void loadCourierData()
    void fetchOrders()
    getCurrentLocation(true)
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => applyLocation(p.coords.latitude, p.coords.longitude),
        () => { /* */ },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
      )
    }
    const li = setInterval(() => getCurrentLocation(false), 45000)
    const oi = setInterval(() => void fetchOrders(true), 60000)
    return () => { clearInterval(li); clearInterval(oi); if (watchIdRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current) }
  }, [])

  const getCurrentLocation = (force = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => applyLocation(p.coords.latitude, p.coords.longitude, force),
        () => setCurrentLocation((prev) => prev ?? { lat: 41.2995, lng: 69.2401 }),
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 12000 }
      )
    }
  }

  const getLocalIsoDate = (d: Date = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const fetchOrders = async (background = false) => {
    if (!background) setLoading(true); else setIsRefreshing(true)
    try {
      const today = getLocalIsoDate()
      const range = dateRangeRef.current
      const fromIso = range?.from ? getLocalIsoDate(range.from) : today
      const toIso = range?.from ? getLocalIsoDate(range.to ?? range.from) : today
      const r = await fetch(`/api/courier/orders?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`)
      if (r.status === 401) { window.location.href = '/login'; return }
      if (r.ok) {
        const data = await r.json()
        const normalized: Order[] = (Array.isArray(data) ? data : []).map((o: any) => {
          const lat = o?.latitude ?? o?.customer?.latitude ?? extractCoordsFromText(String(o?.deliveryAddress ?? ''))?.lat ?? null
          const lng = o?.longitude ?? o?.customer?.longitude ?? extractCoordsFromText(String(o?.deliveryAddress ?? ''))?.lng ?? null
          return { ...o, latitude: lat, longitude: lng, customer: o?.customer ?? { name: '', phone: '' } } as Order
        })
        const active = normalized.filter((o) => ['PENDING', 'IN_DELIVERY', 'PAUSED'].includes(o.orderStatus)).sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
        setAllOrders(normalized)
        setOrders(active)
        setLastOrdersSyncAt(new Date())
        if (selectedOrder) {
          const updated = active.find((o) => o.id === selectedOrder.id)
          if (updated) { setSelectedOrder(updated); setIsOrderPaused(updated.orderStatus === 'PAUSED') }
          else { setSelectedOrder(null); setIsOrderOpen(false) }
        }
      }
    } catch { if (!background) toast.error(t.common.error) }
    finally { setLoading(false); setIsRefreshing(false) }
  }

  useEffect(() => {
    if (!didInitialRangeFetchRef.current) { didInitialRangeFetchRef.current = true; return }
    void fetchOrders(true)
  }, [dateRange])

  const handleOpenOrder = (order: Order) => { setSelectedOrder(order); setIsOrderOpen(true); setIsOrderPaused(order.orderStatus === 'PAUSED'); setAmountReceived('') }
  const handleCloseOrderDetailSheet = () => { setIsOrderOpen(false); setSelectedOrder(null); setAmountReceived('') }

  const handleStartDelivery = async () => {
    if (!selectedOrder) return
    try {
      const r = await fetch(`/api/orders/${selectedOrder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'start_delivery' }) })
      if (r.ok) { toast.success(t.courier.startDelivery); setOrders((p) => p.map((o) => o.id === selectedOrder.id ? { ...o, orderStatus: 'IN_DELIVERY' } : o)); setSelectedOrder((p) => p ? { ...p, orderStatus: 'IN_DELIVERY' } : null); setIsOrderPaused(false) }
    } catch { toast.error(t.common.error) }
  }

  const handleCompleteDelivery = async () => {
    if (!selectedOrder || isCompleting) return
    if (!window.confirm(`${t.courier.completeDelivery}?`)) return
    setIsCompleting(true)
    try {
      const r = await fetch(`/api/orders/${selectedOrder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'complete_delivery', amountReceived: amountReceived ? parseFloat(amountReceived) : null }) })
      if (r.ok) { toast.success(t.common.success); handleCloseOrderDetailSheet(); void fetchOrders() }
      else if (r.status === 401) window.location.href = '/login'
      else { const d = await r.json().catch(() => ({})); toast.error(d.error || t.common.error) }
    } catch { toast.error(t.common.error) } finally { setIsCompleting(false) }
  }

  const handlePauseOrder = async () => {
    if (!selectedOrder) return
    try {
      const r = await fetch(`/api/orders/${selectedOrder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'pause_delivery' }) })
      if (r.ok) { setIsOrderPaused(true); toast.info(t.courier.pauseDelivery); setOrders((p) => p.map((o) => o.id === selectedOrder.id ? { ...o, orderStatus: 'PAUSED' } : o)); setSelectedOrder((p) => p ? { ...p, orderStatus: 'PAUSED' } : null) }
    } catch { toast.error(t.common.error) }
  }

  const handleResumeOrder = async () => {
    if (!selectedOrder) return
    try {
      const r = await fetch(`/api/orders/${selectedOrder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'resume_delivery' }) })
      if (r.ok) { setIsOrderPaused(false); toast.success(t.courier.resumeDelivery); setOrders((p) => p.map((o) => o.id === selectedOrder.id ? { ...o, orderStatus: 'IN_DELIVERY' } : o)); setSelectedOrder((p) => p ? { ...p, orderStatus: 'IN_DELIVERY' } : null) }
    } catch { toast.error(t.common.error) }
  }

  const openRouteForOrder = (order: Order) => {
    const dest = order.latitude != null && order.longitude != null ? `${order.latitude},${order.longitude}` : order.deliveryAddress
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`
    if (currentLocation) url += `&origin=${currentLocation.lat},${currentLocation.lng}`
    window.open(url, '_blank')
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || isWithdrawing) return
    setIsWithdrawing(true)
    try {
      const r = await fetch('/api/courier/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(withdrawAmount) }) })
      if (r.ok) { toast.success(uiText.withdrawSuccess); setIsWithdrawOpen(false); setWithdrawAmount(''); const d = await r.json(); setCourierBalance(d.newBalance ?? courierBalance - parseFloat(withdrawAmount)) }
      else { const d = await r.json().catch(() => ({})); toast.error(d.error || uiText.withdrawError) }
    } catch { toast.error(uiText.withdrawError) } finally { setIsWithdrawing(false) }
  }

  const handleLogout = async () => { localStorage.removeItem('token'); localStorage.removeItem('user'); await signOut({ callbackUrl: '/', redirect: true }) }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[100px] pointer-events-none animate-pulse" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="mb-4 relative z-10">
          <div className="h-14 w-14 bg-primary rounded-[28px] flex items-center justify-center shadow-xl border-b-4 border-black/20">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
        </motion.div>
        <p className="text-muted-foreground font-bold relative z-10">{t.common.loading}</p>
      </div>
    )
  }

  const statusColorMap: Record<string, string> = {
    IN_DELIVERY: 'bg-blue-500',
    PENDING: 'bg-amber-500',
    PAUSED: 'bg-yellow-500',
    DELIVERED: 'bg-emerald-500',
    FAILED: 'bg-rose-500',
    CANCELED: 'bg-rose-500',
    CANCELLED: 'bg-rose-500',
  }

  const statusLabelMap: Record<string, string> = {
    IN_DELIVERY: uiText.inRoute,
    PENDING: uiText.pending,
    PAUSED: uiText.paused,
    DELIVERED: uiText.delivered,
    FAILED: uiText.notDelivered,
    CANCELED: uiText.notDelivered,
    CANCELLED: uiText.notDelivered,
  }

  return (
    <div className={cn("min-h-screen bg-background pb-6 relative overflow-hidden transition-colors duration-500")}>
      {/* Premium Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="h-20 md:h-24 bg-primary flex items-center justify-between px-4 md:px-8 rounded-b-[40px] shadow-2xl z-50 relative border-b-6 border-black/10"
      >
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-white/10 backdrop-blur-xl p-3 rounded-[20px] shadow-inner border-2 border-dashed border-white/20 group-hover:border-white/40 transition-all">
              <Package className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-black text-white tracking-tighter uppercase leading-none">{t.courier.title}</h1>
              <p className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Delivery Agent</p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Withdraw Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, y: 3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsWithdrawOpen(true)}
            className="w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-all group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all">
              <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
          </motion.button>

          {/* Dark/Light Mode */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, rotate: 12, y: 3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => updateAdminSettings({ theme: isDark ? 'light' : 'dark' })}
            className="w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-all group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all">
              {isDark ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-white" />}
            </div>
          </motion.button>

          {/* Language */}
          <LanguageSwitcherCompact
            className="w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full shadow-xl border-b-4 border-black/20 transition-all"
            align="end"
          />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: -12, y: 3 }}
                whileTap={{ scale: 0.9 }}
                className="w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-all group"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all">
                  <ChefHat className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] rounded-3xl border-none shadow-2xl p-2 bg-white/90 dark:bg-card/90 backdrop-blur-3xl animate-in fade-in zoom-in-95">
              <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40">Courier</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setIsChatOpen(true)} className="h-12 rounded-2xl gap-3 font-bold hover:bg-primary/10">
                <MessageSquare className="h-5 w-5 opacity-60" />
                <span>Chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {/* open settings */}} className="h-12 rounded-2xl gap-3 font-bold hover:bg-primary/10">
                <Settings className="h-5 w-5 opacity-60" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
              <DropdownMenuItem onSelect={handleLogout} className="h-12 rounded-2xl gap-3 text-rose-600 focus:text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <LogOut className="h-5 w-5" />
                <span>Exit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: uiText.active, value: activeOrdersCount, dot: 'bg-blue-500', color: 'text-blue-600 dark:text-blue-400' },
            { label: uiText.paused, value: pausedOrdersCount, dot: 'bg-amber-500', color: 'text-amber-600 dark:text-amber-400' },
            { label: uiText.delivered, value: deliveredOrdersCount, dot: 'bg-emerald-500', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: uiText.deliveryMomentum, value: `${deliveryMomentum}%`, dot: 'bg-primary', color: 'text-foreground' },
          ].map((s, i) => (
            <motion.div key={i} whileHover={{ y: -3, scale: 1.02 }}
              className="rounded-3xl border-2 border-dashed border-border p-4 bg-card/80 dark:bg-card/40 hover:bg-muted/20 transition-all overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
              </div>
              <div className={cn("text-2xl font-black tracking-tighter", s.color)}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Map */}
        <motion.div whileHover={{ scale: 1.005 }} className="rounded-[32px] border-2 border-dashed border-border overflow-hidden shadow-xl h-[280px] md:h-[350px] relative">
          <CourierMap orders={orders} currentLocation={currentLocation} onMarkerClick={handleOpenOrder} />
          {/* Sync badge */}
          <div className="absolute bottom-4 left-4 bg-card/80 dark:bg-card/60 backdrop-blur-xl rounded-full px-4 py-2 border border-border shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {uiText.lastSync}: {lastSyncLabel}
            </div>
          </div>
        </motion.div>

        {/* Next Stop Card */}
        {nextStopOrder && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">{uiText.nextStop}</p>
              <p className="text-lg font-black text-foreground">#{nextStopOrder.orderNumber} {nextStopOrder.customer.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={cn("rounded-full", nextStopOrder.orderStatus === 'IN_DELIVERY' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white')}>
                  {statusLabelMap[nextStopOrder.orderStatus]}
                </Badge>
                {nextStopDistanceLabel && <span className="text-xs font-bold text-muted-foreground">{nextStopDistanceLabel}</span>}
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{nextStopOrder.deliveryAddress}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openRouteForOrder(nextStopOrder)} className="rounded-full bg-primary text-white shadow-lg font-bold px-5">
                <Navigation className="w-4 h-4 mr-2" />{uiText.navigate}
              </Button>
              <Button variant="outline" onClick={() => handleOpenOrder(nextStopOrder)} className="rounded-full font-bold px-5 border-2 border-dashed">
                {uiText.review}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Orders Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {showHistory ? uiText.history : t.courier.todayOrders} ({orderedVisibleOrders.length})
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{uiText.delivered}: <strong className="text-emerald-600">{deliveredOrdersCount}</strong></span>
              <span>·</span>
              <span>{uiText.notDelivered}: <strong className="text-rose-600">{notDeliveredOrdersCount}</strong></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={showHistory ? 'default' : 'outline'} size="sm" className="rounded-full font-bold border-2 border-dashed" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4 mr-1.5" />{uiText.history}
            </Button>
            <CalendarRangeSelector value={dateRange} onChange={setDateRange}
              uiText={{ calendar: uiText.calendar, today: uiText.today, thisWeek: uiText.thisWeek, thisMonth: uiText.thisMonth, clearRange: uiText.clearRange, allTime: uiText.allTime }}
              locale={language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'}
              className="min-w-[180px]"
            />
            <Button variant="outline" size="sm" className="rounded-full font-bold border-2 border-dashed" onClick={() => fetchOrders(true)} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-1.5", isRefreshing && 'animate-spin')} />{uiText.refresh}
            </Button>
          </div>
        </div>

        {/* Status Filters */}
        {!showHistory && (
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'ALL' as const, label: `${uiText.all} (${orders.length})` },
              { id: 'PENDING' as const, label: `${uiText.pending} (${pendingOrdersCount})` },
              { id: 'IN_DELIVERY' as const, label: `${uiText.inRoute} (${inDeliveryOrdersCount})` },
              { id: 'PAUSED' as const, label: `${uiText.paused} (${pausedOrdersCount})` },
            ]).map((opt) => (
              <Button key={opt.id} size="sm" variant={orderStatusFilter === opt.id ? 'default' : 'outline'}
                className={cn("rounded-full font-bold border-2 border-dashed transition-all", orderStatusFilter === opt.id && "shadow-lg")}
                onClick={() => setOrderStatusFilter(opt.id)}
              >{opt.label}</Button>
            ))}
          </div>
        )}

        {/* Route Optimize */}
        {orderedVisibleOrders.length > 0 && !showHistory && (
          <RouteOptimizeButton
            orders={orderedVisibleOrders.map((o) => ({ id: o.id, deliveryAddress: o.deliveryAddress, latitude: o.latitude, longitude: o.longitude, customerName: o.customer.name }))}
            onOptimized={(ids) => { const ordered = ids.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as typeof orders; setOrders([...ordered, ...orders.filter((o) => !ids.includes(o.id))]) }}
            startPoint={currentLocation}
            variant="outline"
            size="sm"
          />
        )}

        {/* Orders List */}
        <AnimatePresence mode="popLayout">
          {orderedVisibleOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border-2 border-dashed border-border bg-card py-16 text-center">
              <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-black text-muted-foreground/60 uppercase tracking-tight">{showHistory ? uiText.history : uiText.noOrdersInStatus}</h3>
              <p className="text-muted-foreground/40 font-medium mt-1">{uiText.tryAnotherStatus}</p>
            </motion.div>
          ) : (
            orderedVisibleOrders.map((order, idx) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: idx * 0.04 }}>
                <motion.div whileHover={{ y: -3, scale: 1.01 }}
                  className={cn(
                    "rounded-3xl border-2 border-dashed border-border p-5 cursor-pointer transition-all overflow-hidden relative",
                    order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card hover:bg-muted/20'
                  )}
                  onClick={() => handleOpenOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-lg text-foreground">#{order.orderNumber}</span>
                        <Badge className={cn("rounded-full text-white text-[10px] font-black", statusColorMap[order.orderStatus] || 'bg-gray-500')}>
                          {statusLabelMap[order.orderStatus] || order.orderStatus}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-foreground">{order.customer.name}</h3>
                      <div className="flex items-center text-muted-foreground text-sm gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{order.deliveryAddress}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="font-mono font-black text-foreground">{order.deliveryTime}</div>
                      <div className="text-xs text-muted-foreground/60 font-bold mt-1">{order.calories} kcal</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t-2 border-dashed border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Utensils className="w-4 h-4" />{order.quantity} {uiText.quantityUnit}</div>
                      {order.specialFeatures && order.specialFeatures !== '{}' && (
                        <div className="flex items-center gap-1 text-amber-600"><AlertCircle className="w-4 h-4" />{uiText.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold text-sm">
                      {uiText.details}<ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </main>

      {/* Order Detail Sheet */}
      <Sheet open={isOrderOpen} onOpenChange={setIsOrderOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-[32px] p-0 border-t-2 border-dashed border-border">
          {selectedOrder && (
            <div className="h-full flex flex-col">
              <div className="p-6 pb-0">
                <SheetHeader className="mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2 rounded-full border-2 border-dashed font-black">#{selectedOrder.orderNumber}</Badge>
                      <SheetTitle className="text-2xl font-black text-foreground">{selectedOrder.customer.name}</SheetTitle>
                      <SheetDescription className="flex items-center mt-1 font-bold"><Clock className="w-4 h-4 mr-1" />{selectedOrder.deliveryTime}</SheetDescription>
                    </div>
                    <Badge className={cn("rounded-full px-4 py-1.5 text-white font-black", statusColorMap[isOrderPaused ? 'PAUSED' : selectedOrder.orderStatus])}>
                      {isOrderPaused ? t.courier.pauseDelivery : selectedOrder.orderStatus === 'IN_DELIVERY' ? t.courier.activeOrder : uiText.new}
                    </Badge>
                  </div>
                </SheetHeader>
                <div className="space-y-3">
                  <div className="flex items-start rounded-2xl bg-muted/40 dark:bg-muted/20 p-4 border-2 border-dashed border-border">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
                    <div><p className="text-xs text-muted-foreground font-bold mb-0.5">{t.courier.deliveryAddress}</p><p className="font-bold text-foreground">{selectedOrder.deliveryAddress}</p></div>
                  </div>
                  <div className="flex items-center rounded-2xl bg-muted/40 dark:bg-muted/20 p-4 border-2 border-dashed border-border">
                    <Phone className="w-5 h-5 text-primary mr-3 shrink-0" />
                    <div><p className="text-xs text-muted-foreground font-bold mb-0.5">{t.common.phone}</p><a href={`tel:${selectedOrder.customer.phone}`} className="font-bold text-foreground hover:text-primary">{selectedOrder.customer.phone}</a></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted/40 dark:bg-muted/20 p-4 border-2 border-dashed border-border">
                      <div className="flex items-center gap-2 mb-1"><Package className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground font-bold">{t.common.quantity}</span></div>
                      <p className="font-black text-foreground">{selectedOrder.quantity} {uiText.quantityUnit}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 dark:bg-muted/20 p-4 border-2 border-dashed border-border">
                      <div className="flex items-center gap-2 mb-1"><Utensils className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground font-bold">{t.common.calories}</span></div>
                      <p className="font-black text-foreground">{selectedOrder.calories}</p>
                    </div>
                  </div>
                  {selectedOrder.specialFeatures && selectedOrder.specialFeatures !== '{}' && (
                    <div className="rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2 mb-1 text-amber-600"><AlertCircle className="w-4 h-4" /><span className="text-xs font-black">{uiText.note}</span></div>
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{selectedOrder.specialFeatures}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-auto p-6 bg-muted/20 border-t-2 border-dashed border-border space-y-3">
                {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') && (
                  <div className="rounded-2xl border-2 border-dashed border-border bg-card p-4">
                    <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{uiText.amountReceived}</label>
                    <div className="relative">
                      <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0"
                        className="h-12 w-full rounded-xl border-2 border-dashed border-border bg-background px-4 font-bold focus:border-primary focus:outline-none transition-colors"
                      />
                      <span className="absolute right-4 top-3.5 text-muted-foreground text-sm font-bold">UZS</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-full font-bold border-2 border-dashed" onClick={() => selectedOrder && openRouteForOrder(selectedOrder)}>
                    <Navigation className="w-5 h-5 mr-2" />{t.courier.buildRoute}
                  </Button>
                  {selectedOrder.orderStatus === 'PENDING' && (
                    <Button className="h-12 rounded-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={handleStartDelivery}>
                      <Play className="w-5 h-5 mr-2" />{t.courier.apply}
                    </Button>
                  )}
                  {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') && (
                    isOrderPaused ? (
                      <Button className="h-12 rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg" onClick={handleResumeOrder}>
                        <Play className="w-5 h-5 mr-2" />{t.courier.resumeDelivery}
                      </Button>
                    ) : (
                      <Button variant="secondary" className="h-12 rounded-full font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400" onClick={handlePauseOrder}>
                        <Pause className="w-5 h-5 mr-2" />{t.courier.pauseDelivery}
                      </Button>
                    )
                  )}
                </div>
                {(selectedOrder.orderStatus === 'IN_DELIVERY' || selectedOrder.orderStatus === 'PAUSED') && (
                  <Button className="h-12 w-full rounded-full font-black text-base shadow-xl" onClick={handleCompleteDelivery} disabled={isCompleting}>
                    <CheckCircle className="w-6 h-6 mr-2" />
                    {isCompleting ? t.common.loading : t.courier.completeDelivery}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {isWithdrawOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWithdrawOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-card rounded-[32px] shadow-2xl border-2 border-border p-8 z-[1000] w-full max-w-[400px] mx-auto"
            >
              <button type="button" onClick={() => setIsWithdrawOpen(false)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-foreground" />
              </button>
              <h3 className="text-2xl font-black text-foreground mb-1">{uiText.withdrawFunds}</h3>
              <p className="text-sm text-muted-foreground font-medium mb-6">{uiText.balance}: <strong className="text-foreground">{courierBalance.toLocaleString()} UZS</strong></p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">{uiText.amount}</label>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0"
                    className="mt-1 h-14 w-full rounded-2xl border-2 border-dashed border-border bg-muted/20 px-5 text-xl font-black focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <Button className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl" onClick={handleWithdraw} disabled={isWithdrawing || !withdrawAmount}>
                  {isWithdrawing ? <RefreshCw className="w-5 h-5 animate-spin" /> : uiText.withdraw}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChatSheet
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        title="Chat"
        description="Courier conversations (Tambo AI is inside the chat list)."
      />
    </div>
  )
}
