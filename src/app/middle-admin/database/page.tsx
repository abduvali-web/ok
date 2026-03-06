'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Database,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Settings,
  Table2,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { AIChatInterface } from '@/components/ai/ChatInterface'
import { UserList } from '@/components/collaboration/UserList'
import { ExcelEditor } from '@/components/excel'
import { usePresence } from '@/hooks/useCollaboration'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type ClientRecord = {
  id: string
  name: string
  phone: string
  address: string
  isActive: boolean
  calories: number | null
  hasLocation: boolean
}

type OrderRecord = {
  id: string
  orderNumber: number | null
  customerName: string
  deliveryAddress: string
  orderStatus: string
  paymentStatus: string
  calories: number | null
  createdAt: string
}

type DashboardStats = {
  pendingOrders?: number
  inDeliveryOrders?: number
  pausedOrders?: number
  successfulOrders?: number
  failedOrders?: number
  unpaidOrders?: number
}

function normalizeClient(record: any): ClientRecord {
  const lat = typeof record?.latitude === 'number' ? record.latitude : null
  const lng = typeof record?.longitude === 'number' ? record.longitude : null

  return {
    id: String(record?.id ?? ''),
    name: String(record?.name ?? 'Unknown'),
    phone: String(record?.phone ?? '-'),
    address: String(record?.address ?? '-'),
    isActive: Boolean(record?.isActive),
    calories: typeof record?.calories === 'number' ? record.calories : null,
    hasLocation: lat != null && lng != null,
  }
}

function normalizeOrder(record: any): OrderRecord {
  return {
    id: String(record?.id ?? ''),
    orderNumber: typeof record?.orderNumber === 'number' ? record.orderNumber : null,
    customerName: String(record?.customer?.name ?? record?.customerName ?? 'Unknown'),
    deliveryAddress: String(record?.deliveryAddress ?? '-'),
    orderStatus: String(record?.orderStatus ?? 'UNKNOWN'),
    paymentStatus: String(record?.paymentStatus ?? 'UNKNOWN'),
    calories: typeof record?.calories === 'number' ? record.calories : null,
    createdAt: String(record?.createdAt ?? new Date().toISOString()),
  }
}

