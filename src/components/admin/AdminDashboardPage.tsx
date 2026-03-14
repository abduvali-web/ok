'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pause,
  Play,
  Save,
  RefreshCw,
  Filter,
  Route,
  CalendarDays,
  MapPin,
  Edit,
  Clock,
  Truck,
  Database,
} from 'lucide-react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserGuide } from '@/components/UserGuide'
import { TrialStatus } from '@/components/admin/TrialStatus'
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal'
import { SiteBuilderCard } from '@/components/admin/SiteBuilderCard'
import { getDailyPrice, PLAN_TYPES } from '@/lib/menuData'
import { CANONICAL_TABS, deriveVisibleTabs } from '@/components/admin/dashboard/tabs'
import type { Client, Order } from '@/components/admin/dashboard/types'
import { DesktopTabsNav } from '@/components/admin/dashboard/DesktopTabsNav'
import { useDashboardData } from '@/components/admin/dashboard/useDashboardData'
import { AdminsTab } from '@/components/admin/dashboard/tabs-content/AdminsTab'
import { OrderModal } from '@/components/admin/dashboard/modals/OrderModal'
import { DispatchMapPanel } from '@/components/admin/orders/DispatchMapPanel'
import { FilterToolbar } from '@/components/admin/dashboard/shared/FilterToolbar'
import { SectionMetrics } from '@/components/admin/dashboard/shared/SectionMetrics'
import { TabEmptyState } from '@/components/admin/dashboard/shared/TabEmptyState'
import { EntityStatusBadge } from '@/components/admin/dashboard/shared/EntityStatusBadge'
import {
  expandShortMapsUrl,
  extractCoordsFromText,
  isShortGoogleMapsUrl,
  parseGoogleMapsUrl,
  type LatLng,
} from '@/lib/geo'

import { MobileSidebar } from '@/components/MobileSidebar'
import { MobileTabIndicator } from '@/components/MobileTabIndicator'

