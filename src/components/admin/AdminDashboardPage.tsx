'use client'

import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
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
  Plus,
  Trash2,
  Pause,
  Play,
  Filter,
  ChevronLeft,
  ChevronRight,
  Route,
  CalendarDays,
  MapPin,
  ArrowUpDown,
  Edit,
  Clock,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserGuide } from '@/components/UserGuide'
import { TrialStatus } from '@/components/admin/TrialStatus'
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal'
import { getDailyPrice, PLAN_TYPES } from '@/lib/menuData'
import { deriveVisibleTabs } from '@/components/admin/dashboard/tabs'
import type { Client, Order } from '@/components/admin/dashboard/types'
import { DesktopTabsNav } from '@/components/admin/dashboard/DesktopTabsNav'
import { useDashboardData } from '@/components/admin/dashboard/useDashboardData'
import { AdminsTab } from '@/components/admin/dashboard/tabs-content/AdminsTab'
import { OrderModal } from '@/components/admin/dashboard/modals/OrderModal'
import { DispatchMapPanel } from '@/components/admin/orders/DispatchMapPanel'
import { extractCoordsFromText, isShortGoogleMapsUrl, type LatLng } from '@/lib/geo'

import { MobileSidebar } from '@/components/MobileSidebar'
import { MobileTabIndicator } from '@/components/MobileTabIndicator'