export default function DatabasePage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState('overview')
  const [showAIChat, setShowAIChat] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('Middle Admin')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const [clients, setClients] = useState<ClientRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [stats, setStats] = useState<DashboardStats>({})
  const [couriersOnline, setCouriersOnline] = useState(0)

  const { users: onlineUsers } = usePresence('middle-admin-database', adminId, adminName)

  useEffect(() => {
    const userRaw = localStorage.getItem('user')
    if (!userRaw) return
    try {
      const user = JSON.parse(userRaw)
      setAdminId(typeof user?.id === 'string' ? user.id : null)
      setAdminName(typeof user?.name === 'string' ? user.name : 'Middle Admin')
    } catch {
      // ignore malformed user
    }
  }, [])

  const loadSnapshot = useCallback(
    async (background = false) => {
      if (background) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const [clientsRes, ordersRes, statsRes, couriersRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/orders'),
          fetch('/api/admin/statistics'),
          fetch('/api/admin/couriers'),
        ])

        if (clientsRes.status === 401 || ordersRes.status === 401 || statsRes.status === 401 || couriersRes.status === 401) {
          router.replace('/login')
          return
        }

        const clientsPayload = clientsRes.ok ? await clientsRes.json() : []
        const ordersPayload = ordersRes.ok ? await ordersRes.json() : []
        const statsPayload = statsRes.ok ? await statsRes.json() : {}
        const couriersPayload = couriersRes.ok ? await couriersRes.json() : []

        setClients(Array.isArray(clientsPayload) ? clientsPayload.map(normalizeClient) : [])
        setOrders(Array.isArray(ordersPayload) ? ordersPayload.map(normalizeOrder) : [])
        setStats(typeof statsPayload === 'object' && statsPayload ? statsPayload : {})
        setCouriersOnline(Array.isArray(couriersPayload) ? couriersPayload.length : 0)
        setLastSyncedAt(new Date())
      } catch {
        toast.error('Unable to load database snapshot')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [router]
  )

  useEffect(() => {
    void loadSnapshot()
  }, [loadSnapshot])

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) => [client.name, client.phone, client.address].some((value) => value.toLowerCase().includes(query)))
  }, [clients, searchTerm])

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return orders
    return orders.filter((order) =>
      [order.customerName, order.deliveryAddress, order.orderStatus, order.paymentStatus, String(order.orderNumber ?? '')].some((value) =>
        value.toLowerCase().includes(query)
      )
    )
  }, [orders, searchTerm])

  const activeClients = useMemo(() => clients.filter((client) => client.isActive).length, [clients])
  const clientsWithLocation = useMemo(() => clients.filter((client) => client.hasLocation).length, [clients])
  const activeOrders = useMemo(() => orders.filter((order) => order.orderStatus === 'PENDING' || order.orderStatus === 'IN_DELIVERY').length, [orders])
  const unpaidOrders = useMemo(() => orders.filter((order) => order.paymentStatus === 'UNPAID').length, [orders])
  const dataCoverage = useMemo(() => {
    if (clients.length === 0) return 0
    return Math.round((clientsWithLocation / clients.length) * 100)
  }, [clients.length, clientsWithLocation])
  const lastSyncedLabel = useMemo(
    () => (lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not synced yet'),
    [lastSyncedAt]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading database workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database workspace
              </CardTitle>
              <CardDescription>
                Last sync: {lastSyncedLabel}. Collaborators online: {onlineUsers.length}. Couriers online: {couriersOnline}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <UserList users={onlineUsers} />
              <Button variant="outline" onClick={() => void loadSnapshot(true)} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowAIChat((prev) => !prev)}>
                <Bot className="mr-2 h-4 w-4" />
                AI assistant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Client records</p>
              <p className="mt-1 text-2xl font-semibold">{clients.length}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Active clients</p>
              <p className="mt-1 text-2xl font-semibold">{activeClients}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Order records</p>
              <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Active orders</p>
              <p className="mt-1 text-2xl font-semibold">{activeOrders}</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-xs text-muted-foreground">Location coverage</p>
              <p className="mt-1 text-2xl font-semibold">{dataCoverage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Data modules</CardTitle>
              <CardDescription>Overview, editor, clients, orders, and settings</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search clients or orders" className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="editor" className="gap-1.5">
                <Table2 className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-1.5">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-1.5">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-xl font-semibold">{stats.pendingOrders ?? 0}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">In delivery</p>
                  <p className="mt-1 text-xl font-semibold">{stats.inDeliveryOrders ?? 0}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Paused</p>
                  <p className="mt-1 text-xl font-semibold">{stats.pausedOrders ?? 0}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Unpaid</p>
                  <p className="mt-1 text-xl font-semibold">{stats.unpaidOrders ?? unpaidOrders}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor">
              <ExcelEditor adminId={adminId || 'middle-admin'} onAIAssist={() => setShowAIChat(true)} />
            </TabsContent>

            <TabsContent value="clients">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Calories</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.slice(0, 40).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{client.address}</TableCell>
                        <TableCell>
                          <Badge variant={client.isActive ? 'default' : 'secondary'}>{client.isActive ? 'Active' : 'Paused'}</Badge>
                        </TableCell>
                        <TableCell>{client.calories ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 40).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.orderNumber ?? '-'}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{order.deliveryAddress}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.orderStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === 'UNPAID' ? 'destructive' : 'default'}>{order.paymentStatus}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success('CSV export queued')}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV export
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast.success('JSON export queued')}>
                  <Download className="mr-2 h-4 w-4" />
                  JSON export
                </Button>
                <Button variant="destructive" size="sm" onClick={() => toast.warning('Temporary cache purge scheduled')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Purge temp cache
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showAIChat && (
        <AIChatInterface
          adminId={adminId || 'middle-admin'}
          onTaskExecute={async (task) => {
            toast.info(`Task queued: ${task}`)
          }}
        />
      )}

      {!showAIChat && (
        <Button size="icon" className="fixed bottom-5 right-5" onClick={() => setShowAIChat(true)} aria-label="Open AI assistant">
          <Bot className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
