'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LogOut,
  Settings,
  Shield,
  Clock,
  LayoutDashboard,
  Users,
  Package,
  History,
  Archive,
  BarChart3,
  MessageSquare,
  PieChart,
  UserCircle,
  Hash,
  MapPin,
  Phone,
  CreditCard,
  Utensils,
  Truck,
  Database,
  Info,
  Key,
  Navigation,
  ExternalLink,
  Map as MapIcon,
  Crosshair,
  Store,
  Wallet,
  CookingPot,
  Scale,
  Edit,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { signOut, useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
import { CalendarRangeSelector } from '@/components/admin/dashboard/shared/CalendarRangeSelector'
import type { DateRange } from 'react-day-picker'
import { extractCoordsFromText, parseGoogleMapsUrl } from '@/lib/geo'
import { PLAN_TYPES } from '@/lib/menuData'
import Link from 'next/link'

// Specialized tabs
import { StatisticsTab } from './dashboard/tabs-content/StatisticsTab'
import { OrdersTab } from './dashboard/tabs-content/OrdersTab'
import { ClientsTab } from './dashboard/tabs-content/ClientsTab'
import { AdminsTab } from './dashboard/tabs-content/AdminsTab'
import { WarehouseTab } from './WarehouseTab'
import { FinanceTab } from './FinanceTab'
import { HistoryTab } from './dashboard/tabs-content/HistoryTab'
import { BinTab } from './dashboard/tabs-content/BinTab'

// Modals and heavy components
const OrderModal = dynamic(() => import('@/components/admin/dashboard/modals/OrderModal'), { ssr: false })
const OrderDetailsModal = dynamic(() => import('@/components/admin/dashboard/modals/OrderDetailsModal'), { ssr: false })
const DispatchMapPanel = dynamic(() => import('@/components/admin/DispatchMapPanel'), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse bg-muted rounded-xl" />
})
const SiteBuilderCard = dynamic(() => import('@/components/admin/SiteBuilderCard'), { ssr: false })
const TrialStatus = dynamic(() => import('@/components/admin/TrialStatus'), { ssr: false })
const ChatCenter = dynamic(() => import('@/components/admin/ChatCenter'), { ssr: false })
const ChangePasswordModal = dynamic(() => import('@/components/admin/ChangePasswordModal'), { ssr: false })