const OrdersTable = dynamic(
  () => import('@/components/admin/OrdersTable').then((mod) => mod.OrdersTable),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const HistoryTable = dynamic(
  () => import('@/components/admin/HistoryTable').then((mod) => mod.HistoryTable),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const InterfaceSettings = dynamic(
  () => import('@/components/admin/InterfaceSettings').then((mod) => mod.InterfaceSettings),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const ChatTab = dynamic(
  () => import('@/components/chat/ChatTab').then((mod) => mod.ChatTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const TodaysMenu = dynamic(
  () => import('@/components/admin/TodaysMenu').then((mod) => mod.TodaysMenu),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const WarehouseTab = dynamic(
  () => import('@/components/admin/WarehouseTab').then((mod) => mod.WarehouseTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const FinanceTab = dynamic(
  () => import('@/components/admin/FinanceTab').then((mod) => mod.FinanceTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const RouteOptimizeButton = dynamic(
  () => import('@/components/admin/RouteOptimizeButton').then((mod) => mod.RouteOptimizeButton),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading...</div> }
)
const MiddleLiveMap = dynamic(
  () => import('@/components/admin/orders/MiddleLiveMap'),
  { ssr: false, loading: () => <div className="h-[360px] w-full animate-pulse rounded-xl bg-slate-100" /> }
)
export type AdminDashboardMode = 'middle' | 'low'

const DASHBOARD_UI_STORAGE_PREFIX = 'autofood:dashboard-ui'

const DEFAULT_ORDER_FILTERS = {
  successful: false,
  failed: false,
  pending: false,
  inDelivery: false,
  prepaid: false,
  paid: false,
  unpaid: false,
  card: false,
  cash: false,
  daily: false,
  evenDay: false,
  oddDay: false,
  special: false,
  calories1200: false,
  calories1600: false,
  calories2000: false,
  calories2500: false,
  calories3000: false,
  singleItem: false,
  multiItem: false,
  autoOrders: false,
  manualOrders: false,
}

export function AdminDashboardPage({ mode }: { mode: AdminDashboardMode }) {
  const { t, language } = useLanguage()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState(() => (mode === 'middle' ? 'orders' : 'statistics'))
  const [currentDate, setCurrentDate] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => (mode === 'middle' ? new Date() : null))
  const [, setDateCursor] = useState<Date>(() => new Date())
  const [isUiStateHydrated, setIsUiStateHydrated] = useState(false)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isDeleteOrdersDialogOpen, setIsDeleteOrdersDialogOpen] = useState(false)
  const [isDeleteClientsDialogOpen, setIsDeleteClientsDialogOpen] = useState(false)
  const [isPauseClientsDialogOpen, setIsPauseClientsDialogOpen] = useState(false)
  const [isResumeClientsDialogOpen, setIsResumeClientsDialogOpen] = useState(false)
  const [isDeletingOrders, setIsDeletingOrders] = useState(false)
  const [isMutatingClients, setIsMutatingClients] = useState(false)
  const [optimizeCourierId, setOptimizeCourierId] = useState('all')
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [isCreateCourierModalOpen, setIsCreateCourierModalOpen] = useState(false)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [isBulkEditOrdersModalOpen, setIsBulkEditOrdersModalOpen] = useState(false)
  const [isBulkEditClientsModalOpen, setIsBulkEditClientsModalOpen] = useState(false)
  const [bulkOrderUpdates, setBulkOrderUpdates] = useState({
    orderStatus: '',
    paymentStatus: '',
    courierId: '',
    deliveryDate: ''
  })
  const [bulkClientUpdates, setBulkClientUpdates] = useState({
    isActive: undefined as boolean | undefined,
    calories: ''
  })
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrderTimeline, setSelectedOrderTimeline] = useState<
    Array<{
      id: string
      eventType: string
      occurredAt: string
      actorName?: string
      message?: string
      previousStatus?: string | null
      nextStatus?: string | null
    }>
  >([])
  const [isOrderTimelineLoading, setIsOrderTimelineLoading] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const tabsCopy = {
    orders: t.admin.orders,
    clients: t.admin.clients,
    admins: t.admin.admins,
    bin: t.admin.bin,
    statistics: t.admin.statistics,
    history: t.admin.history,
    profile: t.common.profile,
    warehouse: t.warehouse.title,
    finance: t.finance.title,
    interface: t.admin.interface,
  }
  const [courierFormData, setCourierFormData] = useState({
    name: '',
    email: '',
    password: '',
    salary: ''
  })
  const [clientFormData, setClientFormData] = useState({
    name: '',
    nickName: '',
    phone: '',
    address: '',
    calories: 1200,
    planType: 'CLASSIC' as 'CLASSIC' | 'INDIVIDUAL' | 'DIABETIC',
    dailyPrice: 84000,
    notes: '',
    specialFeatures: '',
    deliveryDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    autoOrdersEnabled: true,
    isActive: true,
    defaultCourierId: '',
    googleMapsLink: '',
    latitude: null as number | null,
    longitude: null as number | null,
    assignedSetId: ''
  })
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryTime: '',
    quantity: 1,
    calories: 1200,
    specialFeatures: '',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    isPrepaid: false,
    selectedClientId: '',
    latitude: null as number | null,
    longitude: null as number | null,
    courierId: '',
    assignedSetId: ''
  })
  const [_parsedCoords, setParsedCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isCreatingCourier, setIsCreatingCourier] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [warehousePoint, setWarehousePoint] = useState<LatLng | null>(null)
  const [warehouseInput, setWarehouseInput] = useState('')
  const [warehousePreview, setWarehousePreview] = useState<LatLng | null>(null)
  const [isWarehouseLoading, setIsWarehouseLoading] = useState(false)
  const [isWarehouseSaving, setIsWarehouseSaving] = useState(false)
  // Set current date on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])
  const [courierError, setCourierError] = useState('')
  const [clientError, setClientError] = useState('')
  const [filters, setFilters] = useState({ ...DEFAULT_ORDER_FILTERS })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBinClients, setSelectedBinClients] = useState<Set<string>>(new Set())

  const {
    meRole,
    allowedTabs,
    isLoading,
    lowAdmins,
    orders,
    setOrders,
    clients,
    couriers,
    availableSets,
    stats,
    binClients,
    binOrders,
    refreshAll,
    refreshBinClients,
    refreshBinOrders,
  } = useDashboardData({ selectedDate, filters })

  const fetchData = () => refreshAll()
  const fetchBinClients = () => refreshBinClients()
  const fetchBinOrders = () => refreshBinOrders()

  const isMiddleAdminView = mode === 'middle' || meRole === 'MIDDLE_ADMIN'
  const isLowAdminView = mode === 'low' || meRole === 'LOW_ADMIN'

  const visibleTabs = useMemo(() => {
    const derivedTabs = Array.isArray(allowedTabs)
      ? deriveVisibleTabs(allowedTabs)
      : [...(CANONICAL_TABS as unknown as string[])]

    return isMiddleAdminView ? derivedTabs.filter((tab) => tab !== 'statistics') : derivedTabs
  }, [allowedTabs, isMiddleAdminView])
  const uiStateStorageKey = useMemo(() => `${DASHBOARD_UI_STORAGE_PREFIX}:${mode}`, [mode])
  const isWarehouseReadOnly = isLowAdminView
  const activeFiltersCount = useMemo(
    () => Object.values(filters).reduce((count, value) => count + (value ? 1 : 0), 0),
    [filters]
  )

  const isSelectedDateToday = useMemo(() => {
    if (!selectedDate) return false
    const todayISO = new Date().toISOString().split('T')[0]
    const selectedISO = selectedDate.toISOString().split('T')[0]
    return selectedISO === todayISO
  }, [selectedDate])

  const selectedDayIsActive = useMemo(() => {
    if (!selectedDate) return null
    if (!Array.isArray(orders) || orders.length === 0) return false
    if (!isSelectedDateToday) return false
    return orders.some((o) => {
      const status = String((o as any)?.orderStatus ?? '')
      const hasCourier = !!(o as any)?.courierId
      return hasCourier && status !== 'NEW' && status !== 'IN_PROCESS'
    })
  }, [isSelectedDateToday, orders, selectedDate])

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'
  const profileUiText = useMemo(() => {
    if (language === 'ru') {
      return {
        database: 'База данных',
        noDateSelected: 'Дата не выбрана',
        allOrders: 'Все заказы',
        profileCenter: 'Профиль',
        profileCenterDescription: 'Безопасность, контекст аккаунта и быстрая навигация в одном месте',
        role: 'Роль',
        visibleTabs: 'Видимые вкладки',
        dispatchDate: 'Дата распределения',
        dispatchChooseDate: 'Выбрать дату',
        dispatchSave: 'Сохранить',
        dispatchStart: 'Начать',
        security: 'Безопасность',
        securityDescription: 'Защитите доступ к аккаунту и быстро завершайте сессии.',
        changePassword: 'Сменить пароль',
        quickNavigation: 'Быстрая навигация',
        warehouseStartPoint: 'Стартовая точка склада',
        warehouseStartPointDescription: 'Используется для построения и сортировки маршрутов всех курьеров.',
        warehouseInputLabel: 'Ссылка Google Maps или координаты (lat,lng)',
        readOnly: '(только чтение)',
        warehousePlaceholder: 'Пример: 41.311081,69.240562',
        current: 'Текущая',
        notConfigured: 'не настроено',
        preview: 'Предпросмотр',
        refresh: 'Обновить',
        saving: 'Сохранение...',
        saveLocation: 'Сохранить точку',
        messages: 'Сообщения',
        messagesDescription: 'Командные диалоги и быстрая координация.',
        ordersBin: 'Корзина заказов',
        clientsBin: 'Корзина клиентов',
        autoSet: 'Авто (активный глобальный набор)',
        active: '(Активный)',
        enableAutoOrderCreation: 'Включить автоматическое создание заказов',
        searchClientPlaceholder: 'Поиск клиента...',
        searchClientsAria: 'Поиск клиентов',
        clear: 'Очистить',
        calendar: 'Календарь',
        today: 'Сегодня',
        clearDate: 'Очистить дату',
        next: 'Далее',
        yesterday: 'Вчера',
        tomorrow: 'Завтра',
        searchOrdersPlaceholder: 'Поиск по имени, адресу или номеру заказа...',
        searchOrdersAria: 'Поиск заказов',
        rows: 'строк',
        filters: 'фильтров',
        resetFilters: 'Сбросить фильтры',
        noOrdersFound: 'Заказы не найдены',
        noOrdersFoundDescription: 'Измените фильтры или поисковый запрос.',
        showing: 'Показано',
        of: 'из',
        statusFilter: 'Фильтр статуса',
        allClients: 'Все клиенты',
        activeOnly: 'Только активные',
        pausedOnly: 'Только приостановленные',
        bin: 'Корзина',
        createClient: 'Создать клиента',
        editClient: 'Редактировать клиента',
        updateClientDetails: 'Обновите данные клиента.',
        createClientDescription: 'Создайте нового клиента в системе.',
        nickname: 'Псевдоним',
        nicknamePlaceholder: 'Пример: Офис, Дом... (необязательно)',
        mapLink: 'Ссылка на карту',
        phoneFormat: 'Формат: +998 XX XXX XX XX',
      }
    }

    if (language === 'uz') {
      return {
        database: 'Maʼlumotlar bazasi',
        noDateSelected: 'Sana tanlanmagan',
        allOrders: 'Barcha buyurtmalar',
        profileCenter: 'Profil markazi',
        profileCenterDescription: 'Xavfsizlik, akkaunt holati va tezkor navigatsiya bir joyda',
        role: 'Rol',
        visibleTabs: 'Ko‘rinadigan tablar',
        dispatchDate: 'Jo‘natish sanasi',
        dispatchChooseDate: 'Sanani tanlang',
        dispatchSave: 'Saqlash',
        dispatchStart: 'Boshlash',
        security: 'Xavfsizlik',
        securityDescription: 'Akkauntga kirishni himoya qiling va sessiyalarni tez yakunlang.',
        changePassword: 'Parolni o‘zgartirish',
        quickNavigation: 'Tezkor navigatsiya',
        warehouseStartPoint: 'Ombor boshlang‘ich nuqtasi',
        warehouseStartPointDescription: 'Barcha kuryerlar uchun marshrut qurish va saralashda ishlatiladi.',
        warehouseInputLabel: 'Google Maps havolasi yoki koordinatalar (lat,lng)',
        readOnly: '(faqat o‘qish)',
        warehousePlaceholder: 'Misol: 41.311081,69.240562',
        current: 'Joriy',
        notConfigured: 'sozlanmagan',
        preview: 'Ko‘rib chiqish',
        refresh: 'Yangilash',
        saving: 'Saqlanmoqda...',
        saveLocation: 'Joylashuvni saqlash',
        messages: 'Xabarlar',
        messagesDescription: 'Jamoa suhbatlari va tezkor muvofiqlashtirish.',
        ordersBin: 'Buyurtmalar savati',
        clientsBin: 'Mijozlar savati',
        autoSet: 'Avto (faol global to‘plam)',
        active: '(Faol)',
        enableAutoOrderCreation: 'Buyurtmalarni avtomatik yaratishni yoqish',
        searchClientPlaceholder: 'Mijozni qidirish...',
        searchClientsAria: 'Mijozlarni qidirish',
        clear: 'Tozalash',
        calendar: 'Kalendar',
        today: 'Bugun',
        clearDate: 'Sanani tozalash',
        next: 'Keyingi',
        yesterday: 'Kecha',
        tomorrow: 'Ertaga',
        searchOrdersPlaceholder: 'Ism, manzil yoki buyurtma raqami bo‘yicha qidirish...',
        searchOrdersAria: 'Buyurtmalarni qidirish',
        rows: 'qator',
        filters: 'filtr',
        resetFilters: 'Filtrlarni tozalash',
        noOrdersFound: 'Buyurtmalar topilmadi',
        noOrdersFoundDescription: 'Filtrlar yoki qidiruv so‘rovini o‘zgartiring.',
        showing: 'Ko‘rsatilmoqda',
        of: 'dan',
        statusFilter: 'Holat filtri',
        allClients: 'Barcha mijozlar',
        activeOnly: 'Faqat faol',
        pausedOnly: 'Faqat to‘xtatilgan',
        bin: 'Savat',
        createClient: 'Mijoz yaratish',
        editClient: 'Mijozni tahrirlash',
        updateClientDetails: 'Mijoz maʼlumotlarini yangilang.',
        createClientDescription: 'Tizimda yangi mijoz yarating.',
        nickname: 'Laqab',
        nicknamePlaceholder: 'Misol: Ofis, Uy... (ixtiyoriy)',
        mapLink: 'Xarita havolasi',
        phoneFormat: 'Format: +998 XX XXX XX XX',
      }
    }

    return {
      database: 'Database',
      noDateSelected: 'No date selected',
      allOrders: 'All orders',
      profileCenter: 'Profile center',
      profileCenterDescription: 'Security, account context, and quick navigation from one place',
      role: 'Role',
      visibleTabs: 'Visible tabs',
      dispatchDate: 'Dispatch date',
      dispatchChooseDate: 'Choose date',
      dispatchSave: 'Save',
      dispatchStart: 'Start',
      security: 'Security',
      securityDescription: 'Protect account access and end sessions quickly.',
      changePassword: 'Change password',
      quickNavigation: 'Quick navigation',
      warehouseStartPoint: 'Warehouse start point',
      warehouseStartPointDescription: 'Used for route generation and sorting for all couriers.',
      warehouseInputLabel: 'Google Maps URL or coordinates (lat,lng)',
      readOnly: '(read only)',
      warehousePlaceholder: 'Example: 41.311081,69.240562',
      current: 'Current',
      notConfigured: 'not configured',
      preview: 'Preview',
      refresh: 'Refresh',
      saving: 'Saving...',
      saveLocation: 'Save location',
      messages: 'Messages',
      messagesDescription: 'Team conversations and quick coordination.',
      ordersBin: 'Orders bin',
      clientsBin: 'Clients bin',
      autoSet: 'Auto (active global set)',
      active: '(Active)',
      enableAutoOrderCreation: 'Enable automatic order creation',
      searchClientPlaceholder: 'Search client...',
      searchClientsAria: 'Search clients',
      clear: 'Clear',
      calendar: 'Calendar',
      today: 'Today',
      clearDate: 'Clear date',
      next: 'Next',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      searchOrdersPlaceholder: 'Search by name, address, or order number...',
      searchOrdersAria: 'Search orders',
      rows: 'rows',
      filters: 'filters',
      resetFilters: 'Reset filters',
      noOrdersFound: 'No orders found',
      noOrdersFoundDescription: 'Adjust the filters or search query.',
      showing: 'Showing',
      of: 'of',
      statusFilter: 'Status filter',
      allClients: 'All clients',
      activeOnly: 'Active only',
      pausedOnly: 'Paused only',
      bin: 'Bin',
      createClient: 'Create client',
      editClient: 'Edit client',
      updateClientDetails: 'Update the client details.',
      createClientDescription: 'Create a new client in the system.',
      nickname: 'Nickname',
      nicknamePlaceholder: 'Example: Office, Home... (optional)',
      mapLink: 'Map link',
      phoneFormat: 'Format: +998 XX XXX XX XX',
    }
  }, [language])
  const selectedDateISO = selectedDate ? selectedDate.toISOString().split('T')[0] : ''
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString(dateLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : profileUiText.noDateSelected

  const applySelectedDate = useCallback((nextDate: Date | null) => {
    if (!nextDate) {
      setSelectedDate(null)
      return
    }

    const normalizedDate = new Date(nextDate)
    normalizedDate.setHours(0, 0, 0, 0)

    if (!Number.isNaN(normalizedDate.getTime())) {
      setSelectedDate(normalizedDate)
      setDateCursor(normalizedDate)
    }
  }, [])

  const shiftSelectedDate = useCallback((days: number) => {
    const baseDate = selectedDate ? new Date(selectedDate) : new Date()
    baseDate.setDate(baseDate.getDate() + days)
    applySelectedDate(baseDate)
  }, [applySelectedDate, selectedDate])

  const normalizedOrdersForSelectedDate = useMemo(() => {
    if (!selectedDate) return orders
    if (isSelectedDateToday) return orders
    if (!Array.isArray(orders) || orders.length === 0) return orders

    return orders.map((o) => {
      const status = String((o as any)?.orderStatus ?? '')
      if (status === 'PENDING' || status === 'IN_DELIVERY' || status === 'PAUSED') {
        return { ...o, orderStatus: 'NEW' }
      }
      return o
    })
  }, [isSelectedDateToday, orders, selectedDate])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return normalizedOrdersForSelectedDate

    return normalizedOrdersForSelectedDate.filter((order) => {
      const customerName = (order.customer?.name || order.customerName || '').toLowerCase()
      const deliveryAddress = (order.deliveryAddress || '').toLowerCase()
      const orderNumber = String(order.orderNumber ?? '')

      return (
        customerName.includes(normalizedSearch) ||
        deliveryAddress.includes(normalizedSearch) ||
        orderNumber.includes(normalizedSearch)
      )
    })
  }, [normalizedOrdersForSelectedDate, searchTerm])

  const filteredClients = useMemo(() => {
    const normalizedSearch = clientSearchTerm.trim().toLowerCase()

    return clients.filter((client) => {
      const statusMatch =
        clientStatusFilter === 'all' ||
        (clientStatusFilter === 'active' && client.isActive) ||
        (clientStatusFilter === 'inactive' && !client.isActive)

      if (!statusMatch) return false
      if (!normalizedSearch) return true

      return [client.name, client.nickName, client.phone, client.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedSearch))
    })
  }, [clientSearchTerm, clientStatusFilter, clients])

  const orderMetrics = useMemo(() => {
    const pendingCount = filteredOrders.filter((order) => order.orderStatus === 'PENDING').length
    const inDeliveryCount = filteredOrders.filter((order) => order.orderStatus === 'IN_DELIVERY').length

    return [
      {
        id: 'orders-visible',
        label: 'Visible orders',
        value: filteredOrders.length,
        tone: 'primary' as const,
      },
      {
        id: 'orders-selected',
        label: 'Selected orders',
        value: selectedOrders.size,
        tone: selectedOrders.size > 0 ? ('warning' as const) : ('neutral' as const),
      },
      {
        id: 'orders-pending',
        label: 'Pending',
        value: pendingCount,
        tone: 'warning' as const,
      },
      {
        id: 'orders-delivery',
        label: 'In delivery',
        value: inDeliveryCount,
        tone: 'success' as const,
      },
    ]
  }, [filteredOrders, selectedOrders.size])

  const clientMetrics = useMemo(() => {
    const activeCount = filteredClients.filter((client) => client.isActive).length
    const pausedCount = filteredClients.length - activeCount

    return [
      {
        id: 'clients-visible',
        label: 'Visible clients',
        value: filteredClients.length,
        tone: 'primary' as const,
      },
      {
        id: 'clients-selected',
        label: 'Selected clients',
        value: selectedClients.size,
        tone: selectedClients.size > 0 ? ('warning' as const) : ('neutral' as const),
      },
      {
        id: 'clients-active',
        label: 'Active',
        value: activeCount,
        tone: 'success' as const,
      },
      {
        id: 'clients-paused',
        label: 'Paused',
        value: pausedCount,
        tone: 'danger' as const,
      },
    ]
  }, [filteredClients, selectedClients.size])

  const selectedClientsSnapshot = useMemo(
    () => clients.filter((client) => selectedClients.has(client.id)),
    [clients, selectedClients]
  )
  const shouldPauseSelectedClients =
    selectedClientsSnapshot.length > 0 && selectedClientsSnapshot.every((client) => client.isActive)

  const clearOrderFilters = useCallback(() => {
    setFilters({ ...DEFAULT_ORDER_FILTERS })
  }, [])

  const refreshWarehousePoint = async () => {
    setIsWarehouseLoading(true)
    try {
      const res = await fetch('/api/admin/warehouse')
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      const lat = data && typeof data.lat === 'number' ? data.lat : null
      const lng = data && typeof data.lng === 'number' ? data.lng : null
      const point = lat != null && lng != null ? ({ lat, lng } as LatLng) : null
      setWarehousePoint(point)
      setWarehousePreview(point)
      setWarehouseInput(point ? `${lat},${lng}` : '')
    } catch (error) {
      console.error('Error loading warehouse point:', error)
    } finally {
      setIsWarehouseLoading(false)
    }
  }

  useEffect(() => {
    void refreshWarehousePoint()
  }, [])

  useEffect(() => {
    // Ensure future days remain drafts (server-side normalization for legacy data)
    void fetch('/api/admin/dispatch/normalize-drafts', { method: 'POST' }).catch(() => null)
  }, [])

  // Add effect to reset selected clients when filter changes
  useEffect(() => {
    setSelectedClients(new Set())
  }, [clientStatusFilter, clientSearchTerm])

  useEffect(() => {
    if (!isOrderDetailsModalOpen || !selectedOrder?.id) {
      setSelectedOrderTimeline([])
      return
    }

    let cancelled = false
    setIsOrderTimelineLoading(true)

    void fetch(`/api/admin/orders/${selectedOrder.id}/timeline`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return
        const events = Array.isArray(data?.events) ? data.events : []
        setSelectedOrderTimeline(events)
      })
      .catch(() => {
        if (!cancelled) setSelectedOrderTimeline([])
      })
      .finally(() => {
        if (!cancelled) setIsOrderTimelineLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOrderDetailsModalOpen, selectedOrder?.id])

  useEffect(() => {
    if (isUiStateHydrated || typeof window === 'undefined') return

    try {
      const rawState = localStorage.getItem(uiStateStorageKey)
      if (!rawState) {
        setIsUiStateHydrated(true)
        return
      }

      const state = JSON.parse(rawState) as {
        activeTab?: string
        selectedDateISO?: string | null
        showFilters?: boolean
        searchTerm?: string
        clientSearchTerm?: string
        optimizeCourierId?: string
        clientStatusFilter?: 'all' | 'active' | 'inactive'
      }

      if (typeof state.activeTab === 'string') setActiveTab(state.activeTab)
      if (typeof state.showFilters === 'boolean') setShowFilters(state.showFilters)
      if (typeof state.searchTerm === 'string') setSearchTerm(state.searchTerm.slice(0, 160))
      if (typeof state.clientSearchTerm === 'string') setClientSearchTerm(state.clientSearchTerm.slice(0, 160))
      if (typeof state.optimizeCourierId === 'string') setOptimizeCourierId(state.optimizeCourierId)
      if (state.clientStatusFilter === 'all' || state.clientStatusFilter === 'active' || state.clientStatusFilter === 'inactive') {
        setClientStatusFilter(state.clientStatusFilter)
      }
      if (state.selectedDateISO === null) {
        setSelectedDate(null)
        setDateCursor(new Date())
      } else if (typeof state.selectedDateISO === 'string') {
        const restoredDate = new Date(state.selectedDateISO)
        if (!Number.isNaN(restoredDate.getTime())) {
          setSelectedDate(restoredDate)
          setDateCursor(restoredDate)
        }
      }
    } catch (error) {
      console.error('Unable to restore dashboard UI state:', error)
    } finally {
      setIsUiStateHydrated(true)
    }
  }, [isUiStateHydrated, uiStateStorageKey])

  useEffect(() => {
    if (!isUiStateHydrated || typeof window === 'undefined') return

    localStorage.setItem(
      uiStateStorageKey,
      JSON.stringify({
        activeTab,
        selectedDateISO: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
        showFilters,
        searchTerm,
        clientSearchTerm,
        optimizeCourierId,
        clientStatusFilter,
      })
    )
  }, [
    activeTab,
    clientSearchTerm,
    clientStatusFilter,
    isUiStateHydrated,
    optimizeCourierId,
    searchTerm,
    selectedDate,
    showFilters,
    uiStateStorageKey,
  ])

  useEffect(() => {
    if (selectedDate) setDateCursor(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      const isEditable = !!target && (target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT')

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && activeTab === 'orders') {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      if (event.key === '/' && !isEditable && activeTab === 'orders') {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if (event.key === 'Escape') {
        if (showFilters) {
          setShowFilters(false)
          event.preventDefault()
          return
        }
        if (activeTab === 'orders' && searchTerm) {
          setSearchTerm('')
          event.preventDefault()
        }
      }

      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey && /^[1-9]$/.test(event.key)) {
        const tab = visibleTabs[Number(event.key) - 1]
        if (tab) {
          event.preventDefault()
          setActiveTab(tab)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTab, searchTerm, showFilters, visibleTabs])

  useEffect(() => {
    if (visibleTabs.length === 0) return
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0])
    }
  }, [activeTab, visibleTabs])

  const handleLogout = async () => {
    // Clear localStorage (for backward compatibility)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    // Sign out from NextAuth (clears session cookies)
    await signOut({ callbackUrl: '/', redirect: true })
  }

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleSelectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)))
    }
  }

  const handleDeleteSelectedOrders = async ({ skipConfirm = false }: { skipConfirm?: boolean } = {}) => {
    if (selectedOrders.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð´Ð»Ñ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    if (!skipConfirm) {
      setIsDeleteOrdersDialogOpen(true)
      return
    }

    try {
      setIsDeletingOrders(true)
      const response = await fetch('/api/admin/orders/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾ ${data.deletedCount} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)`)
        setSelectedOrders(new Set())
        setIsDeleteOrdersDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Delete orders error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsDeletingOrders(false)
    }
  }

  const handlePermanentDeleteOrders = async () => {
    if (isLowAdminView) {
      toast.error('Not allowed')
      return
    }
    if (selectedOrders.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð´Ð»Ñ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    const confirmMessage = `âš ï¸ Ð’ÐÐ˜ÐœÐÐÐ˜Ð•! Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÐÐÐ’Ð¡Ð•Ð“Ð”Ð ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ${selectedOrders.size} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)?\n\nÐ­Ñ‚Ð¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ ÐÐ•Ð›Ð¬Ð—Ð¯ Ð¾Ñ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ!`
    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð´Ð¸Ñ‚Ðµ ÐµÑ‰Ðµ Ñ€Ð°Ð·: Ð²Ñ‹ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ÑÑ‚Ð¸ Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð½Ð°Ð²ÑÐµÐ³Ð´Ð°?')
    if (!doubleConfirm) {
      return
    }

    try {
      const response = await fetch('/api/admin/orders/permanent-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾ Ð½Ð°Ð²ÑÐµÐ³Ð´Ð° ${data.deletedCount} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)`)
        setSelectedOrders(new Set())
        fetchBinOrders()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Permanent delete orders error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const handleRestoreSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð´Ð»Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    if (!confirm(`Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ${selectedOrders.size} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/orders/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ ${data.updatedCount} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)`)
        setSelectedOrders(new Set())
        fetchBinOrders()
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Restore orders error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const handleSelectAllBinOrders = () => {
    if (selectedOrders.size === binOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(binOrders.map(order => order.id)))
    }
  }

  const handlePermanentDeleteClients = async () => {
    if (isLowAdminView) {
      toast.error('Not allowed')
      return
    }
    if (selectedBinClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    const confirmMessage = `âš ï¸ Ð’ÐÐ˜ÐœÐÐÐ˜Ð•! Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÐÐÐ’Ð¡Ð•Ð“Ð”Ð ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ${selectedBinClients.size} ÐºÐ»Ð¸ÐµÐ½Ñ‚(Ð¾Ð²)?\n\nÐ’Ð¼ÐµÑÑ‚Ðµ Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð°Ð¼Ð¸ Ð±ÑƒÐ´ÑƒÑ‚ ÑƒÐ´Ð°Ð»ÐµÐ½Ñ‹ Ð’Ð¡Ð• Ð¸Ñ… Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð¸ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ.\n\nÐ­Ñ‚Ð¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ ÐÐ•Ð›Ð¬Ð—Ð¯ Ð¾Ñ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ!`
    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð´Ð¸Ñ‚Ðµ ÐµÑ‰Ðµ Ñ€Ð°Ð·: Ð²Ñ‹ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ÑÑ‚Ð¸Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð½Ð°Ð²ÑÐµÐ³Ð´Ð°?')
    if (!doubleConfirm) {
      return
    }

    try {
      const response = await fetch('/api/admin/clients/permanent-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientIds: Array.from(selectedBinClients) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾ Ð½Ð°Ð²ÑÐµÐ³Ð´Ð° ${data.deletedClients} ÐºÐ»Ð¸ÐµÐ½Ñ‚(Ð¾Ð²)`)
        setSelectedBinClients(new Set())
        fetchBinClients()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Permanent delete clients error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const handleWarehouseInputChange = (value: string) => {
    setWarehouseInput(value)
    const coords = extractCoordsFromText(value)
    setWarehousePreview(coords)
  }

  const handleWarehouseInputBlur = async () => {
    if (!warehouseInput || warehousePreview) return
    if (!isShortGoogleMapsUrl(warehouseInput)) return

    try {
      const expanded = await expandShortMapsUrl(warehouseInput)
      if (!expanded) return
      const coords = extractCoordsFromText(expanded)
      if (coords) setWarehousePreview(coords)
    } catch (error) {
      console.error('Error expanding warehouse url:', error)
    }
  }

  const handleSaveWarehousePoint = async () => {
    if (isWarehouseReadOnly) return
    if (!warehouseInput.trim()) {
      toast.error('Ð£ÐºÐ°Ð¶Ð¸Ñ‚Ðµ ÑÑÑ‹Ð»ÐºÑƒ Google Maps Ð¸Ð»Ð¸ ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ñ‹')
      return
    }

    setIsWarehouseSaving(true)
    try {
      const res = await fetch('/api/admin/warehouse', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleMapsLink: warehouseInput.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && data.error) || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ ÑÐºÐ»Ð°Ð´Ð°')
      }

      const lat = data && typeof data.lat === 'number' ? data.lat : null
      const lng = data && typeof data.lng === 'number' ? data.lng : null
      const point = lat != null && lng != null ? ({ lat, lng } as LatLng) : null
      setWarehousePoint(point)
      setWarehousePreview(point)
      setWarehouseInput(point ? `${lat},${lng}` : '')

      toast.success('Ð¡ÐºÐ»Ð°Ð´ ÑÐ¾Ñ…Ñ€Ð°Ð½Ñ‘Ð½')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ ÑÐºÐ»Ð°Ð´Ð°')
    } finally {
      setIsWarehouseSaving(false)
    }
  }

  const handleAddressChange = async (value: string) => {
    setOrderFormData(prev => ({ ...prev, deliveryAddress: value }))

    const parsed = await parseGoogleMapsUrl(value)
    setParsedCoords(parsed)
  }

  const handleClientAddressChange = async (value: string) => {
    setClientFormData(prev => ({ ...prev, googleMapsLink: value }))

    if (!value) {
      setClientFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null
      }))
      return
    }

    const parsed = await parseGoogleMapsUrl(value)
    if (parsed) {
      setClientFormData(prev => ({
        ...prev,
        latitude: parsed.lat,
        longitude: parsed.lng
      }))
    } else {
      setClientFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null
      }))
    }
  }



  const handleDeleteSelectedClients = async ({ skipConfirm = false }: { skipConfirm?: boolean } = {}) => {
    if (selectedClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    if (!skipConfirm) {
      setIsDeleteClientsDialogOpen(true)
      return
    }

    try {
      setIsMutatingClients(true)
      const response = await fetch('/api/admin/clients/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          deleteOrders: true,
          daysBack: 30
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾:\n- ${data.deletedClients} ÐºÐ»Ð¸ÐµÐ½Ñ‚(Ð¾Ð²)\n- ${data.deletedOrders} Ð·Ð°ÐºÐ°Ð·(Ð¾Ð²)`)
        setSelectedClients(new Set())
        setIsDeleteClientsDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Delete clients error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsMutatingClients(false)
    }
  }

  const handleClientSelect = (clientId: string) => {
    if (clientId && clientId !== "manual") {
      const selectedClient = clients.find(client => client.id === clientId)
      if (selectedClient) {
        setOrderFormData(prev => ({
          ...prev,
          selectedClientId: clientId,
          customerName: selectedClient.name,
          customerPhone: selectedClient.phone,
          deliveryAddress: selectedClient.address,
          calories: selectedClient.calories,
          specialFeatures: selectedClient.specialFeatures,
          assignedSetId: selectedClient.assignedSetId || ''
        }))

        void parseGoogleMapsUrl(selectedClient.address).then(parsed => {
          setParsedCoords(parsed)
        })
      }
    } else {
      // Ð•ÑÐ»Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚ Ð½Ðµ Ð²Ñ‹Ð±Ñ€Ð°Ð½ Ð¸Ð»Ð¸ Ð²Ñ‹Ð±Ñ€Ð°Ð½ Ñ€ÑƒÑ‡Ð½Ð¾Ð¹ Ð²Ð²Ð¾Ð´, Ð¾Ñ‡Ð¸Ñ‰Ð°ÐµÐ¼ Ð¿Ð¾Ð»Ñ Ð½Ð¾ Ð¾ÑÑ‚Ð°Ð²Ð»ÑÐµÐ¼ Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ñ Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ
      setOrderFormData(prev => ({
        ...prev,
        selectedClientId: clientId === "manual" ? "manual" : '',
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        calories: 1200,
        specialFeatures: '',
        assignedSetId: ''
      }))
      setParsedCoords(null)
    }
  }



  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrder(true)
    setOrderError('')

    try {
      const parsedCoordinates = await parseGoogleMapsUrl(orderFormData.deliveryAddress)

      const latitude = parsedCoordinates?.lat ?? null
      const longitude = parsedCoordinates?.lng ?? null

      // Add coordinates and date to order data, but keep original address
      const effectiveOrderDate = (selectedDate ?? new Date()).toISOString().split('T')[0]

      const orderDataWithCoords = {
        ...orderFormData,
        // Keep the original deliveryAddress, don't overwrite with coordinates
        latitude,
        longitude,
        date: effectiveOrderDate
      }

      let response;
      if (editingOrderId) {
        // Update existing order
        // We need to use a different endpoint or method for full update
        // Currently we only have PATCH for status/courier actions
        // Let's assume we can use the same POST endpoint but with an ID or a new PUT endpoint
        // But bulk update is limited.
        // Let's use a new action 'update_details' on the [id] route or create a new route.
        // For now, let's use the [id] route with a custom action.
        response = await fetch(`/api/orders/${editingOrderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update_details',
            ...orderDataWithCoords
          })
        })
      } else {
        // Create new order
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderDataWithCoords)
        })
      }

      const data = await response.json()

      if (response.ok) {
        setIsCreateOrderModalOpen(false)
        setParsedCoords(null)
        setOrderFormData({
          customerName: '',
          customerPhone: '',
          deliveryAddress: '',
          deliveryTime: '',
          quantity: 1,
          calories: 1200,
          specialFeatures: '',
          paymentStatus: 'UNPAID',
          paymentMethod: 'CASH',
          isPrepaid: false,
          selectedClientId: '',
          latitude: null,
          longitude: null,
          courierId: '',
          assignedSetId: ''
        })
        setEditingOrderId(null)
        fetchData()
      } else {
        setOrderError(data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð°')
      }
    } catch {
      setOrderError('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id)
    const inferredAssignedSetId =
      order.customer.assignedSetId ||
      (clients.find(c => c.phone === order.customer.phone)?.assignedSetId ?? '')
    setOrderFormData({
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      deliveryAddress: order.deliveryAddress,
      deliveryTime: order.deliveryTime,
      quantity: order.quantity,
      calories: order.calories,
      specialFeatures: order.specialFeatures || '',
      paymentStatus: order.paymentStatus as string,
      paymentMethod: order.paymentMethod as string,
      isPrepaid: order.isPrepaid,
      selectedClientId: '', // We don't link back to client selection for now to avoid overwriting
      latitude: order.latitude || null,
      longitude: order.longitude || null,
      courierId: order.courierId || '',
      assignedSetId: inferredAssignedSetId
    })
    setIsCreateOrderModalOpen(true)
  }

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingCourier(true)
    setCourierError('')

    try {
      const response = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...courierFormData,
          role: 'COURIER'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateCourierModalOpen(false)
        setCourierFormData({ name: '', email: '', password: '', salary: '' })
        fetchData()
        toast.success('ÐšÑƒÑ€ÑŒÐµÑ€ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑÐ¾Ð·Ð´Ð°Ð½')
      } else {
        setCourierError(data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ ÐºÑƒÑ€ÑŒÐµÑ€Ð°')
      }
    } catch {
      setCourierError('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsCreatingCourier(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingClient(true)
    setClientError('')

    try {
      const url = editingClientId
        ? `/api/admin/clients/${editingClientId}`
        : '/api/admin/clients'

      const method = editingClientId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientFormData)
      })

      const data = await response.json()

      if (response.ok) {
        setIsCreateClientModalOpen(false)
        setClientFormData({
          name: '',
          nickName: '',
          phone: '',
          address: '',
          calories: 1200,
          planType: 'CLASSIC',
          dailyPrice: 84000,
          notes: '',
          specialFeatures: '',
          deliveryDays: {
            monday: false,
            tuesday: false,
            wednesday: false,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false
          },
          autoOrdersEnabled: true,
          isActive: true,
          defaultCourierId: '',
          googleMapsLink: '',
          latitude: null,
          longitude: null,
          assignedSetId: ''
        })
        setEditingClientId(null)

        // Show success message
        const action = editingClientId ? 'Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½' : 'ÑÐ¾Ð·Ð´Ð°Ð½'
        const message = `ÐšÐ»Ð¸ÐµÐ½Ñ‚ "${data.client?.name || clientFormData.name}" ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ${action}!`
        let description = ''
        if (!editingClientId && data.autoOrdersCreated && data.autoOrdersCreated > 0) {
          description = `ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸ ÑÐ¾Ð·Ð´Ð°Ð½Ð¾ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²: ${data.autoOrdersCreated} (Ð½Ð° ÑÐ»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ðµ 30 Ð´Ð½ÐµÐ¹)`
        }

        toast.success(message, { description })
        fetchData()
      } else {
        const errorMessage = data.error || `ÐžÑˆÐ¸Ð±ÐºÐ° ${editingClientId ? 'Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ' : 'ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ'} клиента`
        const errorDetails = data.details ? `\n${data.details}` : ''
        setClientError(`${errorMessage}${errorDetails}`)
        toast.error(errorMessage, { description: data.details })
      }
    } catch {
      setClientError('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsCreatingClient(false)
    }
  }



  // Mobile View Helper - Removed duplicates from here



  const handleEditClient = (client: Client) => {
    setClientFormData({
      name: client.name,
      nickName: client.nickName || '',
      phone: client.phone,
      address: client.address,
      calories: client.calories,
      planType: client.planType || 'CLASSIC',
      dailyPrice: client.dailyPrice || 84000,
      notes: client.notes || '',
      specialFeatures: client.specialFeatures || '',
      deliveryDays: client.deliveryDays || {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
      },
      autoOrdersEnabled: client.autoOrdersEnabled,
      isActive: client.isActive,
      defaultCourierId: client.defaultCourierId || '',
      googleMapsLink: client.googleMapsLink || '',
      latitude: client.latitude || null,
      longitude: client.longitude || null,
      assignedSetId: client.assignedSetId || ''
    })
    setEditingClientId(client.id)
    setIsCreateClientModalOpen(true)
  }

  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/clients/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientIds: [clientId], isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(`Клиент ${!currentStatus ? 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð¾Ð²Ð°Ð½' : 'Ð¿Ñ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½'}`)
        fetchData()
      } else {
        toast.error('ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¸Ð·Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ ÑÑ‚Ð°Ñ‚ÑƒÑ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð°')
      }
    } catch (error) {
      console.error('Error toggling client status:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const _handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
        }
      })

      if (response.ok) {
        fetchData()
      } else {
        const data = await response.json()
        console.error('Error deleting client:', data.error)
      }
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleToggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const handlePauseSelectedClients = async ({ skipConfirm = false }: { skipConfirm?: boolean } = {}) => {
    if (selectedClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ Ð¿Ñ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²ÐºÐ¸')
      return
    }

    if (!skipConfirm) {
      setIsPauseClientsDialogOpen(true)
      return
    }

    try {
      setIsMutatingClients(true)
      const response = await fetch('/api/admin/clients/toggle-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          isActive: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð¿Ñ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²: ${data.updatedCount}`)
        setSelectedClients(new Set())
        setIsPauseClientsDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²ÐºÐ¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Error pausing clients:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼. ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð¿Ð¾Ð¿Ñ€Ð¾Ð±ÑƒÐ¹Ñ‚Ðµ ÐµÑ‰Ðµ Ñ€Ð°Ð·.')
    } finally {
      setIsMutatingClients(false)
    }
  }

  const handleResumeSelectedClients = async ({ skipConfirm = false }: { skipConfirm?: boolean } = {}) => {
    if (selectedClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ Ð²Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    if (!skipConfirm) {
      setIsResumeClientsDialogOpen(true)
      return
    }

    try {
      setIsMutatingClients(true)
      const response = await fetch('/api/admin/clients/toggle-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          isActive: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð²Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²: ${data.updatedCount}`)
        setSelectedClients(new Set())
        setIsResumeClientsDialogOpen(false)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð²Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Error resuming clients:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼. ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð¿Ð¾Ð¿Ñ€Ð¾Ð±ÑƒÐ¹Ñ‚Ðµ ÐµÑ‰Ðµ Ñ€Ð°Ð·.')
    } finally {
      setIsMutatingClients(false)
    }
  }

  const handleBulkUpdateOrders = async () => {
    if (selectedOrders.size === 0) return
    setIsUpdatingBulk(true)

    try {
      const updates: any = {}
      if (bulkOrderUpdates.orderStatus) updates.orderStatus = bulkOrderUpdates.orderStatus
      if (bulkOrderUpdates.paymentStatus) updates.paymentStatus = bulkOrderUpdates.paymentStatus
      if (bulkOrderUpdates.courierId) updates.courierId = bulkOrderUpdates.courierId
      if (bulkOrderUpdates.deliveryDate) updates.deliveryDate = bulkOrderUpdates.deliveryDate

      const response = await fetch('/api/admin/orders/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          updates
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`ÐžÐ±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²: ${data.updatedCount}`)
        setIsBulkEditOrdersModalOpen(false)
        setSelectedOrders(new Set())
        setBulkOrderUpdates({
          orderStatus: '',
          paymentStatus: '',
          courierId: '',
          deliveryDate: ''
        })
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²', {
          description: data.details || undefined
        })
      }
    } catch (error) {
      console.error('Error bulk updating orders:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsUpdatingBulk(false)
    }
  }



  const handleBulkUpdateClients = async () => {
    if (selectedClients.size === 0) return
    setIsUpdatingBulk(true)

    try {
      const updates: any = {}
      if (bulkClientUpdates.isActive !== undefined) updates.isActive = bulkClientUpdates.isActive
      if (bulkClientUpdates.calories) updates.calories = bulkClientUpdates.calories

      const response = await fetch('/api/admin/clients/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedClients),
          updates
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`ÐžÐ±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²: ${data.updatedCount}`)
        setIsBulkEditClientsModalOpen(false)
        setSelectedClients(new Set())
        setBulkClientUpdates({
          isActive: undefined,
          calories: ''
        })
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²')
      }
    } catch (error) {
      console.error('Error bulk updating clients:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const handleRestoreSelectedClients = async () => {
    if (selectedBinClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    const selectedClientsList = Array.from(selectedBinClients).map(id =>
      binClients.find(c => c.id === id)?.name || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ð¹ ÐºÐ»Ð¸ÐµÐ½Ñ‚'
    ).join(', ')

    const hasActiveClients = binClients.some(c => selectedBinClients.has(c.id) && c.isActive)
    const confirmMessage = `Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÑÐ»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²:\n\n${selectedClientsList}\n\n${hasActiveClients ? 'ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð±ÑƒÐ´ÑƒÑ‚ ÑÐ¾Ð·Ð´Ð°Ð½Ñ‹ Ð´Ð»Ñ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð².' : ''}`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/admin/clients/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedBinClients)
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾: ${data.restoredClients} ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²`)
        setSelectedBinClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð²Ð¾ÑÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Restore clients error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const _handlePermanentDeleteSelected = async () => {
    if (selectedBinClients.size === 0) {
      toast.error('ÐŸÐ¾Ð¶Ð°Ð»ÑƒÐ¹ÑÑ‚Ð°, Ð²Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð´Ð»Ñ Ð¾ÐºÐ¾Ð½Ñ‡Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ð³Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ')
      return
    }

    const selectedClientsList = Array.from(selectedBinClients).map(id =>
      binClients.find(c => c.id === id)?.name || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ð¹ ÐºÐ»Ð¸ÐµÐ½Ñ‚'
    ).join(', ')

    const confirmMessage = `âš ï¸ Ð’ÐÐ˜ÐœÐÐÐ˜Ð•! Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÐÐÐ’Ð¡Ð•Ð“Ð”Ð ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ÑÐ»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²:\n\n${selectedClientsList}\n\nÐ’ÑÐµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð¸ Ð·Ð°ÐºÐ°Ð·Ñ‹ ÑÑ‚Ð¸Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð² Ð±ÑƒÐ´ÑƒÑ‚ ÑƒÐ´Ð°Ð»ÐµÐ½Ñ‹ Ð±ÐµÐ·Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‚Ð½Ð¾.\n\nÐ­Ñ‚Ð¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ ÐÐ•Ð›Ð¬Ð—Ð¯ Ð¾Ñ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ!`

    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð´Ð¸Ñ‚Ðµ ÐµÑ‰Ðµ Ñ€Ð°Ð·: Ð²Ñ‹ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð½Ð°Ð²ÑÐµÐ³Ð´Ð°?')
    if (!doubleConfirm) {
      return
    }

    try {
      const response = await fetch('/api/admin/clients/permanent-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientIds: Array.from(selectedBinClients)
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾ Ð½Ð°Ð²ÑÐµÐ³Ð´Ð°: ${data.deletedClients} ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²`)
        setSelectedBinClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Permanent delete error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const handleRunAutoOrders = async () => {
    try {
      toast.info('Ð—Ð°Ð¿ÑƒÑÐº ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ñ… Ð·Ð°ÐºÐ°Ð·Ð¾Ð²...')

      const response = await fetch('/api/admin/auto-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetDate: new Date() })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Ð¡Ð¾Ð·Ð´Ð°Ð½Ð¾ ${data.ordersCreated} Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ñ… Ð·Ð°ÐºÐ°Ð·Ð¾Ð²`)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`ÐžÑˆÐ¸Ð±ÐºÐ°: ${data.error || 'ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²'}`)
      }
    } catch (error) {
      console.error('Run auto orders error:', error)
      toast.error('ÐžÑˆÐ¸Ð±ÐºÐ° ÑÐ¾ÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ñ Ñ ÑÐµÑ€Ð²ÐµÑ€Ð¾Ð¼')
    }
  }

  const isOrderInOptimizeScope = (order: Order) => {
    if (optimizeCourierId === 'all') return true
    if (optimizeCourierId === 'unassigned') return !order.courierId
    return order.courierId === optimizeCourierId
  }

  const applyOptimizedOrdering = (orderedIds: string[]) => {
    const idToOrder = new Map(orders.map(order => [order.id, order]))
    const optimizedOrders = orderedIds.map(id => idToOrder.get(id)).filter(Boolean) as Order[]
    let optimizedIndex = 0

    const nextOrders = orders.map(order => {
      if (!isOrderInOptimizeScope(order)) return order
      const next = optimizedOrders[optimizedIndex]
      optimizedIndex += 1
      return next || order
    })

    setOrders(nextOrders)
  }

  const _handleToggleBinClientSelection = (clientId: string) => {
    setSelectedBinClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const handleDeliveryDayChange = (day: string, checked: boolean) => {
    setClientFormData(prev => ({
      ...prev,
      deliveryDays: {
        ...prev.deliveryDays,
        [day]: checked
      }
    }))
  }

  const _handleOpenOrder = (orderId: string) => {
    // Find the order
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setIsOrderDetailsModalOpen(true)
    }
  }

  const _handleOpenRoute = (orderId: string) => {
    // Find the order
    const order = orders.find(o => o.id === orderId)
    if (order) {
      // For now, we'll open Google Maps with the address
      // In a real app, this could integrate with a mapping service
      const encodedAddress = encodeURIComponent(order.deliveryAddress)
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
    }
  }

  const handleGetAdminRoute = (order: Order) => {
    try {
      let destination = order.deliveryAddress

      // Ð•ÑÐ»Ð¸ ÐµÑÑ‚ÑŒ ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ñ‹, Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼ Ð¸Ñ… Ð´Ð»Ñ Ñ‚Ð¾Ñ‡Ð½Ð¾Ð¹ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸
      if (order.latitude && order.longitude) {
        destination = `${order.latitude},${order.longitude}`
      }

      // Ð¡Ð¾Ð·Ð´Ð°ÐµÐ¼ ÑÑÑ‹Ð»ÐºÑƒ Ð´Ð»Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ Ð¾Ñ‚ Ñ‚ÐµÐºÑƒÑ‰ÐµÐ³Ð¾ Ð¼ÐµÑÑ‚Ð¾Ð¿Ð¾Ð»Ð¾Ð¶ÐµÐ½Ð¸Ñ Ðº Ñ‚Ð¾Ñ‡ÐºÐµ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ñ
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destination}&travelmode=driving&dir_action=navigate`

      // ÐžÑ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÐ¼ ÑÑÑ‹Ð»ÐºÑƒ Ð² Ð½Ð¾Ð²Ð¾Ð¹ Ð²ÐºÐ»Ð°Ð´ÐºÐµ
      window.open(navigationUrl, '_blank')
    } catch (error) {
      console.error('Error getting route:', error)
    }
  }

  const DispatchActionIcon = !selectedDate
    ? CalendarDays
    : selectedDayIsActive
      ? Save
      : Play
  const dispatchActionLabel = !selectedDate
    ? profileUiText.dispatchChooseDate
    : selectedDayIsActive
      ? profileUiText.dispatchSave
      : profileUiText.dispatchStart

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="h-2 w-2 rounded-md bg-foreground/60 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-md bg-foreground/40 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-md bg-foreground/20 animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-muted-foreground tracking-wide">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <h1 className="text-base font-semibold tracking-tight hidden md:block">{t.admin.dashboard}</h1>
              <span className="hidden md:block text-xs text-muted-foreground">|</span>
              <span className="text-xs text-muted-foreground hidden md:block">
                {currentDate || ' '}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <div className="hidden md:block">
                <UserGuide guides={[
                  {
                    title: t.admin.createOrder,
                    description: t.admin.manageOrdersDesc,
                    buttonName: "+ " + t.admin.createOrder,
                    icon: <Plus className="w-5 h-5 text-primary" />
                  },
                  {
                    title: t.admin.createClient,
                    description: t.admin.manageClientsDesc,
                    buttonName: "+ " + t.admin.createClient,
                    icon: <User className="w-5 h-5 text-primary" />
                  },
                  {
                    title: t.admin.createAutoOrders,
                    description: t.admin.manageOrdersDesc,
                    buttonName: t.admin.auto,
                    icon: <Route className="w-5 h-5 text-primary" />
                  },
                  {
                    title: t.admin.delete,
                    description: t.admin.bin,
                    buttonName: t.admin.bin,
                    icon: <Trash2 className="w-5 h-5 text-primary" />
                  },
                  {
                    title: t.admin.history,
                    description: t.admin.history,
                    buttonName: t.admin.history,
                    icon: <History className="w-5 h-5 text-primary" />
                  }
                ]} />
              </div>
              <div className="hidden md:block">
                <TrialStatus compact />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={handleLogout} aria-label={t.common.logout}>
                <LogOut className="w-4 h-4" />
              </Button>
              {isMiddleAdminView && (
                <Button asChild variant="ghost" size="icon" className="h-9 w-9 md:hidden" aria-label={profileUiText.database}>
                  <Link href="/middle-admin/database">
                    <Database className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              {isMiddleAdminView && (
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5 text-xs">
                  <Link href="/middle-admin/database">
                    <Database className="w-3.5 h-3.5" />
                    {profileUiText.database}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5 text-xs" onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5" />
                {t.common.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Navigation */}
      <MobileSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        visibleTabs={visibleTabs}
      />

      {/* Mobile Tab Indicator */}
      <MobileTabIndicator activeTab={activeTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mobile-bottom-space">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DesktopTabsNav
            visibleTabs={visibleTabs}
            copy={tabsCopy}
          />

          {!isMiddleAdminView && (
            <>
              {/* Statistics Tab */}
              <TabsContent value="statistics" className="space-y-5 animate-fade-in">
            {/* â”€â”€ Order Status â”€â”€ */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.admin.stats.successful} / {t.admin.stats.failed}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t.admin.stats.successful, value: stats?.successfulOrders || 0, sub: 'Ð”Ð¾ÑÑ‚Ð°Ð²Ð»ÐµÐ½Ð¾', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                  { label: t.admin.stats.failed, value: stats?.failedOrders || 0, sub: 'ÐžÑ‚Ð¼ÐµÐ½ÐµÐ½Ð¾', color: 'text-rose-600', dot: 'bg-rose-500' },
                  { label: t.admin.stats.inDelivery, value: stats?.inDeliveryOrders || 0, sub: 'Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑÑÐµ', color: 'text-blue-600', dot: 'bg-blue-500' },
                  { label: t.admin.stats.pending, value: stats?.pendingOrders || 0, sub: 'Ð’ Ð¾Ñ‡ÐµÑ€ÐµÐ´Ð¸', color: 'text-amber-600', dot: 'bg-amber-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border bg-card p-4 transition-all duration-300 hover:shadow-elegant hover:border-muted-foreground/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block h-2 w-2 rounded-md ${s.dot}`} />
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ Payment Stats â”€â”€ */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.admin.stats.prepaid} / {t.admin.stats.unpaid}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t.admin.stats.prepaid, value: stats?.prepaidOrders || 0, sub: 'ÐžÐ¿Ð»Ð°Ñ‡ÐµÐ½Ð¾', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                  { label: t.admin.stats.unpaid, value: stats?.unpaidOrders || 0, sub: 'ÐŸÑ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸', color: 'text-rose-600', dot: 'bg-rose-500' },
                  { label: t.admin.stats.card, value: stats?.cardOrders || 0, sub: 'ÐžÐ½Ð»Ð°Ð¹Ð½', color: 'text-blue-600', dot: 'bg-blue-500' },
                  { label: t.admin.stats.cash, value: stats?.cashOrders || 0, sub: 'ÐÐ°Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ', color: 'text-teal-600', dot: 'bg-teal-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border bg-card p-4 transition-all duration-300 hover:shadow-elegant hover:border-muted-foreground/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block h-2 w-2 rounded-md ${s.dot}`} />
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ Customer Stats â”€â”€ */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.admin.stats.daily}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t.admin.stats.daily, value: stats?.dailyCustomers || 0, sub: 'ÐšÐ°Ð¶Ð´Ñ‹Ð¹ Ð´ÐµÐ½ÑŒ', color: 'text-violet-600', dot: 'bg-violet-500' },
                  { label: t.admin.stats.evenDay, value: stats?.evenDayCustomers || 0, sub: 'Ð§Ñ‘Ñ‚Ð½Ñ‹Ðµ Ð´Ð½Ð¸', color: 'text-indigo-600', dot: 'bg-indigo-500' },
                  { label: t.admin.stats.oddDay, value: stats?.oddDayCustomers || 0, sub: 'ÐÐµÑ‡Ñ‘Ñ‚Ð½Ñ‹Ðµ Ð´Ð½Ð¸', color: 'text-pink-600', dot: 'bg-pink-500' },
                  { label: t.admin.stats.special, value: stats?.specialPreferenceCustomers || 0, sub: 'Ð¡ Ð¾ÑÐ¾Ð±ÐµÐ½Ð½Ð¾ÑÑ‚ÑÐ¼Ð¸', color: 'text-orange-600', dot: 'bg-orange-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border bg-card p-4 transition-all duration-300 hover:shadow-elegant hover:border-muted-foreground/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block h-2 w-2 rounded-md ${s.dot}`} />
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ Calories â”€â”€ */}
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.admin.stats.lowCal}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: t.admin.stats.lowCal, value: stats?.orders1200 || 0, sub: '1200 ÐºÐºÐ°Ð»', color: 'text-rose-600', dot: 'bg-rose-500' },
                  { label: t.admin.stats.standard, value: stats?.orders1600 || 0, sub: '1600 ÐºÐºÐ°Ð»', color: 'text-orange-600', dot: 'bg-orange-500' },
                  { label: t.admin.stats.medium, value: stats?.orders2000 || 0, sub: '2000 ÐºÐºÐ°Ð»', color: 'text-yellow-600', dot: 'bg-yellow-500' },
                  { label: t.admin.stats.high, value: stats?.orders2500 || 0, sub: '2500 ÐºÐºÐ°Ð»', color: 'text-emerald-600', dot: 'bg-emerald-500' },
                  { label: t.admin.stats.max, value: stats?.orders3000 || 0, sub: '3000 ÐºÐºÐ°Ð»', color: 'text-blue-600', dot: 'bg-blue-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border border-border bg-card p-4 transition-all duration-300 hover:shadow-elegant hover:border-muted-foreground/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block h-2 w-2 rounded-md ${s.dot}`} />
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    </div>
                    <div className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* â”€â”€ Item Count â”€â”€ */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t.admin.stats.single, value: stats?.singleItemOrders || 0, sub: '1 Ð¿Ð¾Ñ€Ñ†Ð¸Ñ', color: 'text-indigo-600', dot: 'bg-indigo-500' },
                { label: t.admin.stats.multi, value: stats?.multiItemOrders || 0, sub: 'Ð”Ð²Ð° Ð¸ Ð±Ð¾Ð»ÐµÐµ Ñ€Ð°Ñ†Ð¸Ð¾Ð½Ð¾Ð²', color: 'text-violet-600', dot: 'bg-violet-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-card p-4 transition-all duration-300 hover:shadow-elegant hover:border-muted-foreground/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block h-2 w-2 rounded-md ${s.dot}`} />
                    <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
              </TabsContent>
            </>
          )}

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold">{t.admin.manageOrders}</CardTitle>
                    <CardDescription>
                      {t.admin.manageOrdersDesc}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Unified action panel */}
                <div className="mb-4 rounded-lg border bg-muted/20 p-3">
                  <div className="grid gap-2 lg:grid-cols-[auto_auto_auto_1fr]">
                    <Button onClick={() => setIsCreateOrderModalOpen(true)} className="h-9 gap-2 px-3">
                      <Plus className="w-4 h-4" />
                      {t.admin.createOrder}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 gap-2 px-3"
                      onClick={() => setIsDeleteOrdersDialogOpen(true)}
                      disabled={selectedOrders.size === 0 || isDeletingOrders}
                    >
                      <Trash2 className="w-4 h-4" />
                      {isDeletingOrders ? t.common.loading : t.admin.delete}
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-9 gap-2 px-3"
                      onClick={() => setIsDispatchOpen(true)}
                      disabled={!selectedDate}
                    >
                      <DispatchActionIcon className="w-4 h-4" />
                      {dispatchActionLabel}
                    </Button>
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      {selectedOrders.size > 0 ? `${selectedOrders.size} selected` : 'No selection'}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border/60 bg-gradient-to-r from-background to-muted/20 p-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" className="h-9 gap-1.5" onClick={() => shiftSelectedDate(-1)}>
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </Button>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="secondary" className="h-9 min-w-[240px] justify-between gap-2 px-3 text-left">
                              <span className="flex min-w-0 items-center gap-2">
                                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                                <span className="truncate text-sm font-medium">{selectedDateLabel}</span>
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {profileUiText.calendar}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate ?? undefined}
                              onSelect={(nextDate) => applySelectedDate(nextDate ?? null)}
                              initialFocus
                            />
                            <div className="flex items-center justify-between border-t px-3 py-2">
                              <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => applySelectedDate(new Date())}>
                                {profileUiText.today}
                              </Button>
                              {selectedDate ? (
                                <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => applySelectedDate(null)}>
                                  {profileUiText.clearDate}
                                </Button>
                              ) : null}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <Button variant="outline" className="h-9 gap-1.5" onClick={() => shiftSelectedDate(1)}>
                          {profileUiText.next}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => shiftSelectedDate(-1)}>
                          {profileUiText.yesterday}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => applySelectedDate(new Date())}>
                          {profileUiText.today}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => shiftSelectedDate(1)}>
                          {profileUiText.tomorrow}
                        </Button>
                        <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="max-w-[210px] truncate">{selectedDateLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters Panel */}
                {
                  false && showFilters && (
                    <div className="mb-6 p-4 border rounded-lg bg-muted">
                      <h3 className="font-medium mb-4">{t.admin.filters}</h3>

                      <div className="space-y-4">
                        {/* Delivery Status */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-slate-700">{t.admin.filterGroups.deliveryStatus}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.pending}
                                onChange={(e) => setFilters({ ...filters, pending: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.pending} (#facc15)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.inDelivery}
                                onChange={(e) => setFilters({ ...filters, inDelivery: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.inDelivery} (#3b82f6)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.successful}
                                onChange={(e) => setFilters({ ...filters, successful: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.delivered} (#22c55e)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.failed}
                                onChange={(e) => setFilters({ ...filters, failed: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.failed} (#ef4444)</span>
                            </label>
                          </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-slate-700">{t.admin.filterGroups.payment}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.paid}
                                onChange={(e) => setFilters({ ...filters, paid: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.paid}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.unpaid}
                                onChange={(e) => setFilters({ ...filters, unpaid: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.unpaid}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.prepaid}
                                onChange={(e) => setFilters({ ...filters, prepaid: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.prepaid} (â­)</span>
                            </label>
                            <div className="hidden md:block"></div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.cash}
                                onChange={(e) => setFilters({ ...filters, cash: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.cash}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.card}
                                onChange={(e) => setFilters({ ...filters, card: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.card}</span>
                            </label>
                          </div>
                        </div>

                        {/* Calorie Groups */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-slate-700">{t.admin.filterGroups.calories}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.calories1200}
                                onChange={(e) => setFilters({ ...filters, calories1200: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">1200</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.calories1600}
                                onChange={(e) => setFilters({ ...filters, calories1600: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">1600</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.calories2000}
                                onChange={(e) => setFilters({ ...filters, calories2000: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">2000</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.calories2500}
                                onChange={(e) => setFilters({ ...filters, calories2500: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">2500</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.calories3000}
                                onChange={(e) => setFilters({ ...filters, calories3000: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">3000</span>
                            </label>
                          </div>
                        </div>

                        {/* Other filters */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-slate-700">{t.admin.filterGroups.other}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.autoOrders}
                                onChange={(e) => setFilters({ ...filters, autoOrders: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.auto}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.manualOrders}
                                onChange={(e) => setFilters({ ...filters, manualOrders: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.manual}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.singleItem}
                                onChange={(e) => setFilters({ ...filters, singleItem: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.singlePortion}</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={filters.multiItem}
                                onChange={(e) => setFilters({ ...filters, multiItem: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm">{t.admin.filterGroups.multiPortion}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                <div className="mb-3 space-y-3">
                  <SectionMetrics items={orderMetrics} columnsClassName="sm:grid-cols-2 xl:grid-cols-4" />
                  <FilterToolbar
                    inputRef={searchInputRef}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder={profileUiText.searchOrdersPlaceholder}
                    searchAriaLabel={profileUiText.searchOrdersAria}
                  >
                    <Badge variant="secondary" className="h-9 rounded-md px-3">
                      {filteredOrders.length} {profileUiText.rows}
                    </Badge>
                    {activeFiltersCount > 0 && (
                      <Badge variant="outline" className="h-9 rounded-md px-3">
                        <Filter className="mr-1 h-3.5 w-3.5" />
                        {activeFiltersCount} {profileUiText.filters}
                      </Badge>
                    )}
                    {searchTerm && (
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm('')} className="h-9 px-3">
                        Clear
                      </Button>
                    )}
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" onClick={clearOrderFilters} className="h-9 px-3">
                        {profileUiText.resetFilters}
                      </Button>
                    )}
                  </FilterToolbar>
                </div>

                {filteredOrders.length === 0 ? (
                  <TabEmptyState
                    title={profileUiText.noOrdersFound}
                    description={profileUiText.noOrdersFoundDescription}
                  />
                ) : (
                  <div className="rounded-md border">
                    <OrdersTable
                      orders={filteredOrders}
                      selectedOrders={selectedOrders}
                      onSelectOrder={handleOrderSelect}
                      onSelectAll={handleSelectAllOrders}
                      onDeleteSelected={() => setIsDeleteOrdersDialogOpen(true)}
                      onViewOrder={(order) => {
                        setSelectedOrder(order)
                        setIsOrderDetailsModalOpen(true)
                      }}
                      onEditOrder={handleEditOrder}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>{t.admin.manageClients}</CardTitle>
                    <CardDescription>
                      {t.admin.manageClientsDesc}
                      {clientStatusFilter !== 'all' && (
                        <span className="ml-2 text-sm">
                          ({profileUiText.showing}: {filteredClients.length} {profileUiText.of} {clients.length})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="grid w-full gap-2 lg:w-auto lg:grid-cols-[190px_auto]">
                    <Select value={clientStatusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setClientStatusFilter(value)}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder={profileUiText.statusFilter} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{profileUiText.allClients}</SelectItem>
                        <SelectItem value="active">{profileUiText.activeOnly}</SelectItem>
                        <SelectItem value="inactive">{profileUiText.pausedOnly}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-9" onClick={() => setActiveTab('bin')}>
                      {profileUiText.bin}
                    </Button>
                  </div>
                </div>
                    <Dialog open={isCreateClientModalOpen} onOpenChange={setIsCreateClientModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          {profileUiText.createClient}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingClientId ? profileUiText.editClient : profileUiText.createClient}</DialogTitle>
                          <DialogDescription>
                            {editingClientId ? profileUiText.updateClientDetails : profileUiText.createClientDescription}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateClient}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientName" className="text-right">
                                {t.common.name}
                              </Label>
                              <Input
                                id="clientName"
                                value={clientFormData.name}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientNickName" className="text-right">
                                {profileUiText.nickname}
                              </Label>
                              <Input
                                id="clientNickName"
                                value={clientFormData.nickName || ''}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, nickName: e.target.value }))}
                                className="col-span-3"
                                placeholder={profileUiText.nicknamePlaceholder}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientPhone" className="text-right">
                                {t.common.phone}
                              </Label>
                              <div className="col-span-3">
                                <Input
                                  id="clientPhone"
                                  type="tel"
                                  placeholder="+998 XX XXX XX XX"
                                  value={clientFormData.phone}
                                  onChange={(e) => setClientFormData(prev => ({ ...prev, phone: e.target.value }))}
                                  required
                                />
                                <p className="text-xs text-muted-foreground mt-1">{profileUiText.phoneFormat}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientAddress" className="text-right">
                                {t.common.address}
                              </Label>
                              <Input
                                id="clientAddress"
                                value={clientFormData.address}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="col-span-3"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="googleMapsLink" className="text-right">
                                {profileUiText.mapLink}
                              </Label>

                              <Input
                                id="googleMapsLink"
                                placeholder="https://maps.google.com/..."
                                value={clientFormData.googleMapsLink || ''}
                                onChange={(e) => handleClientAddressChange(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientPlanType" className="text-right">
                                Plan
                              </Label>
                              <select
                                id="clientPlanType"
                                value={clientFormData.planType}
                                onChange={(e) => {
                                  const val = e.target.value as any
                                  setClientFormData(prev => ({
                                    ...prev,
                                    planType: val,
                                    dailyPrice: getDailyPrice(val, prev.calories)
                                  }))
                                }}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {Object.entries(PLAN_TYPES).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientCalories" className="text-right">
                                Calories
                              </Label>
                              <select
                                id="clientCalories"
                                value={clientFormData.calories}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value)
                                  setClientFormData(prev => ({
                                    ...prev,
                                    calories: val,
                                    dailyPrice: getDailyPrice(prev.planType, val)
                                  }))
                                }}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="1200">1200 kcal</option>
                                <option value="1600">1600 kcal</option>
                                <option value="2000">2000 kcal</option>
                                <option value="2500">2500 kcal</option>
                                <option value="3000">3000 kcal</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientPrice" className="text-right">
                                Price (UZS)
                              </Label>
                              <Input
                                id="clientPrice"
                                type="number"
                                value={clientFormData.dailyPrice}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, dailyPrice: parseInt(e.target.value) }))}
                                className="col-span-3"
                              />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientNotes" className="text-right">
                                Notes
                              </Label>
                              <Input
                                id="clientNotes"
                                value={clientFormData.notes || ''}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="col-span-3"
                                placeholder="Individual preferences..."
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientSpecialFeatures" className="text-right">
                                Special features
                              </Label>
                              <Input
                                id="clientSpecialFeatures"
                                value={clientFormData.specialFeatures}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, specialFeatures: e.target.value }))}
                                className="col-span-3"
                                placeholder="Special requests (optional)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-2">
                              <Label className="text-right pt-2">
                                Delivery days
                              </Label>
                              <div className="col-span-3 space-y-2">
                                <div className="text-xs text-slate-500 mb-2">
                                  Select weekdays for automatic order creation
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="monday"
                                      checked={clientFormData.deliveryDays.monday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('monday', checked === true)}
                                    />
                                    <Label htmlFor="monday" className="text-sm">Monday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="tuesday"
                                      checked={clientFormData.deliveryDays.tuesday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('tuesday', checked === true)}
                                    />
                                    <Label htmlFor="tuesday" className="text-sm">Tuesday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="wednesday"
                                      checked={clientFormData.deliveryDays.wednesday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('wednesday', checked === true)}
                                    />
                                    <Label htmlFor="wednesday" className="text-sm">Wednesday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="thursday"
                                      checked={clientFormData.deliveryDays.thursday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('thursday', checked === true)}
                                    />
                                    <Label htmlFor="thursday" className="text-sm">Thursday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="friday"
                                      checked={clientFormData.deliveryDays.friday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('friday', checked === true)}
                                    />
                                    <Label htmlFor="friday" className="text-sm">Friday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="saturday"
                                      checked={clientFormData.deliveryDays.saturday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('saturday', checked === true)}
                                    />
                                    <Label htmlFor="saturday" className="text-sm">Saturday</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="sunday"
                                      checked={clientFormData.deliveryDays.sunday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('sunday', checked === true)}
                                    />
                                    <Label htmlFor="sunday" className="text-sm">Sunday</Label>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Label htmlFor="defaultCourier" className="text-sm w-full">
                                    Default courier:
                                    <select
                                      id="defaultCourier"
                                      value={clientFormData.defaultCourierId}
                                      onChange={(e) => setClientFormData(prev => ({ ...prev, defaultCourierId: e.target.value }))}
                                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">None</option>
                                      {couriers.map((courier) => (
                                        <option key={courier.id} value={courier.id}>
                                          {courier.name}
                                        </option>
                                      ))}
                                    </select>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Label htmlFor="assignedSet" className="text-sm w-full">
                                    Assigned set (menu):
                                    <select
                                      id="assignedSet"
                                      value={clientFormData.assignedSetId}
                                      onChange={(e) => setClientFormData(prev => ({ ...prev, assignedSetId: e.target.value }))}
                                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">{profileUiText.autoSet}</option>
                                      {availableSets.map((set) => (
                                        <option key={set.id} value={set.id}>
                                          {set.name} {set.isActive ? profileUiText.active : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Checkbox
                                    id="autoOrdersEnabled"
                                    checked={clientFormData.autoOrdersEnabled}
                                    onCheckedChange={(checked) => setClientFormData(prev => ({ ...prev, autoOrdersEnabled: checked === true }))}
                                  />
                                  <Label htmlFor="autoOrdersEnabled" className="text-sm">
                                    {profileUiText.enableAutoOrderCreation}
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          {clientError && (
                            <Alert className="mb-4">
                              <AlertDescription>{clientError}</AlertDescription>
                            </Alert>
                          )}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateClientModalOpen(false)}>
                              {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={isCreatingClient}>
                              {isCreatingClient ? profileUiText.saving : (editingClientId ? t.common.save : t.admin.create)}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-3">
                  <SectionMetrics items={clientMetrics} columnsClassName="sm:grid-cols-2 xl:grid-cols-4" />
                  <FilterToolbar
                    searchValue={clientSearchTerm}
                    onSearchChange={setClientSearchTerm}
                    searchPlaceholder={profileUiText.searchClientPlaceholder}
                    searchAriaLabel={profileUiText.searchClientsAria}
                  >
                    {clientSearchTerm && (
                      <Button variant="outline" size="sm" className="h-9" onClick={() => setClientSearchTerm('')}>
                        {profileUiText.clear}
                      </Button>
                    )}
                    <Badge variant="secondary" className="h-9 rounded-md px-3">
                      {filteredClients.length} clients
                    </Badge>
                  </FilterToolbar>
                </div>

                {/* Client Management Buttons */}
                {selectedClients.size > 0 && (
                  <div className="mb-4 rounded-lg border bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm text-muted-foreground">
                        Selected clients: {selectedClients.size}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            const client = clients.find(c => selectedClients.has(c.id))
                            if (client) handleEditClient(client)
                          }}
                          disabled={selectedClients.size !== 1}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() =>
                            shouldPauseSelectedClients
                              ? setIsPauseClientsDialogOpen(true)
                              : setIsResumeClientsDialogOpen(true)
                          }
                          disabled={selectedClients.size === 0 || isMutatingClients}
                        >
                          {shouldPauseSelectedClients ? (
                            <Pause className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {isMutatingClients
                            ? t.common.loading
                            : shouldPauseSelectedClients
                              ? 'ÐŸÑ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ'
                              : 'Ð’Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-9"
                          onClick={() => setIsDeleteClientsDialogOpen(true)}
                          disabled={selectedClients.size === 0 || isMutatingClients}
                        >
                          {isMutatingClients ? t.common.loading : 'Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Clients Table */}
                {/* Desktop View */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              className="rounded border-border"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClients(new Set(filteredClients.map(c => c.id)))
                                } else {
                                  setSelectedClients(new Set())
                                }
                              }}
                              checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                            />
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nickname</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Calories</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery days</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status / Auto
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Notes
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredClients.map((client) => (
                            <tr key={client.id} className="hover:bg-muted">
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <input
                                  type="checkbox"
                                  className="rounded border-border"
                                  checked={selectedClients.has(client.id)}
                                  onChange={() => handleToggleClientSelection(client.id)}
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                                {client.name}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                                {client.nickName || '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {client.phone}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {client.address}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {client.calories} kcal
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                <div className="text-xs">
                                  {client.deliveryDays?.monday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Mon</span>}
                                  {client.deliveryDays?.tuesday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Tue</span>}
                                  {client.deliveryDays?.wednesday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Wed</span>}
                                  {client.deliveryDays?.thursday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Thu</span>}
                                  {client.deliveryDays?.friday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Fri</span>}
                                  {client.deliveryDays?.saturday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Sat</span>}
                                  {client.deliveryDays?.sunday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Sun</span>}
                                  {(!client.deliveryDays || Object.values(client.deliveryDays).every(day => !day)) && (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <div className="flex flex-col gap-1">
                                  <EntityStatusBadge
                                    isActive={client.isActive}
                                    activeLabel="Active"
                                    inactiveLabel="Paused"
                                    inactiveTone="danger"
                                    showDot
                                    onClick={() => handleToggleClientStatus(client.id, client.isActive)}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {client.specialFeatures || '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {new Date(client.createdAt).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClient(client)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        {filteredClients.length === 0 && (
                          <tr>
                            <td colSpan={11} className="px-4 py-8 text-center">
                              <TabEmptyState
                                title="ÐšÐ»Ð¸ÐµÐ½Ñ‚Ñ‹ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ñ‹"
                                description="Ð˜Ð·Ð¼ÐµÐ½Ð¸Ñ‚Ðµ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ñ‹ Ð¸Ð»Ð¸ Ð¿Ð¾Ð¸ÑÐºÐ¾Ð²Ñ‹Ð¹ Ð·Ð°Ð¿Ñ€Ð¾Ñ."
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {filteredClients.length === 0 && (
                    <TabEmptyState
                      title="ÐšÐ»Ð¸ÐµÐ½Ñ‚Ñ‹ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ñ‹"
                      description="Ð˜Ð·Ð¼ÐµÐ½Ð¸Ñ‚Ðµ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ñ‹ Ð¸Ð»Ð¸ Ð¿Ð¾Ð¸ÑÐºÐ¾Ð²Ñ‹Ð¹ Ð·Ð°Ð¿Ñ€Ð¾Ñ."
                    />
                  )}
                  {filteredClients.map((client) => (
                      <Card key={client.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/30">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedClients.has(client.id)}
                                onCheckedChange={() => handleToggleClientSelection(client.id)}
                              />
                              <div className="flex flex-col">
                                <CardTitle className="text-base">{client.name}</CardTitle>
                                <CardDescription>{client.phone}</CardDescription>
                              </div>
                            </div>
                            <EntityStatusBadge
                              isActive={client.isActive}
                              activeLabel="ÐÐºÑ‚Ð¸Ð²ÐµÐ½"
                              inactiveLabel="ÐŸÑ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½"
                              inactiveTone="danger"
                              showDot
                              onClick={() => handleToggleClientStatus(client.id, client.isActive)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div className="text-sm">{client.address}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">ÐšÐ°Ð»Ð¾Ñ€Ð¸Ð¸:</div>
                            <div className="text-sm">{client.calories} ÐºÐºÐ°Ð»</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div className="font-medium mb-1">Ð”Ð½Ð¸ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸:</div>
                            <div className="flex flex-wrap gap-1">
                              {client.deliveryDays?.monday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">ÐŸÐ½</span>}
                              {client.deliveryDays?.tuesday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ð’Ñ‚</span>}
                              {client.deliveryDays?.wednesday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ð¡Ñ€</span>}
                              {client.deliveryDays?.thursday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ð§Ñ‚</span>}
                              {client.deliveryDays?.friday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">ÐŸÑ‚</span>}
                              {client.deliveryDays?.saturday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ð¡Ð±</span>}
                              {client.deliveryDays?.sunday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ð’Ñ</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent >

          {isDispatchOpen && (
            <DispatchMapPanel
              open={isDispatchOpen}
              onOpenChange={setIsDispatchOpen}
              orders={orders}
              couriers={couriers}
              selectedDateLabel={selectedDate ? selectedDateLabel : profileUiText.allOrders}
              selectedDateISO={selectedDateISO || undefined}
              warehousePoint={warehousePoint}
              onSaved={fetchData}
            />
          )}

          {/* Admins Tab */}
          <AdminsTab lowAdmins={lowAdmins} isLowAdminView={isLowAdminView} onRefresh={fetchData} tabsCopy={tabsCopy} />

          {/* Interface Tab */}

          < TabsContent value="interface" className="space-y-6" >
            <InterfaceSettings />
          </TabsContent >

          {/* History Tab */}
          < TabsContent value="history" className="space-y-6" >
            <HistoryTable role={meRole || 'MIDDLE_ADMIN'} />
          </TabsContent >

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ChangePasswordModal
              isOpen={isChangePasswordOpen}
              onClose={() => setIsChangePasswordOpen(false)}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>{profileUiText.profileCenter}</CardTitle>
                  <CardDescription>{profileUiText.profileCenterDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{profileUiText.role}</p>
                      <p className="mt-1 text-sm font-semibold">{meRole || 'MIDDLE_ADMIN'}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{profileUiText.visibleTabs}</p>
                      <p className="mt-1 text-sm font-semibold">{visibleTabs.length}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{profileUiText.dispatchDate}</p>
                      <p className="mt-1 truncate text-sm font-semibold">{selectedDateLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-sm font-semibold">{profileUiText.security}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{profileUiText.securityDescription}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)} className="gap-2">
                        <User className="h-4 w-4" />
                        {profileUiText.changePassword}
                      </Button>
                      {isMiddleAdminView && (
                        <Button asChild variant="outline" className="gap-2">
                          <Link href="/middle-admin/database">
                            <Database className="h-4 w-4" />
                            {profileUiText.database}
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" onClick={handleLogout} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        {t.common.logout}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-sm font-semibold">{profileUiText.quickNavigation}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>{t.admin.orders}</Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('clients')}>{t.admin.clients}</Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>{t.admin.history}</Button>
                      {visibleTabs.includes('interface') && (
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('interface')}>{t.admin.interface}</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>{profileUiText.warehouseStartPoint}</CardTitle>
                  <CardDescription>{profileUiText.warehouseStartPointDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="warehousePoint">
                      {profileUiText.warehouseInputLabel}
                      {isWarehouseReadOnly && <span className="ml-2 text-xs text-muted-foreground">{profileUiText.readOnly}</span>}
                    </Label>
                    <Input
                      id="warehousePoint"
                      value={warehouseInput}
                      onChange={(event) => handleWarehouseInputChange(event.target.value)}
                      onBlur={() => void handleWarehouseInputBlur()}
                      placeholder={profileUiText.warehousePlaceholder}
                      disabled={isWarehouseReadOnly || isWarehouseLoading || isWarehouseSaving}
                    />
                    <div className="text-xs text-muted-foreground">
                      {warehousePoint
                        ? `${profileUiText.current}: ${warehousePoint.lat.toFixed(6)}, ${warehousePoint.lng.toFixed(6)}`
                        : `${profileUiText.current}: ${profileUiText.notConfigured}`}
                      {warehousePreview && (
                        <span className="ml-2 text-muted-foreground/80">
                          {profileUiText.preview}: {warehousePreview.lat.toFixed(6)}, {warehousePreview.lng.toFixed(6)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void refreshWarehousePoint()}
                      disabled={isWarehouseLoading || isWarehouseSaving}
                    >
                      {profileUiText.refresh}
                    </Button>
                    <Button
                      onClick={() => void handleSaveWarehousePoint()}
                      disabled={isWarehouseReadOnly || isWarehouseSaving || isWarehouseLoading || !warehouseInput.trim()}
                    >
                      {isWarehouseSaving ? profileUiText.saving : profileUiText.saveLocation}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!isLowAdminView && <SiteBuilderCard />}

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>{profileUiText.messages}</CardTitle>
                <CardDescription>{profileUiText.messagesDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bin" className="space-y-4">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList>
                <TabsTrigger value="orders">{t.admin.deletedOrders}</TabsTrigger>
                <TabsTrigger value="clients">{t.admin.deletedClients}</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold tracking-tight">{profileUiText.ordersBin}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleRestoreSelectedOrders}
                      variant="outline"
                      disabled={selectedOrders.size === 0}
                    >
                      <History className="mr-2 h-4 w-4" />
                      {t.admin.restoreSelected} ({selectedOrders.size})
                    </Button>
                    <Button
                      onClick={handlePermanentDeleteOrders}
                      variant="destructive"
                      disabled={selectedOrders.size === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t.admin.deleteSelected} ({selectedOrders.size})
                    </Button>
                    <Button onClick={fetchBinOrders} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {profileUiText.refresh}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <OrdersTable
                    orders={binOrders}
                    selectedOrders={selectedOrders}
                    onSelectOrder={handleOrderSelect}
                    onSelectAll={handleSelectAllBinOrders}
                    onDeleteSelected={handlePermanentDeleteOrders}
                    onViewOrder={(order) => {
                      setSelectedOrder(order)
                      setIsOrderDetailsModalOpen(true)
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="clients" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold tracking-tight">{profileUiText.clientsBin}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleRestoreSelectedClients}
                      variant="outline"
                      disabled={selectedBinClients.size === 0}
                    >
                      <History className="mr-2 h-4 w-4" />
                      {t.admin.restoreSelected} ({selectedBinClients.size})
                    </Button>
                    <Button
                      onClick={handlePermanentDeleteClients}
                      variant="destructive"
                      disabled={selectedBinClients.size === 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t.admin.deleteSelected} ({selectedBinClients.size})
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Checkbox
                              checked={binClients.length > 0 && selectedBinClients.size === binClients.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBinClients(new Set(binClients.map(c => c.id)))
                                } else {
                                  setSelectedBinClients(new Set())
                                }
                              }}
                            />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.admin.table.name}</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.admin.table.phone}</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.admin.table.address}</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.common.date}</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t.admin.table.role}</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {binClients.map((client) => (
                          <tr key={client.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                              <Checkbox
                                checked={selectedBinClients.has(client.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedBinClients)
                                  if (checked) {
                                    newSelected.add(client.id)
                                  } else {
                                    newSelected.delete(client.id)
                                  }
                                  setSelectedBinClients(newSelected)
                                }}
                              />
                            </td>
                            <td className="p-4 align-middle font-medium">{client.name}</td>
                            <td className="p-4 align-middle">{client.phone}</td>
                            <td className="p-4 align-middle">{client.address}</td>
                            <td className="p-4 align-middle">
                              {client.deletedAt ? new Date(client.deletedAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US') : '-'}
                            </td>
                            <td className="p-4 align-middle">{client.deletedBy || '-'}</td>
                          </tr>
                        ))}
                        {binClients.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                              {t.finance.noClients}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </TabsContent>

          {/* Warehouse Tab */}
          <TabsContent value="warehouse" className="space-y-4">
            <WarehouseTab />
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-4">
            <FinanceTab />
          </TabsContent>


        </Tabs>
      </main >
      {/* Bulk edit modals intentionally removed for compact CRM layout */}

      <AlertDialog open={isDeleteOrdersDialogOpen} onOpenChange={setIsDeleteOrdersDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹?</AlertDialogTitle>
            <AlertDialogDescription>
              Ð‘ÑƒÐ´ÐµÑ‚ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾ Ð·Ð°ÐºÐ°Ð·Ð¾Ð²: {selectedOrders.size}. Ð­Ñ‚Ð¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ Ð½ÐµÐ»ÑŒÐ·Ñ Ð¾Ñ‚Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingOrders}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingOrders}
              onClick={() => void handleDeleteSelectedOrders({ skipConfirm: true })}
            >
              {isDeletingOrders ? t.common.loading : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPauseClientsDialogOpen} onOpenChange={setIsPauseClientsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ÐŸÑ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²?</AlertDialogTitle>
            <AlertDialogDescription>
              ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²: {selectedClients.size}. ÐžÐ½Ð¸ Ð½Ðµ Ð±ÑƒÐ´ÑƒÑ‚ Ð¿Ð¾Ð»ÑƒÑ‡Ð°Ñ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutatingClients}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutatingClients}
              onClick={() => void handlePauseSelectedClients({ skipConfirm: true })}
            >
              {isMutatingClients ? t.common.loading : 'ÐŸÑ€Ð¸Ð¾ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResumeClientsDialogOpen} onOpenChange={setIsResumeClientsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ð’Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²?</AlertDialogTitle>
            <AlertDialogDescription>
              ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²: {selectedClients.size}. ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð·Ð°ÐºÐ°Ð·Ñ‹ ÑÐ½Ð¾Ð²Ð° Ð±ÑƒÐ´ÑƒÑ‚ Ð²ÐºÐ»ÑŽÑ‡ÐµÐ½Ñ‹.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutatingClients}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutatingClients}
              onClick={() => void handleResumeSelectedClients({ skipConfirm: true })}
            >
              {isMutatingClients ? t.common.loading : 'Ð’Ð¾Ð·Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteClientsDialogOpen} onOpenChange={setIsDeleteClientsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ñ… ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²?</AlertDialogTitle>
            <AlertDialogDescription>
              Ð‘ÑƒÐ´ÑƒÑ‚ ÑƒÐ´Ð°Ð»ÐµÐ½Ñ‹ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ñ‹: {selectedClients.size}, Ð° Ñ‚Ð°ÐºÐ¶Ðµ ÑÐ²ÑÐ·Ð°Ð½Ð½Ñ‹Ðµ Ð°Ð²Ñ‚Ð¾-Ð·Ð°ÐºÐ°Ð·Ñ‹ Ð·Ð° Ð¿Ð¾ÑÐ»ÐµÐ´Ð½Ð¸Ðµ 30 Ð´Ð½ÐµÐ¹.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutatingClients}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutatingClients}
              onClick={() => void handleDeleteSelectedClients({ skipConfirm: true })}
            >
              {isMutatingClients ? t.common.loading : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Details Modal */}
      < Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen} >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ð”ÐµÑ‚Ð°Ð»Ð¸ Ð·Ð°ÐºÐ°Ð·Ð° #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              ÐŸÐ¾Ð»Ð½Ð°Ñ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¾ Ð·Ð°ÐºÐ°Ð·Ðµ Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ðµ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Ð¡Ñ‚Ð°Ñ‚ÑƒÑ:</span>
                    <Badge
                      className={
                        selectedOrder.orderStatus === 'DELIVERED'
                          ? "bg-green-100 text-green-800"
                          : selectedOrder.orderStatus === 'IN_DELIVERY'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                      }
                    >
                      {selectedOrder.orderStatus === 'DELIVERED'
                        ? "Ð”Ð¾ÑÑ‚Ð°Ð²Ð»ÐµÐ½"
                        : selectedOrder.orderStatus === 'IN_DELIVERY'
                          ? "Ð’ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐµ"
                          : "ÐžÐ¶Ð¸Ð´Ð°ÐµÑ‚"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">ÐžÐ¿Ð»Ð°Ñ‚Ð°:</span>
                    <Badge
                      variant={selectedOrder.paymentStatus === 'PAID' ? "default" : "destructive"}
                      className={selectedOrder.paymentStatus === 'PAID' ? "bg-green-100 text-green-800" : ""}
                    >
                      {selectedOrder.paymentStatus === 'PAID' ? "ÐžÐ¿Ð»Ð°Ñ‡ÐµÐ½" : "ÐÐµ Ð¾Ð¿Ð»Ð°Ñ‡ÐµÐ½"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">ÐœÐµÑ‚Ð¾Ð´:</span>
                    <span className="text-sm">{selectedOrder.paymentMethod === 'CASH' ? 'ÐÐ°Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ' : 'ÐšÐ°Ñ€Ñ‚Ð°'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾:</span>
                    <span className="text-sm font-bold">{selectedOrder.quantity} Ð¿Ð¾Ñ€Ñ†.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">ÐšÐ°Ð»Ð¾Ñ€Ð¸Ð¸:</span>
                    <span className="text-sm">{selectedOrder.calories} ÐºÐºÐ°Ð»</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">ÐžÐ¿ÐµÑ€Ð°Ñ†Ð¸Ð¾Ð½Ð½Ñ‹Ðµ Ð´ÐµÑ‚Ð°Ð»Ð¸</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-slate-500">Priority</span>
                    <span>{selectedOrder.priority ?? 3}</span>
                    <span className="text-slate-500">ETA</span>
                    <span>{selectedOrder.etaMinutes ? `${selectedOrder.etaMinutes} Ð¼Ð¸Ð½` : '-'}</span>
                    <span className="text-slate-500">ÐŸÐ¾ÑÐ»ÐµÐ´Ð½ÐµÐµ Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ðµ</span>
                    <span>
                      {selectedOrder.statusChangedAt
                        ? new Date(selectedOrder.statusChangedAt).toLocaleString('ru-RU')
                        : '-'}
                    </span>
                    <span className="text-slate-500">ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½ ÐºÑƒÑ€ÑŒÐµÑ€</span>
                    <span>{selectedOrder.assignedAt ? new Date(selectedOrder.assignedAt).toLocaleString('ru-RU') : '-'}</span>
                    <span className="text-slate-500">Ð¡Ñ‚Ð°Ñ€Ñ‚ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¸</span>
                    <span>{selectedOrder.pickedUpAt ? new Date(selectedOrder.pickedUpAt).toLocaleString('ru-RU') : '-'}</span>
                    <span className="text-slate-500">ÐŸÐ°ÑƒÐ·Ð°</span>
                    <span>{selectedOrder.pausedAt ? new Date(selectedOrder.pausedAt).toLocaleString('ru-RU') : '-'}</span>
                    <span className="text-slate-500">Ð—Ð°Ð²ÐµÑ€ÑˆÐµÐ½</span>
                    <span>{selectedOrder.deliveredAt ? new Date(selectedOrder.deliveredAt).toLocaleString('ru-RU') : '-'}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">ÐšÐ»Ð¸ÐµÐ½Ñ‚</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedOrder.customerName || selectedOrder.customer?.name}</p>
                      <p className="text-xs text-slate-500">{selectedOrder.customer?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Ð”Ð¾ÑÑ‚Ð°Ð²ÐºÐ°</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                      <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-sm">{selectedOrder.deliveryTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <p className="text-sm">
                        {selectedOrder.deliveryDate && new Date(selectedOrder.deliveryDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Timeline</h4>
                  {isOrderTimelineLoading ? (
                    <p className="text-xs text-muted-foreground">Loading timeline...</p>
                  ) : selectedOrderTimeline.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No events yet</p>
                  ) : (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded border bg-muted/20 p-2">
                      {selectedOrderTimeline.map((event) => (
                        <div key={event.id} className="grid grid-cols-[140px_1fr] gap-2 text-xs">
                          <span className="text-muted-foreground">
                            {new Date(event.occurredAt).toLocaleString('ru-RU')}
                          </span>
                          <span>
                            <span className="font-medium">{event.actorName || 'System'}</span>
                            {' - '}
                            {event.message || event.eventType}
                            {event.previousStatus || event.nextStatus
                              ? ` (${event.previousStatus || '-'} â†’ ${event.nextStatus || '-'})`
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedOrder.specialFeatures && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">ÐžÑÐ¾Ð±ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸</h4>
                    <p className="text-sm bg-orange-50 p-2 rounded border border-orange-100 text-orange-800">
                      {selectedOrder.specialFeatures}
                    </p>
                  </div>
                )}

                {selectedOrder.courierName && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">ÐšÑƒÑ€ÑŒÐµÑ€</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-sm">{selectedOrder.courierName}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDetailsModalOpen(false)}>
              Ð—Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ
            </Button>
            {selectedOrder && (
              <Button onClick={() => {
                setIsOrderDetailsModalOpen(false)
                handleEditOrder(selectedOrder)
              }}>
                Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Create Order Modal */}
      <OrderModal
        open={isCreateOrderModalOpen}
        onOpenChange={setIsCreateOrderModalOpen}
        editingOrderId={editingOrderId}
        setEditingOrderId={setEditingOrderId}
        orderFormData={orderFormData}
        setOrderFormData={setOrderFormData}
        clients={clients}
        couriers={couriers}
        availableSets={availableSets}
        orderError={orderError}
        isCreatingOrder={isCreatingOrder}
        onSubmit={handleCreateOrder}
        onClientSelect={handleClientSelect}
        onAddressChange={handleAddressChange}
      />

      {/* Create Courier Modal */}
      < Dialog open={isCreateCourierModalOpen} onOpenChange={setIsCreateCourierModalOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ ÐšÑƒÑ€ÑŒÐµÑ€Ð°</DialogTitle>
            <DialogDescription>
              Ð¡Ð¾Ð·Ð´Ð°Ð¹Ñ‚Ðµ Ð½Ð¾Ð²Ñ‹Ð¹ Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚ Ð´Ð»Ñ ÐºÑƒÑ€ÑŒÐµÑ€Ð°
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourier}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="courierName" className="text-right">
                  Ð˜Ð¼Ñ
                </Label>
                <Input
                  id="courierName"
                  value={courierFormData.name}
                  onChange={(e) => setCourierFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="courierEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="courierEmail"
                  type="email"
                  value={courierFormData.email}
                  onChange={(e) => setCourierFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="courierPassword" className="text-right">
                  ÐŸÐ°Ñ€Ð¾Ð»ÑŒ
                </Label>
                <Input
                  id="courierPassword"
                  type="password"
                  value={courierFormData.password}
                  onChange={(e) => setCourierFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            {courierError && (
              <Alert className="mb-4">
                <AlertDescription>{courierError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateCourierModalOpen(false)}>
                ÐžÑ‚Ð¼ÐµÐ½Ð°
              </Button>
              <Button type="submit" disabled={isCreatingCourier}>
                {isCreatingCourier ? 'Ð¡Ð¾Ð·Ð´Ð°Ð½Ð¸Ðµ...' : 'Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default AdminDashboardPage