const OrdersTable = dynamic(
  () => import('@/components/admin/OrdersTable').then((mod) => mod.OrdersTable),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const HistoryTable = dynamic(
  () => import('@/components/admin/HistoryTable').then((mod) => mod.HistoryTable),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const InterfaceSettings = dynamic(
  () => import('@/components/admin/InterfaceSettings').then((mod) => mod.InterfaceSettings),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const ChatTab = dynamic(
  () => import('@/components/chat/ChatTab').then((mod) => mod.ChatTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const TodaysMenu = dynamic(
  () => import('@/components/admin/TodaysMenu').then((mod) => mod.TodaysMenu),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const WarehouseTab = dynamic(
  () => import('@/components/admin/WarehouseTab').then((mod) => mod.WarehouseTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const FinanceTab = dynamic(
  () => import('@/components/admin/FinanceTab').then((mod) => mod.FinanceTab),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
const RouteOptimizeButton = dynamic(
  () => import('@/components/admin/RouteOptimizeButton').then((mod) => mod.RouteOptimizeButton),
  { ssr: false, loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div> }
)
export type AdminDashboardMode = 'middle' | 'low'

export function AdminDashboardPage({ mode }: { mode: AdminDashboardMode }) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('statistics')
  const [currentDate, setCurrentDate] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showFilters, setShowFilters] = useState(false)
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
  const [filters, setFilters] = useState({
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
    manualOrders: false
  })
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

  const visibleTabs = useMemo(() => deriveVisibleTabs(allowedTabs), [allowedTabs])
  const isLowAdminView = mode === 'low' || meRole === 'LOW_ADMIN'
  const isWarehouseReadOnly = isLowAdminView

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add effect to reset selected clients when filter changes
  useEffect(() => {
    setSelectedClients(new Set())
  }, [clientStatusFilter])

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
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id)))
    }
  }

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Пожалуйста, выберите заказы для удаления')
      return
    }

    const confirmMessage = `Вы уверены, что хотите удалить ${selectedOrders.size} заказ(ов)?`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/admin/orders/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Успешно удалено ${data.deletedCount} заказ(ов)`)
        setSelectedOrders(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка удаления заказов'}`)
      }
    } catch (error) {
      console.error('Delete orders error:', error)
      toast.error('Ошибка соединения с сервером')
    }
  }

  const handlePermanentDeleteOrders = async () => {
    if (isLowAdminView) {
      toast.error('Not allowed')
      return
    }
    if (selectedOrders.size === 0) {
      toast.error('Пожалуйста, выберите заказы для удаления')
      return
    }

    const confirmMessage = `⚠️ ВНИМАНИЕ! Вы уверены, что хотите НАВСЕГДА удалить ${selectedOrders.size} заказ(ов)?\n\nЭто действие НЕЛЬЗЯ отменить!`
    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('Подтвердите еще раз: вы действительно хотите удалить эти заказы навсегда?')
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
        toast.success(`Успешно удалено навсегда ${data.deletedCount} заказ(ов)`)
        setSelectedOrders(new Set())
        fetchBinOrders()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка удаления заказов'}`)
      }
    } catch (error) {
      console.error('Permanent delete orders error:', error)
      toast.error('Ошибка соединения с сервером')
    }
  }

  const handleRestoreSelectedOrders = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Пожалуйста, выберите заказы для восстановления')
      return
    }

    if (!confirm(`Вы уверены, что хотите восстановить ${selectedOrders.size} заказ(ов)?`)) {
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
        toast.success(data.message || `Успешно восстановлено ${data.updatedCount} заказ(ов)`)
        setSelectedOrders(new Set())
        fetchBinOrders()
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка восстановления заказов'}`)
      }
    } catch (error) {
      console.error('Restore orders error:', error)
      toast.error('Ошибка соединения с сервером')
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
      toast.error('Пожалуйста, выберите клиентов для удаления')
      return
    }

    const confirmMessage = `⚠️ ВНИМАНИЕ! Вы уверены, что хотите НАВСЕГДА удалить ${selectedBinClients.size} клиент(ов)?\n\nВместе с клиентами будут удалены ВСЕ их заказы и история.\n\nЭто действие НЕЛЬЗЯ отменить!`
    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('Подтвердите еще раз: вы действительно хотите удалить этих клиентов навсегда?')
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
        toast.success(data.message || `Успешно удалено навсегда ${data.deletedClients} клиент(ов)`)
        setSelectedBinClients(new Set())
        fetchBinClients()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка удаления клиентов'}`)
      }
    } catch (error) {
      console.error('Permanent delete clients error:', error)
      toast.error('Ошибка соединения с сервером')
    }
  }

  const parseGoogleMapsUrl = async (url: string): Promise<string | null> => {
    if (!url) return null

    let finalUrl = url

    // Handle short links
    if (isShortGoogleMapsUrl(url)) {
      try {
        const response = await fetch(`/api/admin/expand-url?url=${encodeURIComponent(url)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.expandedUrl) {
            finalUrl = data.expandedUrl
          }
        }
      } catch (error) {
        console.error('Error expanding URL:', error)
      }
    }

    try {
      const coords = extractCoordsFromText(finalUrl) ?? extractCoordsFromText(url)
      if (!coords) return null
      return `${coords.lat}, ${coords.lng}`
    } catch (error) {
      console.error('Error parsing Google Maps URL:', error)
      return null
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
      const response = await fetch(`/api/admin/expand-url?url=${encodeURIComponent(warehouseInput)}`)
      if (!response.ok) return
      const data = await response.json().catch(() => null)
      const expanded = data && typeof data.expandedUrl === 'string' ? data.expandedUrl : null
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
      toast.error('Укажите ссылку Google Maps или координаты')
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
        throw new Error((data && data.error) || 'Ошибка сохранения склада')
      }

      const lat = data && typeof data.lat === 'number' ? data.lat : null
      const lng = data && typeof data.lng === 'number' ? data.lng : null
      const point = lat != null && lng != null ? ({ lat, lng } as LatLng) : null
      setWarehousePoint(point)
      setWarehousePreview(point)
      setWarehouseInput(point ? `${lat},${lng}` : '')

      toast.success('Склад сохранён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения склада')
    } finally {
      setIsWarehouseSaving(false)
    }
  }

  const handleAddressChange = async (value: string) => {
    setOrderFormData(prev => ({ ...prev, deliveryAddress: value }))

    // Парсим координаты в реальном времени
    const parsed = await parseGoogleMapsUrl(value)
    if (parsed && parsed.includes(',')) {
      const coords = parsed.split(',')
      const lat = parseFloat(coords[0].trim())
      const lng = parseFloat(coords[1].trim())

      if (!isNaN(lat) && !isNaN(lng)) {
        setParsedCoords({ lat, lng })
      } else {
        setParsedCoords(null)
      }
    } else {
      setParsedCoords(null)
    }
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
    if (parsed && parsed.includes(',')) {
      const coords = parsed.split(',')
      const lat = parseFloat(coords[0].trim())
      const lng = parseFloat(coords[1].trim())

      if (!isNaN(lat) && !isNaN(lng)) {
        setClientFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }))
      }
    } else {
      // Optional: Clear coordinates if link is invalid? 
      // Or keep previous valid ones? 
      // Let's clear them to avoid confusion if the user thinks they changed the link but the coords remained old.
      setClientFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null
      }))
    }
  }



  const handleDeleteSelectedClients = async () => {
    if (selectedClients.size === 0) {
      toast.error('Пожалуйста, выберите клиентов для удаления')
      return
    }

    const selectedClientsList = Array.from(selectedClients).map(id =>
      clients.find(c => c.id === id)?.name || 'Неизвестный клиент'
    ).join(', ')

    const confirmMessage = `Вы уверены, что хотите удалить следующих клиентов:\n\n${selectedClientsList}\n\nВсе автоматически созданные заказы этих клиентов за последние 30 дней также будут удалены.\n\nЭто действие нельзя отменить.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
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
        toast.success(`Успешно удалено:\n- ${data.deletedClients} клиент(ов)\n- ${data.deletedOrders} заказ(ов)`)
        setSelectedClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка удаления клиентов'}`)
      }
    } catch (error) {
      console.error('Delete clients error:', error)
      toast.error('Ошибка соединения с сервером')
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

        // Также парсим координаты из адреса клиента
        parseGoogleMapsUrl(selectedClient.address).then(parsed => {
          if (parsed && parsed.includes(',')) {
            const coords = parsed.split(',')
            const lat = parseFloat(coords[0].trim())
            const lng = parseFloat(coords[1].trim())

            if (!isNaN(lat) && !isNaN(lng)) {
              setParsedCoords({ lat, lng })
            } else {
              setParsedCoords(null)
            }
          } else {
            setParsedCoords(null)
          }
        })
      }
    } else {
      // Если клиент не выбран или выбран ручной ввод, очищаем поля но оставляем значения по умолчанию
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
      // Parse address to extract coordinates from Google Maps link
      const parsedCoordinates = await parseGoogleMapsUrl(orderFormData.deliveryAddress)

      // Extract coordinates if present
      let latitude: number | null = null
      let longitude: number | null = null

      if (parsedCoordinates && parsedCoordinates.includes(',')) {
        const coords = parsedCoordinates.split(',')
        const lat = parseFloat(coords[0].trim())
        const lng = parseFloat(coords[1].trim())

        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat
          longitude = lng
        }
      }

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
        setOrderError(data.error || 'Ошибка сохранения заказа')
      }
    } catch {
      setOrderError('Ошибка соединения с сервером')
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
        toast.success('Курьер успешно создан')
      } else {
        setCourierError(data.error || 'Ошибка создания курьера')
      }
    } catch {
      setCourierError('Ошибка соединения с сервером')
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
        const action = editingClientId ? 'обновлен' : 'создан'
        const message = `Клиент "${data.client?.name || clientFormData.name}" успешно ${action}!`
        let description = ''
        if (!editingClientId && data.autoOrdersCreated && data.autoOrdersCreated > 0) {
          description = `Автоматически создано заказов: ${data.autoOrdersCreated} (на следующие 30 дней)`
        }

        toast.success(message, { description })
        fetchData()
      } else {
        const errorMessage = data.error || `Ошибка ${editingClientId ? 'обновления' : 'создания'} клиента`
        const errorDetails = data.details ? `\n${data.details}` : ''
        setClientError(`${errorMessage}${errorDetails}`)
        toast.error(errorMessage, { description: data.details })
      }
    } catch {
      setClientError('Ошибка соединения с сервером')
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
        toast.success(`Клиент ${!currentStatus ? 'активирован' : 'приостановлен'}`)
        fetchData()
      } else {
        toast.error('Не удалось изменить статус клиента')
      }
    } catch (error) {
      console.error('Error toggling client status:', error)
      toast.error('Ошибка соединения с сервером')
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

  const handlePauseSelectedClients = async () => {
    if (selectedClients.size === 0) {
      toast.error('Пожалуйста, выберите клиентов для приостановки')
      return
    }

    const selectedClientsList = Array.from(selectedClients).map(id =>
      clients.find(c => c.id === id)?.name || 'Неизвестный клиент'
    ).join(', ')

    const confirmMessage = `Вы уверены, что хотите приостановить следующих клиентов:\n\n${selectedClientsList}\n\nПриостановленные клиенты не будут получать автоматические заказы.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
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
        toast.success(`Успешно приостановлено клиентов: ${data.updatedCount}`)
        setSelectedClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка приостановки клиентов'}`)
      }
    } catch (error) {
      console.error('Error pausing clients:', error)
      toast.error('Ошибка соединения с сервером. Пожалуйста, попробуйте еще раз.')
    }
  }

  const handleResumeSelectedClients = async () => {
    if (selectedClients.size === 0) {
      toast.error('Пожалуйста, выберите клиентов для возобновления')
      return
    }

    const selectedClientsList = Array.from(selectedClients).map(id =>
      clients.find(c => c.id === id)?.name || 'Неизвестный клиент'
    ).join(', ')

    const confirmMessage = `Вы уверены, что хотите возобновить следующих клиентов:\n\n${selectedClientsList}\n\nВозобновленные клиенты снова начнут получать автоматические заказы.`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
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
        toast.success(`Успешно возобновлено клиентов: ${data.updatedCount}`)
        setSelectedClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка возобновления клиентов'}`)
      }
    } catch (error) {
      console.error('Error resuming clients:', error)
      toast.error('Ошибка соединения с сервером. Пожалуйста, попробуйте еще раз.')
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
        toast.success(`Обновлено заказов: ${data.updatedCount}`)
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
        toast.error(data.error || 'Ошибка обновления заказов', {
          description: data.details || undefined
        })
      }
    } catch (error) {
      console.error('Error bulk updating orders:', error)
      toast.error('Ошибка соединения с сервером')
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
        toast.success(`Обновлено клиентов: ${data.updatedCount}`)
        setIsBulkEditClientsModalOpen(false)
        setSelectedClients(new Set())
        setBulkClientUpdates({
          isActive: undefined,
          calories: ''
        })
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Ошибка обновления клиентов')
      }
    } catch (error) {
      console.error('Error bulk updating clients:', error)
      toast.error('Ошибка соединения с сервером')
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const handleRestoreSelectedClients = async () => {
    if (selectedBinClients.size === 0) {
      toast.error('Пожалуйста, выберите клиентов для восстановления')
      return
    }

    const selectedClientsList = Array.from(selectedBinClients).map(id =>
      binClients.find(c => c.id === id)?.name || 'Неизвестный клиент'
    ).join(', ')

    const hasActiveClients = binClients.some(c => selectedBinClients.has(c.id) && c.isActive)
    const confirmMessage = `Вы уверены, что хотите восстановить следующих клиентов:\n\n${selectedClientsList}\n\n${hasActiveClients ? 'Автоматические заказы будут созданы для активных клиентов.' : ''}`

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
        toast.success(data.message || `Успешно восстановлено: ${data.restoredClients} клиентов`)
        setSelectedBinClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка восстановления клиентов'}`)
      }
    } catch (error) {
      console.error('Restore clients error:', error)
      toast.error('Ошибка соединения с сервером')
    }
  }

  const _handlePermanentDeleteSelected = async () => {
    if (selectedBinClients.size === 0) {
      toast.error('Пожалуйста, выберите клиентов для окончательного удаления')
      return
    }

    const selectedClientsList = Array.from(selectedBinClients).map(id =>
      binClients.find(c => c.id === id)?.name || 'Неизвестный клиент'
    ).join(', ')

    const confirmMessage = `⚠️ ВНИМАНИЕ! Вы уверены, что хотите НАВСЕГДА удалить следующих клиентов:\n\n${selectedClientsList}\n\nВсе данные и заказы этих клиентов будут удалены безвозвратно.\n\nЭто действие НЕЛЬЗЯ отменить!`

    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = confirm('Подтвердите еще раз: вы действительно хотите удалить навсегда?')
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
        toast.success(data.message || `Успешно удалено навсегда: ${data.deletedClients} клиентов`)
        setSelectedBinClients(new Set())
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка удаления клиентов'}`)
      }
    } catch (error) {
      console.error('Permanent delete error:', error)
      toast.error('Ошибка соединения с сервером')
    }
  }

  const handleRunAutoOrders = async () => {
    try {
      toast.info('Запуск создания автоматических заказов...')

      const response = await fetch('/api/admin/auto-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetDate: new Date() })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Создано ${data.ordersCreated} автоматических заказов`)
        fetchData()
      } else {
        const data = await response.json()
        toast.error(`Ошибка: ${data.error || 'Ошибка создания заказов'}`)
      }
    } catch (error) {
      console.error('Run auto orders error:', error)
      toast.error('Ошибка соединения с сервером')
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

      // Если есть координаты, используем их для точной навигации
      if (order.latitude && order.longitude) {
        destination = `${order.latitude},${order.longitude}`
      }

      // Создаем ссылку для навигации от текущего местоположения к точке назначения
      const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=${destination}&travelmode=driving&dir_action=navigate`

      // Открываем ссылку в новой вкладке
      window.open(navigationUrl, '_blank')
    } catch (error) {
      console.error('Error getting route:', error)
    }
  }

  const getDateRange = () => {
    const dates: Date[] = []
    const today = selectedDate || new Date()

    for (let i = -4; i <= 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500'
      case 'IN_DELIVERY': return 'bg-yellow-500'
      case 'FAILED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Доставлен'
      case 'IN_DELIVERY': return 'В доставке'
      case 'FAILED': return 'Не доставлен'
      default: return 'Ожидает'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900 hidden md:block">{t.admin.dashboard}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                {currentDate || ' '}
              </div>
              <LanguageSwitcher />
              <div className="hidden md:block">
                <UserGuide guides={[
                  {
                    title: t.admin.createOrder,
                    description: t.admin.manageOrdersDesc, // Using generic desc as placeholder or need specific key
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
              <Button variant="outline" size="icon" className="md:hidden" onClick={handleLogout} aria-label={t.common.logout}>
                <LogOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
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

      {/* Mobile Tab Indicator - shows current tab on mobile */}
      <MobileTabIndicator activeTab={activeTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 mobile-bottom-space md:pt-8 pt-4">
        <div className="hidden md:flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            {t.admin.dashboard}
          </h1>
          <p className="text-muted-foreground">
            {t.admin.dashboardSubtitle}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DesktopTabsNav
            visibleTabs={visibleTabs}
            copy={tabsCopy}
          />

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            {/* Order Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.successful}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {stats?.successfulOrders || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">Доставлено</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.failed}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-red-600">
                    {stats?.failedOrders || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">Отменено</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.inDelivery}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    {stats?.inDeliveryOrders || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">В процессе</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.pending}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">
                    {stats?.pendingOrders || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">В очереди</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.prepaid}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.prepaidOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">Оплачено</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.unpaid}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.unpaidOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">Оплата при получении</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.card}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.cardOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">Онлайн оплата</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.cash}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.cashOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">При получении</p>
                </CardContent>
              </Card>
            </div>

            {/* Customer Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.daily}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.dailyCustomers || 0}
                  </div>
                  <p className="text-xs text-slate-500">Каждый день</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.evenDay}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats?.evenDayCustomers || 0}
                  </div>
                  <p className="text-xs text-slate-500">По четным дням</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.oddDay}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-600">
                    {stats?.oddDayCustomers || 0}
                  </div>
                  <p className="text-xs text-slate-500">По нечетным дням</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.special}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.specialPreferenceCustomers || 0}
                  </div>
                  <p className="text-xs text-slate-500">С особенностями</p>
                </CardContent>
              </Card>
            </div>

            {/* Calories Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.lowCal}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-red-600">
                    {stats?.orders1200 || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">1200 ккал</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.standard}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">
                    {stats?.orders1600 || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">1600 ккал</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.medium}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-yellow-600">
                    {stats?.orders2000 || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">2000 ккал</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.high}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {stats?.orders2500 || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">2500 ккал</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-sm col-span-2 md:col-span-1">
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
                  <CardTitle className="text-sm md:text-base font-medium text-muted-foreground">{t.admin.stats.max}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    {stats?.orders3000 || 0}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-500">3000 ккал</p>
                </CardContent>
              </Card>
            </div>

            {/* Item Count Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.single}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats?.singleItemOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">1 порция</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.admin.stats.multi}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.multiItemOrders || 0}
                  </div>
                  <p className="text-xs text-slate-500">Два и более рационов</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="glass-card border-none">
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
                {/* Mobile Actions - Compact */}
                <div className="md:hidden flex flex-col gap-3 mb-4">
                  <Button onClick={() => setIsCreateOrderModalOpen(true)} className="w-full h-12 text-base font-semibold shadow-md">
                    <Plus className="w-5 h-5 mr-2" />
                    Создать заказ
                  </Button>
                  <Select value={optimizeCourierId} onValueChange={setOptimizeCourierId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Все курьеры" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все курьеры</SelectItem>
                      <SelectItem value="unassigned">Без курьера</SelectItem>
                      {couriers.map((courier) => (
                        <SelectItem key={courier.id} value={courier.id}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-12 w-full"
                    onClick={() => {
                      if (!selectedDate) {
                        toast.error('Выберите дату')
                        return
                      }
                      setIsDispatchOpen(true)
                    }}
                  >
                    <ArrowUpDown className="w-5 h-5 mr-2" />
                    Сортировать
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <RouteOptimizeButton
                      orders={orders.filter(isOrderInOptimizeScope)}
                      onOptimized={applyOptimizedOrdering}
                      startPoint={warehousePoint ?? undefined}
                      variant="outline"
                    />
                    <Button variant="outline" className="h-12 w-full" onClick={() => setIsBulkEditOrdersModalOpen(true)} disabled={selectedOrders.size === 0}>
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" className="h-12 w-full border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900" onClick={handleDeleteSelectedOrders} disabled={selectedOrders.size === 0}>
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex flex-wrap items-center gap-2">
                  <Button onClick={() => setIsCreateOrderModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать заказ
                  </Button>
                  <Select value={optimizeCourierId} onValueChange={setOptimizeCourierId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Все курьеры" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все курьеры</SelectItem>
                      <SelectItem value="unassigned">Без курьера</SelectItem>
                      {couriers.map((courier) => (
                        <SelectItem key={courier.id} value={courier.id}>
                          {courier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selectedDate) {
                        toast.error('Выберите дату')
                        return
                      }
                      setIsDispatchOpen(true)
                    }}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Сортировать
                  </Button>
                  <RouteOptimizeButton
                    orders={orders.filter(isOrderInOptimizeScope)}
                    onOptimized={applyOptimizedOrdering}
                    startPoint={warehousePoint ?? undefined}
                    variant="outline"
                    size="sm"
                  />
                  <Button variant="outline" size="sm" onClick={() => setIsBulkEditOrdersModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Редактировать ({selectedOrders.size})
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeleteSelectedOrders}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить выбранные ({selectedOrders.size})
                  </Button>
                </div>
                {/* Date Selector */}
                <div className="flex items-center justify-center mb-6 space-x-2 overflow-x-auto py-2 mobile-scroll-container">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    className={!selectedDate ? "bg-primary text-primary-foreground" : ""}
                  >
                    Все заказы
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex space-x-1">
                    {getDateRange().map((date, index) => (
                      <Button
                        key={index}
                        variant={selectedDate && date.toDateString() === selectedDate.toDateString() ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => setSelectedDate(date)}
                      >
                        {date.getDate()}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(prev => !prev)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {t.admin.filters}
                  </Button>
                </div>

                {/* Selected Date Indicator */}
                {
                  selectedDate && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 text-center">
                        📅 Показаны заказы за {selectedDate.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )
                }

                {/* Filters Panel */}
                {
                  showFilters && (
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
                              <span className="text-sm">{t.admin.filterGroups.prepaid} (⭐)</span>
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


                {/* Today's Menu Display */}
                <TodaysMenu className="mb-6" />

                {/* Order Search */}
                <div className="mb-4 relative">
                  <Input
                    placeholder="Поиск по имени, адресу или номеру заказа..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Filter className="w-5 h-5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Orders Table */}
                <div className="rounded-md border">
                  <OrdersTable
                    orders={orders.filter(order => {
                      const searchLower = searchTerm.toLowerCase()
                      return (
                        order.customer?.name.toLowerCase().includes(searchLower) ||
                        order.customerName?.toLowerCase().includes(searchLower) ||
                        order.deliveryAddress.toLowerCase().includes(searchLower) ||
                        order.orderNumber.toString().includes(searchLower)
                      )
                    })}
                    selectedOrders={selectedOrders}
                    onSelectOrder={handleOrderSelect}
                    onSelectAll={handleSelectAllOrders}
                    onDeleteSelected={handleDeleteSelectedOrders}
                    onViewOrder={(order) => {
                      setSelectedOrder(order)
                      setIsOrderDetailsModalOpen(true)
                    }}
                    onEditOrder={handleEditOrder}
                  />
                </div>

                {/* Table Actions */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t.admin.manageClients}</CardTitle>
                    <CardDescription>
                      {t.admin.manageClientsDesc}
                      {clientStatusFilter !== 'all' && (
                        <span className="ml-2 text-sm">
                          (Показано: {clients.filter(client => {
                            if (clientStatusFilter === 'active') return client.isActive
                            if (clientStatusFilter === 'inactive') return !client.isActive
                            return true
                          }).length} из {clients.length})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={clientStatusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setClientStatusFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Фильтр статуса" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все клиенты</SelectItem>
                        <SelectItem value="active">Только активные</SelectItem>
                        <SelectItem value="inactive">Только приостановленные</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('bin')}
                    >
                      🗑️ Корзина
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRunAutoOrders}
                    >
                      🤖 Создать авто-заказы
                    </Button>
                    <Dialog open={isCreateClientModalOpen} onOpenChange={setIsCreateClientModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Создать клиента
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingClientId ? 'Редактировать Клиента' : 'Создать Клиента'}</DialogTitle>
                          <DialogDescription>
                            {editingClientId ? 'Измените данные клиента' : 'Создайте нового клиента в системе'}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateClient}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientName" className="text-right">
                                Имя
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
                                Никнейм
                              </Label>
                              <Input
                                id="clientNickName"
                                value={clientFormData.nickName || ''}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, nickName: e.target.value }))}
                                className="col-span-3"
                                placeholder="Например: Офис, Дом... (необязательно)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientPhone" className="text-right">
                                Телефон
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
                                <p className="text-xs text-muted-foreground mt-1">Формат: +998 XX XXX XX XX</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientAddress" className="text-right">
                                Адрес
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
                                Ссылка на карту
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
                                Тариф
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
                                Калории
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
                                <option value="1200">1200 ккал</option>
                                <option value="1600">1600 ккал</option>
                                <option value="2000">2000 ккал</option>
                                <option value="2500">2500 ккал</option>
                                <option value="3000">3000 ккал</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientPrice" className="text-right">
                                Цена (сум)
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
                                Заметки
                              </Label>
                              <Input
                                id="clientNotes"
                                value={clientFormData.notes || ''}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="col-span-3"
                                placeholder="Индивидуальные предпочтения..."
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                              <Label htmlFor="clientSpecialFeatures" className="text-right">
                                Особенности
                              </Label>
                              <Input
                                id="clientSpecialFeatures"
                                value={clientFormData.specialFeatures}
                                onChange={(e) => setClientFormData(prev => ({ ...prev, specialFeatures: e.target.value }))}
                                className="col-span-3"
                                placeholder="Особые пожелания (необязательно)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-2">
                              <Label className="text-right pt-2">
                                Дни доставки
                              </Label>
                              <div className="col-span-3 space-y-2">
                                <div className="text-xs text-slate-500 mb-2">
                                  Выберите дни недели для автоматического создания заказов
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="monday"
                                      checked={clientFormData.deliveryDays.monday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('monday', checked === true)}
                                    />
                                    <Label htmlFor="monday" className="text-sm">Понедельник</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="tuesday"
                                      checked={clientFormData.deliveryDays.tuesday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('tuesday', checked === true)}
                                    />
                                    <Label htmlFor="tuesday" className="text-sm">Вторник</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="wednesday"
                                      checked={clientFormData.deliveryDays.wednesday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('wednesday', checked === true)}
                                    />
                                    <Label htmlFor="wednesday" className="text-sm">Среда</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="thursday"
                                      checked={clientFormData.deliveryDays.thursday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('thursday', checked === true)}
                                    />
                                    <Label htmlFor="thursday" className="text-sm">Четверг</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="friday"
                                      checked={clientFormData.deliveryDays.friday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('friday', checked === true)}
                                    />
                                    <Label htmlFor="friday" className="text-sm">Пятница</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="saturday"
                                      checked={clientFormData.deliveryDays.saturday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('saturday', checked === true)}
                                    />
                                    <Label htmlFor="saturday" className="text-sm">Суббота</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="sunday"
                                      checked={clientFormData.deliveryDays.sunday}
                                      onCheckedChange={(checked) => handleDeliveryDayChange('sunday', checked === true)}
                                    />
                                    <Label htmlFor="sunday" className="text-sm">Воскресенье</Label>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Label htmlFor="defaultCourier" className="text-sm w-full">
                                    Курьер по умолчанию:
                                    <select
                                      id="defaultCourier"
                                      value={clientFormData.defaultCourierId}
                                      onChange={(e) => setClientFormData(prev => ({ ...prev, defaultCourierId: e.target.value }))}
                                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">Нет</option>
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
                                    Назначенный сет (меню):
                                    <select
                                      id="assignedSet"
                                      value={clientFormData.assignedSetId}
                                      onChange={(e) => setClientFormData(prev => ({ ...prev, assignedSetId: e.target.value }))}
                                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="">Авто (Активный глобальный)</option>
                                      {availableSets.map((set) => (
                                        <option key={set.id} value={set.id}>
                                          {set.name} {set.isActive ? '(Активный)' : ''}
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
                                    Включить автоматическое создание заказов
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
                              Отмена
                            </Button>
                            <Button type="submit" disabled={isCreatingClient}>
                              {isCreatingClient ? 'Сохранение...' : (editingClientId ? 'Сохранить' : 'Создать')}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Client Management Buttons */}
                {selectedClients.size > 0 && (
                  <div className="mb-4 p-3 bg-muted border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        Выбрано клиентов: {selectedClients.size}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const client = clients.find(c => selectedClients.has(c.id))
                            if (client) handleEditClient(client)
                          }}
                          disabled={selectedClients.size !== 1}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePauseSelectedClients}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Приостановить выбранных
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResumeSelectedClients}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Возобновить выбранных
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSelectedClients}
                          disabled={selectedClients.size === 0}
                        >
                          🗑️ Удалить выбранных клиентов
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
                                const filteredClients = clients.filter(client => {
                                  if (clientStatusFilter === 'active') return client.isActive
                                  if (clientStatusFilter === 'inactive') return !client.isActive
                                  return true
                                })
                                if (e.target.checked) {
                                  setSelectedClients(new Set(filteredClients.map(c => c.id)))
                                } else {
                                  setSelectedClients(new Set())
                                }
                              }}
                              checked={(() => {
                                const filteredClients = clients.filter(client => {
                                  if (clientStatusFilter === 'active') return client.isActive
                                  if (clientStatusFilter === 'inactive') return !client.isActive
                                  return true
                                })
                                return selectedClients.size === filteredClients.length && filteredClients.length > 0
                              })()}
                            />
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Имя</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Никнейм</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Телефон</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Адрес</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Калории</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дни доставки</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Статус / Авто
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Особенности
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Дата добавления
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {clients
                          .filter(client => {
                            if (clientStatusFilter === 'active') return client.isActive
                            if (clientStatusFilter === 'inactive') return !client.isActive
                            return true
                          })
                          .map((client) => (
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
                                {client.calories} ккал
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                <div className="text-xs">
                                  {client.deliveryDays?.monday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Пн</span>}
                                  {client.deliveryDays?.tuesday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Вт</span>}
                                  {client.deliveryDays?.wednesday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Ср</span>}
                                  {client.deliveryDays?.thursday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Чт</span>}
                                  {client.deliveryDays?.friday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Пт</span>}
                                  {client.deliveryDays?.saturday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Сб</span>}
                                  {client.deliveryDays?.sunday && <span className="inline-block px-1 py-0.5 bg-blue-100 text-blue-800 rounded mr-1">Вс</span>}
                                  {(!client.deliveryDays || Object.values(client.deliveryDays).every(day => !day)) && (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={client.isActive ? "default" : "secondary"}
                                    className={
                                      `${client.isActive
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : "bg-red-100 text-red-800 border-red-200"} cursor-pointer hover:opacity-80`
                                    }
                                    onClick={() => handleToggleClientStatus(client.id, client.isActive)}
                                  >
                                    {client.isActive ? (
                                      <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                        Активен
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                                        Приостановлен
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                {client.specialFeatures || '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-900">
                                📅 {new Date(client.createdAt).toLocaleDateString('ru-RU')}
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
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {clients
                    .filter(client => {
                      if (clientStatusFilter === 'active') return client.isActive
                      if (clientStatusFilter === 'inactive') return !client.isActive
                      return true
                    })
                    .map((client) => (
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
                            <Badge
                              variant={client.isActive ? "default" : "secondary"}
                              className={
                                `${client.isActive
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"} cursor-pointer`
                              }
                              onClick={() => handleToggleClientStatus(client.id, client.isActive)}
                            >
                              {client.isActive ? "Активен" : "Приостановлен"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                            <div className="text-sm">{client.address}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">Калории:</div>
                            <div className="text-sm">{client.calories} ккал</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div className="font-medium mb-1">Дни доставки:</div>
                            <div className="flex flex-wrap gap-1">
                              {client.deliveryDays?.monday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Пн</span>}
                              {client.deliveryDays?.tuesday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Вт</span>}
                              {client.deliveryDays?.wednesday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Ср</span>}
                              {client.deliveryDays?.thursday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Чт</span>}
                              {client.deliveryDays?.friday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Пт</span>}
                              {client.deliveryDays?.saturday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Сб</span>}
                              {client.deliveryDays?.sunday && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">Вс</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Auto Orders Info */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Автоматические заказы
                  </h3>
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="font-medium mb-1">Информация:</p>
                    <p>• При создании клиента заказы генерируются на 30 дней вперед</p>
                    <p>• Повторная проверка только через 30 дней после создания</p>
                    <p>• Дальнейшие проверки каждые 30 дней от последней</p>
                    <p>• Время доставки: 11:00-14:00</p>
                    <p>• Система работает полностью автоматически</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent >


          {/* Order Details Modal */}
          < Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen} >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Детали Заказа</DialogTitle>
                <DialogDescription>
                  Полная информация о заказе
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Номер заказа:
                    </Label>
                    <div className="col-span-3 font-semibold">
                      #{selectedOrder.orderNumber}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      {t.admin.clients}:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.customer.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Телефон:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.customer.phone}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Адрес:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.deliveryAddress}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Время доставки:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.deliveryTime}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Количество:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.quantity}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Калории:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.calories} ккал
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Особенности:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.specialFeatures || 'Нет'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Курьер:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.courierName || 'Не назначен'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Статус:
                    </Label>
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedOrder.orderStatus)} mr-2`}></div>
                        <span>{getStatusText(selectedOrder.orderStatus)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Оплата:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.paymentMethod === 'CARD' ? 'Карта' : 'Наличные'} - {selectedOrder.paymentStatus === 'PAID' ? 'Оплачено' : 'Не оплачено'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-medium">
                      Предоплата:
                    </Label>
                    <div className="col-span-3">
                      {selectedOrder.isPrepaid ? 'Да' : 'Нет'}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleGetAdminRoute(selectedOrder!)}
                  disabled={!selectedOrder}
                >
                  <Route className="w-4 h-4 mr-2" />
                  Маршрут
                </Button>
                <Button variant="outline" onClick={() => setIsOrderDetailsModalOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </DialogContent>
      </Dialog >

      {isDispatchOpen && (
        <DispatchMapPanel
          open={isDispatchOpen}
          onOpenChange={setIsDispatchOpen}
          orders={orders}
          couriers={couriers}
          selectedDateLabel={
            selectedDate
              ? selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Все заказы'
          }
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

          {/* Profile Tab with Chat and Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Профиль и Настройки</CardTitle>
                <CardDescription>
                  Управляйте своим профилем и общайтесь с командой
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Безопасность</h3>
                  <Button
                    variant="outline"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Изменить пароль
                  </Button>
                  <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                  />
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Warehouse Start Point */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Склад (точка старта)</h3>
                  <p className="text-sm text-muted-foreground">
                    Используется для сортировки и построения маршрутов для всех курьеров.
                  </p>

                  <div className="grid gap-2">
                    <Label htmlFor="warehousePoint">
                      Ссылка Google Maps или координаты (lat,lng)
                      {isWarehouseReadOnly && <span className="ml-2 text-xs text-slate-500">(только просмотр)</span>}
                    </Label>
                    <Input
                      id="warehousePoint"
                      value={warehouseInput}
                      onChange={(e) => handleWarehouseInputChange(e.target.value)}
                      onBlur={() => void handleWarehouseInputBlur()}
                      placeholder="Пример: 41.311081,69.240562 или ссылка Google Maps"
                      disabled={isWarehouseReadOnly || isWarehouseLoading || isWarehouseSaving}
                    />
                    <div className="text-xs text-slate-500">
                      {warehousePoint
                        ? `Текущие координаты: ${warehousePoint.lat.toFixed(6)}, ${warehousePoint.lng.toFixed(6)}`
                        : 'Текущие координаты: не заданы (будет использован дефолт)'}
                      {warehousePreview && (
                        <span className="ml-2 text-slate-400">
                          • Превью: {warehousePreview.lat.toFixed(6)}, {warehousePreview.lng.toFixed(6)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => void refreshWarehousePoint()}
                      variant="outline"
                      disabled={isWarehouseLoading || isWarehouseSaving}
                    >
                      Обновить
                    </Button>
                    <Button
                      onClick={() => void handleSaveWarehousePoint()}
                      disabled={isWarehouseReadOnly || isWarehouseSaving || isWarehouseLoading || !warehouseInput.trim()}
                    >
                      {isWarehouseSaving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Chat Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Сообщения</h3>
                  <ChatTab />
                </div>
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
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold tracking-tight">Корзина заказов</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRestoreSelectedOrders}
                      variant="outline"
                      disabled={selectedOrders.size === 0}
                    >
                      <History className="mr-2 h-4 w-4" />
                      {t.admin.restoreSelected} ({selectedOrders.size})
                    </Button>
                    <Button onClick={fetchBinOrders} variant="outline">
                      <History className="mr-2 h-4 w-4" />
                      {t.common.actions}
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
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold tracking-tight">Корзина клиентов</h2>
                  <div className="flex gap-2">
                    {selectedBinClients.size > 0 && (
                      <div className="flex gap-2">
                        <Button onClick={handleRestoreSelectedClients} variant="outline">
                          <History className="mr-2 h-4 w-4" />
                          Восстановить ({selectedBinClients.size})
                        </Button>
                        <Button
                          onClick={handlePermanentDeleteClients}
                          variant="destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить навсегда ({selectedBinClients.size})
                        </Button>
                      </div>
                    )}
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
      {/* Bulk Edit Orders Modal */}
      < Dialog open={isBulkEditOrdersModalOpen} onOpenChange={setIsBulkEditOrdersModalOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать выбранные заказы ({selectedOrders.size})</DialogTitle>
            <DialogDescription>
              Измените параметры для выбранных заказов. Оставьте поля пустыми, чтобы не менять их.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkOrderStatus" className="text-right">
                Статус
              </Label>
              <select
                id="bulkOrderStatus"
                value={bulkOrderUpdates.orderStatus}
                onChange={(e) => setBulkOrderUpdates(prev => ({ ...prev, orderStatus: e.target.value }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не менять</option>
                <option value="PENDING">Ожидает</option>
                <option value="IN_DELIVERY">В доставке</option>
                <option value="DELIVERED">Доставлен</option>
                <option value="FAILED">Отменен</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkPaymentStatus" className="text-right">
                Оплата
              </Label>
              <select
                id="bulkPaymentStatus"
                value={bulkOrderUpdates.paymentStatus}
                onChange={(e) => setBulkOrderUpdates(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не менять</option>
                <option value="PAID">Оплачен</option>
                <option value="UNPAID">Не оплачен</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkCourier" className="text-right">
                Курьер
              </Label>
              <select
                id="bulkCourier"
                value={bulkOrderUpdates.courierId}
                onChange={(e) => setBulkOrderUpdates(prev => ({ ...prev, courierId: e.target.value }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не менять</option>
                <option value="none">Снять курьера</option>
                {couriers.map(courier => (
                  <option key={courier.id} value={courier.id}>{courier.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkDeliveryDate" className="text-right">
                Дата
              </Label>
              <Input
                id="bulkDeliveryDate"
                type="date"
                value={bulkOrderUpdates.deliveryDate}
                onChange={(e) => setBulkOrderUpdates(prev => ({ ...prev, deliveryDate: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditOrdersModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleBulkUpdateOrders} disabled={isUpdatingBulk}>
              {isUpdatingBulk ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Bulk Edit Clients Modal */}
      < Dialog open={isBulkEditClientsModalOpen} onOpenChange={setIsBulkEditClientsModalOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать выбранные клиентов ({selectedClients.size})</DialogTitle>
            <DialogDescription>
              Измените параметры для выбранных клиентов. Оставьте поля пустыми, чтобы не менять их.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkIsActive" className="text-right">
                Статус
              </Label>
              <select
                id="bulkIsActive"
                value={bulkClientUpdates.isActive === undefined ? '' : bulkClientUpdates.isActive.toString()}
                onChange={(e) => setBulkClientUpdates(prev => ({
                  ...prev,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не менять</option>
                <option value="true">Активен</option>
                <option value="false">Приостановлен</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="bulkCalories" className="text-right">
                Калории
              </Label>
              <select
                id="bulkCalories"
                value={bulkClientUpdates.calories}
                onChange={(e) => setBulkClientUpdates(prev => ({ ...prev, calories: e.target.value }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Не менять</option>
                <option value="1200">1200</option>
                <option value="1600">1600</option>
                <option value="2000">2000</option>
                <option value="2500">2500</option>
                <option value="3000">3000</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEditClientsModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleBulkUpdateClients} disabled={isUpdatingBulk}>
              {isUpdatingBulk ? t.common.loading : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Order Details Modal */}
      < Dialog open={isOrderDetailsModalOpen} onOpenChange={setIsOrderDetailsModalOpen} >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Детали заказа #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Полная информация о заказе и клиенте
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Статус:</span>
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
                        ? "Доставлен"
                        : selectedOrder.orderStatus === 'IN_DELIVERY'
                          ? "В доставке"
                          : "Ожидает"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Оплата:</span>
                    <Badge
                      variant={selectedOrder.paymentStatus === 'PAID' ? "default" : "destructive"}
                      className={selectedOrder.paymentStatus === 'PAID' ? "bg-green-100 text-green-800" : ""}
                    >
                      {selectedOrder.paymentStatus === 'PAID' ? "Оплачен" : "Не оплачен"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Метод:</span>
                    <span className="text-sm">{selectedOrder.paymentMethod === 'CASH' ? 'Наличные' : 'Карта'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Количество:</span>
                    <span className="text-sm font-bold">{selectedOrder.quantity} порц.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Калории:</span>
                    <span className="text-sm">{selectedOrder.calories} ккал</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Клиент</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedOrder.customerName || selectedOrder.customer?.name}</p>
                      <p className="text-xs text-slate-500">{selectedOrder.customer?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Доставка</h4>
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

                {selectedOrder.specialFeatures && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">Особенности</h4>
                    <p className="text-sm bg-orange-50 p-2 rounded border border-orange-100 text-orange-800">
                      {selectedOrder.specialFeatures}
                    </p>
                  </div>
                )}

                {selectedOrder.courierName && (
                  <div className="border-t pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">Курьер</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
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
              Закрыть
            </Button>
            {selectedOrder && (
              <Button onClick={() => {
                setIsOrderDetailsModalOpen(false)
                handleEditOrder(selectedOrder)
              }}>
                Редактировать
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
            <DialogTitle>Создать Курьера</DialogTitle>
            <DialogDescription>
              Создайте новый аккаунт для курьера
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourier}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="courierName" className="text-right">
                  Имя
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
                  Пароль
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
                Отмена
              </Button>
              <Button type="submit" disabled={isCreatingCourier}>
                {isCreatingCourier ? 'Создание...' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default AdminDashboardPage