const AdminDashboardPage = () => {
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const meRole = session?.user?.role || 'MIDDLE_ADMIN'
  const isSuperAdmin = meRole === 'SUPER_ADMIN'
  const isMiddleAdminView = meRole === 'MIDDLE_ADMIN' || isSuperAdmin
  const isLowAdminView = meRole === 'LOW_ADMIN'

  // Tab state
  const [activeTab, setActiveTab] = useState('statistics')

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedPeriod, setSelectedPeriod] = useState<DateRange | undefined>(undefined)

  // Data state
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [lowAdmins, setLowAdmins] = useState<any[]>([])
  const [couriers, setCouriers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDashboardRefreshing, setIsDashboardRefreshing] = useState(false)

  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())

  // Search state
  const [clientSearchTerm, setClientSearchTerm] = useState('')

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [isDispatchOpen, setIsDispatchOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteClientsDialogOpen, setIsDeleteClientsDialogOpen] = useState(false)

  // Sub-modal entities
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [isMutatingClients, setIsMutatingClients] = useState(false)
  const [isDeletingOrders, setIsDeletingOrders] = useState(false)

  // Client finance cache
  const [clientFinanceById, setClientFinanceById] = useState<Record<string, any>>({})
  const [isClientFinanceLoading, setIsClientFinanceLoading] = useState(false)

  // Bin/History related
  const [deletedOrders, setDeletedOrders] = useState<any[]>([])
  const [deletedClients, setDeletedClients] = useState<any[]>([])
  const [selectedDeletedOrders, setSelectedDeletedOrders] = useState<Set<string>>(new Set())
  const [selectedDeletedClients, setSelectedDeletedClients] = useState<Set<string>>(new Set())
  const [isMutatingBin, setIsMutatingBin] = useState(false)
  const [isBinLoading, setIsBinLoading] = useState(false)

  // Warehouse start point
  const [warehousePoint, setWarehousePoint] = useState<{ lat: number; lng: number } | null>(null)

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const toLocalIsoDate = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const selectedDateISO = selectedDate ? toLocalIsoDate(selectedDate) : null

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await fetch('/api/admin/dashboard-data')
      if (resp.ok) {
        const data = await resp.json()
        setOrders(data.orders || [])
        setClients(data.clients || [])
        setLowAdmins(data.lowAdmins || [])
        setCouriers(data.couriers || [])
        setStats(data.stats || null)
        setWarehousePoint(data.warehousePoint || null)
      }
    } catch (e) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setIsDashboardRefreshing(false)
    }
  }, [])

  const fetchBinData = useCallback(async () => {
    setIsBinLoading(true)
    try {
      const resp = await fetch('/api/admin/bin')
      if (resp.ok) {
        const data = await resp.json()
        setDeletedOrders(data.orders || [])
        setDeletedClients(data.clients || [])
      }
    } finally {
      setIsBinLoading(false)
    }
  }, [])

  const fetchClientFinance = useCallback(async () => {
    setIsClientFinanceLoading(true)
    try {
      const resp = await fetch('/api/admin/finance/clients-summary')
      if (resp.ok) {
        const data = await resp.json()
        const map: Record<string, any> = {}
        data.forEach((item: any) => { map[item.id] = item })
        setClientFinanceById(map)
      }
    } finally {
      setIsClientFinanceLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchBinData()
    fetchClientFinance()
  }, [fetchData, fetchBinData, fetchClientFinance])

  // Handle Tab changes
  useEffect(() => {
    const saved = localStorage.getItem('adminDashboardTab')
    if (saved && ['statistics', 'orders', 'clients', 'admins', 'history', 'bin', 'warehouse', 'finance'].includes(saved)) {
      setActiveTab(saved)
    }
  }, [])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    localStorage.setItem('adminDashboardTab', val)
  }

  // Handlers for Orders
  const handleEditOrder = (order: any) => {
    setSelectedOrder(order)
    setIsOrderModalOpen(true)
  }

  const handleDeleteSelectedOrders = async () => {
    if (selectedOrders.size === 0) return
    setIsDeletingOrders(true)
    try {
      const resp = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedOrders) })
      })
      if (resp.ok) {
        toast.success(language === 'ru' ? 'Заказы перемещены в корзину' : 'Orders moved to bin')
        setSelectedOrders(new Set())
        fetchData()
        fetchBinData()
      }
    } finally {
      setIsDeletingOrders(false)
    }
  }

  // Handlers for Clients
  const handleEditClient = (client: any) => {
    setEditingClientId(client.id)
    // Redacted: Logic to prefill modal handled inside client tab if possible,
    // otherwise prefills here and opens modal.
    setIsCreateClientModalOpen(true)
  }

  const handleToggleClientStatus = async (id: string, current: boolean) => {
    try {
      const resp = await fetch(`/api/admin/clients/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current })
      })
      if (resp.ok) {
        toast.success(language === 'ru' ? 'Статус клиента изменен' : 'Client status updated')
        fetchData()
      }
    } catch {
      toast.error('Action failed')
    }
  }

  const handleDeleteSelectedClients = async () => {
    setIsMutatingClients(true)
    try {
      const resp = await fetch('/api/admin/clients/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedClients) })
      })
      if (resp.ok) {
        toast.success(language === 'ru' ? 'Клиенты архивированы' : 'Clients archived')
        setSelectedClients(new Set())
        setIsDeleteClientsDialogOpen(false)
        fetchData()
        fetchBinData()
      }
    } finally {
      setIsMutatingClients(false)
    }
  }

  // Bin Handlers
  const handleRestoreDeletedOrders = async () => {
    if (selectedDeletedOrders.size === 0) return
    setIsMutatingBin(true)
    try {
      const resp = await fetch('/api/admin/bin/restore-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedDeletedOrders) })
      })
      if (resp.ok) {
        toast.success('Orders restored')
        setSelectedDeletedOrders(new Set())
        fetchBinData()
        fetchData()
      }
    } finally { setIsMutatingBin(false) }
  }

  const handlePermanentDeleteOrders = async () => {
    if (selectedDeletedOrders.size === 0) return
    if (!confirm('This will PERMANENTLY delete these orders. Continue?')) return
    setIsMutatingBin(true)
    try {
      const resp = await fetch('/api/admin/bin/delete-orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedDeletedOrders) })
      })
      if (resp.ok) {
        toast.success('Orders permanently deleted')
        setSelectedDeletedOrders(new Set())
        fetchBinData()
      }
    } finally { setIsMutatingBin(false) }
  }

  // Refreshes
  const handleRefreshAll = () => {
    setIsDashboardRefreshing(true)
    fetchData()
    fetchBinData()
    fetchClientFinance()
  }

  // Translation helpers
  const profileUiText = useMemo(() => {
    if (language === 'ru') {
      return {
        dashboardTitle: 'Панель управления',
        allOrders: 'Все заказы',
        searchPlaceholder: 'Поиск...',
        searchOrdersPlaceholder: 'Поиск заказов...',
        nickname: 'Никнейм',
        balance: 'Баланс',
        days: 'Дней',
        saving: 'Сохранение...',
        refresh: 'Обновить',
        enableAutoOrderCreation: 'Включить автосоздание заказов',
        ordersBin: 'Корзина заказов',
        clientsBin: 'Корзина клиентов',
      }
    }
    return {
      dashboardTitle: 'Admin Dashboard',
      allOrders: 'All Orders',
      searchPlaceholder: 'Search...',
      searchOrdersPlaceholder: 'Search orders...',
      nickname: 'Nickname',
      balance: 'Balance',
      days: 'Days',
      saving: 'Saving...',
      refresh: 'Refresh',
      enableAutoOrderCreation: 'Enable auto-order creation',
      ordersBin: 'Orders Recycle Bin',
      clientsBin: 'Clients Recycle Bin',
    }
  }, [language])

  const tabsCopy = useMemo(() => {
    if (language === 'ru') {
      return {
        statistics: 'Статистика',
        orders: 'Заказы',
        clients: 'Клиенты',
        admins: 'Админы',
        history: 'История',
        bin: 'Корзина',
        warehouse: 'Склад',
        finance: 'Финансы',
      }
    }
    return {
      statistics: 'Statistics',
      orders: 'Orders',
      clients: 'Clients',
      admins: 'Admins',
      history: 'History',
      bin: 'Bin',
      warehouse: 'Warehouse',
      finance: 'Finance',
    }
  }, [language])

  const filteredOrders = useMemo(() => {
    let result = orders
    if (selectedPeriod?.from) {
      const start = new Date(selectedPeriod.from).setHours(0,0,0,0)
      const end = new Date(selectedPeriod.to ?? selectedPeriod.from).setHours(23,59,59,999)
      result = result.filter(o => {
        const d = new Date(o.deliveryDate).getTime()
        return d >= start && d <= end
      })
    } else if (selectedDate) {
      const match = selectedDateISO
      result = result.filter(o => o.deliveryDate?.startsWith(match))
    }
    return result
  }, [orders, selectedPeriod, selectedDate, selectedDateISO])

  const filteredClients = useMemo(() => {
    const q = clientSearchTerm.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q) || c.nickName?.toLowerCase().includes(q))
  }, [clients, clientSearchTerm])

  const selectedPeriodLabel = useMemo(() => {
    if (selectedPeriod?.from) {
      const f = format(selectedPeriod.from, 'dd MMM', { locale: language === 'ru' ? ru : undefined })
      const t = selectedPeriod.to ? format(selectedPeriod.to, 'dd MMM', { locale: language === 'ru' ? ru : undefined }) : f
      return f === t ? f : `${f} - ${t}`
    }
    if (selectedDate) return format(selectedDate, 'dd MMMM', { locale: language === 'ru' ? ru : undefined })
    return profileUiText.allOrders
  }, [selectedPeriod, selectedDate, language, profileUiText.allOrders])

  const dispatchActionLabel = language === 'ru' ? 'Диспетчеризация' : 'Dispatch Control'
  const DispatchActionIcon = MapIcon

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-gourmet-cream dark:bg-dark-surface transition-colors duration-500 overflow-hidden">
        
        {/* Main Dashboard Tabs Container */}
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-8 lg:p-12">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 lg:mb-12 relative z-50">
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-gourmet-green dark:bg-dark-green rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-500">
                  <LayoutDashboard className="w-6 h-6 text-gourmet-cream" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-gourmet-ink dark:text-dark-text tracking-tighter uppercase">
                    {profileUiText.dashboardTitle}
                  </h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Management Hub v2.0</p>
                </div>
              </div>

              <TabsList className="bg-white/40 dark:bg-dark-green/20 backdrop-blur-3xl border border-white/20 p-1 rounded-[32px] h-14 md:h-16 flex items-center shadow-2xl">
                {Object.entries(tabsCopy).map(([key, label]) => (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="rounded-full px-4 md:px-8 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green data-[state=active]:text-gourmet-cream font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all duration-500"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                {/* Statistics Tab */}
                <StatisticsTab key="statistics" />

                {/* Orders Tab */}
                <OrdersTab
                  key="orders"
                  orders={filteredOrders}
                  selectedOrders={selectedOrders}
                  onSelectOrder={(id) => {
                    const next = new Set(selectedOrders)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedOrders(next)
                  }}
                  onSelectAll={() => {
                    if (selectedOrders.size === filteredOrders.length) setSelectedOrders(new Set())
                    else setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
                  }}
                  onDeleteSelected={handleDeleteSelectedOrders}
                  onEditOrder={handleEditOrder}
                  onCreateOrder={() => {
                    setSelectedOrder(null)
                    setIsOrderModalOpen(true)
                  }}
                  onDispatchOpen={() => setIsDispatchOpen(true)}
                  onRefresh={handleRefreshAll}
                  isRefreshing={isDashboardRefreshing}
                  isDeleting={isDeletingOrders}
                  selectedDate={selectedDate}
                  applySelectedDate={setSelectedDate}
                  shiftSelectedDate={(days) => {
                    if (!selectedDate) return
                    const next = new Date(selectedDate)
                    next.setDate(next.getDate() + days)
                    setSelectedDate(next)
                  }}
                  selectedPeriod={selectedPeriod}
                  applySelectedPeriod={setSelectedPeriod}
                  selectedPeriodLabel={selectedPeriodLabel}
                  dispatchActionLabel={dispatchActionLabel}
                  DispatchActionIcon={DispatchActionIcon}
                  profileUiText={profileUiText}
                />

                {/* Clients Tab */}
                <ClientsTab
                  key="clients"
                  clients={filteredClients}
                  selectedDate={selectedDate}
                  applySelectedDate={setSelectedDate}
                  shiftSelectedDate={(days) => {
                    if (!selectedDate) return
                    const next = new Date(selectedDate)
                    next.setDate(next.getDate() + days)
                    setSelectedDate(next)
                  }}
                  selectedDateLabel={selectedPeriodLabel}
                  selectedPeriod={selectedPeriod}
                  applySelectedPeriod={setSelectedPeriod}
                  profileUiText={profileUiText}
                  onRefresh={handleRefreshAll}
                  isLoading={isLoading}
                  selectedClients={selectedClients}
                  onToggleClientSelection={(id) => {
                    const next = new Set(selectedClients)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedClients(next)
                  }}
                  onToggleAllSelection={(c) => {
                    if (c) setSelectedClients(new Set(filteredClients.map(cl => cl.id)))
                    else setSelectedClients(new Set())
                  }}
                  onEditClient={handleEditClient}
                  onDeleteSelected={() => setIsDeleteClientsDialogOpen(true)}
                  onToggleStatus={handleToggleClientStatus}
                  onOpenCreateModal={() => {
                    setEditingClientId(null)
                    setIsCreateClientModalOpen(true)
                  }}
                  isMutating={isMutatingClients}
                  clientFinanceById={clientFinanceById}
                  isFinanceLoading={isClientFinanceLoading}
                  orders={orders}
                  searchTerm={clientSearchTerm}
                  onSearchChange={setClientSearchTerm}
                  t={t}
                  language={language}
                />

                {/* Admins Tab */}
                <AdminsTab
                  key="admins"
                  lowAdmins={lowAdmins}
                  isLowAdminView={isLowAdminView}
                  onRefresh={fetchData}
                  tabsCopy={tabsCopy}
                  orders={orders}
                  selectedDate={selectedDate}
                  applySelectedDate={setSelectedDate}
                  shiftSelectedDate={(d) => {
                    if (!selectedDate) return
                    const n = new Date(selectedDate)
                    n.setDate(n.getDate() + d)
                    setSelectedDate(n)
                  }}
                  selectedPeriod={selectedPeriod}
                  applySelectedPeriod={setSelectedPeriod}
                  selectedPeriodLabel={selectedPeriodLabel}
                  profileUiText={profileUiText}
                />

                {/* Warehouse Tab */}
                <WarehouseTab key="warehouse" />

                {/* Finance Tab */}
                <FinanceTab
                  key="finance"
                  selectedDate={selectedDate}
                  applySelectedDate={setSelectedDate}
                  selectedPeriod={selectedPeriod}
                  applySelectedPeriod={setSelectedPeriod}
                  selectedPeriodLabel={selectedPeriodLabel}
                  profileUiText={profileUiText}
                />

                {/* History Tab */}
                <HistoryTab
                  key="history"
                  selectedDate={selectedDate}
                  applySelectedDate={setSelectedDate}
                  selectedPeriod={selectedPeriod}
                  applySelectedPeriod={setSelectedPeriod}
                  selectedPeriodLabel={selectedPeriodLabel}
                  profileUiText={profileUiText}
                />

                {/* Bin Tab */}
                <BinTab
                  key="bin"
                  deletedOrders={deletedOrders}
                  deletedClients={deletedClients}
                  selectedDeletedOrders={selectedDeletedOrders}
                  selectedDeletedClients={selectedDeletedClients}
                  onSelectDeletedOrder={(id) => {
                    const next = new Set(selectedDeletedOrders)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedDeletedOrders(next)
                  }}
                  onSelectDeletedClient={(id) => {
                    const next = new Set(selectedDeletedClients)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    setSelectedDeletedClients(next)
                  }}
                  onSelectAllDeletedOrders={() => {
                    if (selectedDeletedOrders.size === deletedOrders.length) setSelectedDeletedOrders(new Set())
                    else setSelectedDeletedOrders(new Set(deletedOrders.map(o => o.id)))
                  }}
                  onSelectAllDeletedClients={() => {
                    if (selectedDeletedClients.size === deletedClients.length) setSelectedDeletedClients(new Set())
                    else setSelectedDeletedClients(new Set(deletedClients.map(c => c.id)))
                  }}
                  onRestoreOrders={handleRestoreDeletedOrders}
                  onRestoreClients={async () => {
                    setIsMutatingBin(true)
                    try {
                      await fetch('/api/admin/bin/restore-clients', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: Array.from(selectedDeletedClients) })
                      })
                      fetchBinData(); fetchData()
                    } finally { setIsMutatingBin(false) }
                  }}
                  onPermanentDeleteOrders={handlePermanentDeleteOrders}
                  onPermanentDeleteClients={async () => {
                    if (!confirm('Permanently delete clients?')) return
                    setIsMutatingBin(true)
                    try {
                      await fetch('/api/admin/bin/delete-clients', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: Array.from(selectedDeletedClients) })
                      })
                      fetchBinData()
                    } finally { setIsMutatingBin(false) }
                  }}
                  isRestoring={isMutatingBin}
                  isPermanentlyDeleting={isMutatingBin}
                  onRefresh={fetchBinData}
                  isRefreshing={isBinLoading}
                />

              </AnimatePresence>
            </div>
          </Tabs>
        </div>

        {/* Global Modals */}
        <AnimatePresence>
          {isOrderModalOpen && (
            <OrderModal
              isOpen={isOrderModalOpen}
              onClose={() => setIsOrderModalOpen(false)}
              order={selectedOrder}
              onSaved={handleRefreshAll}
              initialDate={selectedDate || new Date()}
            />
          )}

          {isOrderDetailsModalOpen && selectedOrder && (
            <OrderDetailsModal
              isOpen={isOrderDetailsModalOpen}
              onClose={() => setIsOrderDetailsModalOpen(false)}
              order={selectedOrder}
            />
          )}

          {isDispatchOpen && (
            <DispatchMapPanel
              open={isDispatchOpen}
              onOpenChange={setIsDispatchOpen}
              orders={filteredOrders}
              couriers={couriers}
              selectedDateLabel={selectedPeriodLabel}
              selectedDateISO={selectedDateISO || undefined}
              warehousePoint={warehousePoint}
              onSaved={fetchData}
            />
          )}

          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />

          <Dialog open={isDeleteClientsDialogOpen} onOpenChange={setIsDeleteClientsDialogOpen}>
            <DialogContent className="rounded-[40px] border-none shadow-2xl bg-white/90 backdrop-blur-3xl p-10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Archive Confirmation</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  Moving {selectedClients.size} clients to the recycle bin. They can be restored later.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-8 gap-4">
                <Button variant="ghost" className="rounded-full font-bold" onClick={() => setIsDeleteClientsDialogOpen(false)}>Cancel</Button>
                <Button 
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest px-8"
                  onClick={handleDeleteSelectedClients}
                  disabled={isMutatingClients}
                >
                  {isMutatingClients ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Move to Bin'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AnimatePresence>

        {/* Floating Utility actions */}
        <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[100]">
           <motion.button 
             whileHover={{ scale: 1.1, rotate: 15 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsChangePasswordOpen(true)}
             className="w-14 h-14 bg-white/80 dark:bg-dark-green/40 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex items-center justify-center text-gourmet-ink dark:text-dark-text"
           >
             <Key className="w-6 h-6" />
           </motion.button>
           <motion.button 
             whileHover={{ scale: 1.1, rotate: -15 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => signOut()}
             className="w-14 h-14 bg-rose-500 rounded-full shadow-2xl flex items-center justify-center text-white"
           >
             <LogOut className="w-6 h-6" />
           </motion.button>
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
