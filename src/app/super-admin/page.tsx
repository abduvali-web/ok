'use client'

import { useEffect, useMemo, useState } from 'react'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  History,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { HistoryTable } from '@/components/admin/HistoryTable'
import { InterfaceSettings } from '@/components/admin/InterfaceSettings'
import { ChatTab } from '@/components/chat/ChatTab'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface Admin {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface OrderStatistics {
  successfulOrders: number
  failedOrders: number
  pendingOrders: number
  inDeliveryOrders: number
  pausedOrders: number
  prepaidOrders: number
  unpaidOrders: number
  cardOrders: number
  cashOrders: number
  dailyCustomers: number
  evenDayCustomers: number
  oddDayCustomers: number
  specialPreferenceCustomers: number
  orders1200: number
  orders1600: number
  orders2000: number
  orders2500: number
  orders3000: number
  singleItemOrders: number
  multiItemOrders: number
}

const ZERO_STATS: OrderStatistics = {
  successfulOrders: 0,
  failedOrders: 0,
  pendingOrders: 0,
  inDeliveryOrders: 0,
  pausedOrders: 0,
  prepaidOrders: 0,
  unpaidOrders: 0,
  cardOrders: 0,
  cashOrders: 0,
  dailyCustomers: 0,
  evenDayCustomers: 0,
  oddDayCustomers: 0,
  specialPreferenceCustomers: 0,
  orders1200: 0,
  orders1600: 0,
  orders2000: 0,
  orders2500: 0,
  orders3000: 0,
  singleItemOrders: 0,
  multiItemOrders: 0,
}

const INITIAL_CREATE_FORM = {
  name: '',
  email: '',
  password: '',
}

const INITIAL_PROFILE_FORM = {
  name: '',
  email: '',
  password: '',
}

type AdminStatusFilter = 'all' | 'active' | 'inactive'

function formatShortDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function SuperAdminPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('admins')
  const [middleAdmins, setMiddleAdmins] = useState<Admin[]>([])
  const [orderStatistics, setOrderStatistics] = useState<OrderStatistics>(ZERO_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_FORM)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('all')
  const [mutatingAdminId, setMutatingAdminId] = useState<string | null>(null)
  const [adminIdPendingDelete, setAdminIdPendingDelete] = useState<string | null>(null)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [selectedPassword, setSelectedPassword] = useState('')
  const [selectedPasswordAdminName, setSelectedPasswordAdminName] = useState('')

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(INITIAL_PROFILE_FORM)
  const [adminName, setAdminName] = useState('Super Admin')

  const loadDashboardData = async (silent = false) => {
    if (silent) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const [adminsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/middle-admins'),
        fetch('/api/admin/statistics'),
      ])

      if (adminsResponse.status === 401 || statsResponse.status === 401) {
        window.location.href = '/login'
        return
      }

      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json()
        setMiddleAdmins(Array.isArray(adminsData) ? adminsData : [])
      } else {
        const payload = await adminsResponse.json().catch(() => null)
        toast.error(payload?.error || 'Failed to load admins')
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setOrderStatistics(statsData || ZERO_STATS)
      } else {
        const payload = await statsResponse.json().catch(() => null)
        toast.error(payload?.error || 'Failed to load statistics')
      }
    } catch {
      toast.error('Could not load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const nextName = user?.name || 'Super Admin'
        setAdminName(nextName)
        setProfileForm({
          name: nextName,
          email: user?.email || '',
          password: '',
        })
      } catch {
        // ignore malformed local storage
      }
    }

    void loadDashboardData()
  }, [])

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return middleAdmins.filter((admin) => {
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && admin.isActive) ||
        (statusFilter === 'inactive' && !admin.isActive)

      if (!statusMatch) return false
      if (!normalizedSearch) return true

      return [admin.name, admin.email].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [middleAdmins, searchTerm, statusFilter])

  const activeAdminsCount = useMemo(
    () => middleAdmins.filter((admin) => admin.isActive).length,
    [middleAdmins]
  )

  const totalOrdersCount = useMemo(
    () =>
      orderStatistics.successfulOrders +
      orderStatistics.failedOrders +
      orderStatistics.pendingOrders +
      orderStatistics.inDeliveryOrders +
      orderStatistics.pausedOrders,
    [orderStatistics]
  )

  const successRate = useMemo(() => {
    if (totalOrdersCount === 0) return 0
    return Math.round((orderStatistics.successfulOrders / totalOrdersCount) * 100)
  }, [orderStatistics.successfulOrders, totalOrdersCount])

  const handleLogout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    await signOut({ callbackUrl: '/', redirect: true })
  }

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Failed to update profile')
        return
      }

      const nextUser = payload?.user
      if (nextUser) {
        localStorage.setItem('user', JSON.stringify(nextUser))
        setAdminName(nextUser.name || adminName)
      }
      setIsProfileOpen(false)
      setProfileForm((prev) => ({ ...prev, password: '' }))
      toast.success('Profile updated')
    } catch {
      toast.error('Could not connect to server')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsCreating(true)
    setCreateError('')

    try {
      const response = await fetch('/api/admin/middle-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setCreateError(payload?.error || 'Failed to create admin')
        return
      }

      toast.success('Middle admin created')
      setCreateFormData(INITIAL_CREATE_FORM)
      setIsCreateModalOpen(false)
      await loadDashboardData(true)
    } catch {
      setCreateError('Could not connect to server')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleAdminStatus = async (admin: Admin) => {
    setMutatingAdminId(admin.id)
    try {
      const response = await fetch(`/api/admin/${admin.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !admin.isActive }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Failed to update admin status')
        return
      }

      toast.success(admin.isActive ? 'Admin paused' : 'Admin activated')
      await loadDashboardData(true)
    } catch {
      toast.error('Could not connect to server')
    } finally {
      setMutatingAdminId(null)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!adminIdPendingDelete) return
    setMutatingAdminId(adminIdPendingDelete)

    try {
      const response = await fetch(`/api/admin/${adminIdPendingDelete}`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Failed to delete admin')
        return
      }

      toast.success('Admin deleted')
      setAdminIdPendingDelete(null)
      await loadDashboardData(true)
    } catch {
      toast.error('Could not connect to server')
    } finally {
      setMutatingAdminId(null)
    }
  }

  const handleResetPassword = async (admin: Admin) => {
    setMutatingAdminId(admin.id)
    try {
      const response = await fetch(`/api/admin/${admin.id}/password`, {
        method: 'POST',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.password) {
        toast.error(payload?.error || 'Failed to reset password')
        return
      }

      setSelectedPassword(payload.password)
      setSelectedPasswordAdminName(admin.name)
      setPasswordModalOpen(true)
      toast.success('New password generated')
    } catch {
      toast.error('Could not connect to server')
    } finally {
      setMutatingAdminId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-command-center opacity-92" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(243,200,135,0.14),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(125,211,252,0.18),transparent_26%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111d]/76 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/7 text-[11px] font-semibold uppercase tracking-[0.22em]">
              AF
            </div>
            <div>
              <p className="font-display text-lg leading-none">Super Admin</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">Control layer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-white/20 bg-white/7 text-white hover:bg-white/12 hover:text-white"
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>

            <LanguageSwitcher />

            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden h-9 rounded-full border-white/20 bg-white/7 px-3 text-white hover:bg-white/12 hover:text-white md:inline-flex"
                >
                  <User className="mr-2 h-4 w-4" />
                  {adminName}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Profile settings</DialogTitle>
                  <DialogDescription>Update your super admin identity and credentials.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile-password">New password (optional)</Label>
                    <Input
                      id="profile-password"
                      type="password"
                      value={profileForm.password}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      t.common.save
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-9 rounded-full border-white/20 bg-white/7 px-3 text-white hover:bg-white/12 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.common.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6"
        >
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Middle admins"
              value={middleAdmins.length}
              detail={`${activeAdminsCount} active`}
              tone="teal"
            />
            <MetricCard
              icon={Activity}
              label="Orders observed"
              value={totalOrdersCount}
              detail={`${orderStatistics.pendingOrders} pending`}
              tone="sky"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Delivery success"
              value={`${successRate}%`}
              detail={`${orderStatistics.successfulOrders} delivered`}
              tone="emerald"
            />
            <MetricCard
              icon={BarChart3}
              label="Payment mix"
              value={`${orderStatistics.cardOrders}/${orderStatistics.cashOrders}`}
              detail="Card / Cash"
              tone="amber"
            />
          </section>

          <Card className="rounded-[1.9rem] border-white/15 bg-[#081426]/74 text-white shadow-[0_35px_90px_-56px_rgba(2,6,23,0.92)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="font-display text-3xl tracking-tight">Platform Governance</CardTitle>
              <CardDescription className="text-slate-300">
                Manage middle admins, system visibility, communication, and audit history in one workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/6 p-2 md:grid-cols-5">
                  <TabsTrigger value="admins" className="h-10 gap-2 rounded-xl">
                    <Users className="h-4 w-4" />
                    {t.admin.admins}
                  </TabsTrigger>
                  <TabsTrigger value="interface" className="h-10 gap-2 rounded-xl">
                    <LayoutDashboard className="h-4 w-4" />
                    {t.admin.interface}
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="h-10 gap-2 rounded-xl">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="statistics" className="h-10 gap-2 rounded-xl">
                    <BarChart3 className="h-4 w-4" />
                    {t.admin.statistics}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="h-10 gap-2 rounded-xl">
                    <History className="h-4 w-4" />
                    {t.admin.history}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admins" className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
                      <div className="relative w-full md:flex-1">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search by name or email"
                          className="h-10 border-white/15 bg-[#09182b] pl-9 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusFilterButton
                          active={statusFilter === 'all'}
                          onClick={() => setStatusFilter('all')}
                          label="All"
                        />
                        <StatusFilterButton
                          active={statusFilter === 'active'}
                          onClick={() => setStatusFilter('active')}
                          label="Active"
                        />
                        <StatusFilterButton
                          active={statusFilter === 'inactive'}
                          onClick={() => setStatusFilter('inactive')}
                          label="Paused"
                        />
                      </div>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="h-10 rounded-full bg-[#f3efe6] px-5 text-[#08111d] hover:bg-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Add middle admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create middle admin</DialogTitle>
                          <DialogDescription>
                            This account gets middle-admin dashboard access immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="create-admin-name">Full name</Label>
                            <Input
                              id="create-admin-name"
                              value={createFormData.name}
                              onChange={(event) =>
                                setCreateFormData((prev) => ({ ...prev, name: event.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="create-admin-email">Email</Label>
                            <Input
                              id="create-admin-email"
                              type="email"
                              value={createFormData.email}
                              onChange={(event) =>
                                setCreateFormData((prev) => ({ ...prev, email: event.target.value }))
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="create-admin-password">Password</Label>
                            <Input
                              id="create-admin-password"
                              type="password"
                              value={createFormData.password}
                              onChange={(event) =>
                                setCreateFormData((prev) => ({ ...prev, password: event.target.value }))
                              }
                              required
                              minLength={8}
                            />
                          </div>

                          {createError ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                              {createError}
                            </div>
                          ) : null}

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                              {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                              {isCreating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                'Create admin'
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {filteredAdmins.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filteredAdmins.map((admin) => {
                        const isBusy = mutatingAdminId === admin.id
                        return (
                          <div
                            key={admin.id}
                            className="rounded-2xl border border-white/10 bg-[#09182b] p-4 shadow-[0_20px_50px_-34px_rgba(2,6,23,0.8)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold">{admin.name}</p>
                                <p className="truncate text-sm text-slate-300">{admin.email}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                                  Created {formatShortDate(admin.createdAt)}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]',
                                  admin.isActive
                                    ? 'border-emerald-300/35 bg-emerald-300/18 text-emerald-100'
                                    : 'border-amber-300/35 bg-amber-300/18 text-amber-100'
                                )}
                              >
                                {admin.isActive ? 'Active' : 'Paused'}
                              </Badge>
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <Button
                                variant="outline"
                                className="h-9 border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => handleResetPassword(admin)}
                                disabled={isBusy}
                              >
                                <KeyRound className="mr-1.5 h-4 w-4" />
                                Password
                              </Button>

                              <Button
                                variant="outline"
                                className="h-9 border-white/15 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                                onClick={() => toggleAdminStatus(admin)}
                                disabled={isBusy}
                              >
                                {admin.isActive ? (
                                  <Pause className="mr-1.5 h-4 w-4" />
                                ) : (
                                  <Play className="mr-1.5 h-4 w-4" />
                                )}
                                {admin.isActive ? 'Pause' : 'Activate'}
                              </Button>

                              <Button
                                variant="outline"
                                className="h-9 border-rose-300/35 bg-rose-300/10 text-rose-100 hover:bg-rose-300/18 hover:text-rose-50"
                                onClick={() => setAdminIdPendingDelete(admin.id)}
                                disabled={isBusy}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/4 px-5 py-8 text-center text-slate-300">
                      No admins found for the current filter.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Delivered" value={orderStatistics.successfulOrders} tone="emerald" />
                    <StatCard label="Failed" value={orderStatistics.failedOrders} tone="rose" />
                    <StatCard label="In Delivery" value={orderStatistics.inDeliveryOrders} tone="sky" />
                    <StatCard label="Pending" value={orderStatistics.pendingOrders} tone="amber" />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-2xl border-white/10 bg-[#09182b] text-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Payment profile</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        <StatRow label="Prepaid" value={orderStatistics.prepaidOrders} />
                        <StatRow label="Unpaid" value={orderStatistics.unpaidOrders} />
                        <StatRow label="Card" value={orderStatistics.cardOrders} />
                        <StatRow label="Cash" value={orderStatistics.cashOrders} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-white/10 bg-[#09182b] text-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Customer cadence</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        <StatRow label="Daily" value={orderStatistics.dailyCustomers} />
                        <StatRow label="Even days" value={orderStatistics.evenDayCustomers} />
                        <StatRow label="Odd days" value={orderStatistics.oddDayCustomers} />
                        <StatRow label="Special prefs" value={orderStatistics.specialPreferenceCustomers} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="rounded-2xl border-white/10 bg-[#09182b] text-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Calories mix</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        <StatRow label="1200 kcal" value={orderStatistics.orders1200} />
                        <StatRow label="1600 kcal" value={orderStatistics.orders1600} />
                        <StatRow label="2000 kcal" value={orderStatistics.orders2000} />
                        <StatRow label="2500 kcal" value={orderStatistics.orders2500} />
                        <StatRow label="3000 kcal" value={orderStatistics.orders3000} />
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-white/10 bg-[#09182b] text-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Basket size</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        <StatRow label="Single item" value={orderStatistics.singleItemOrders} />
                        <StatRow label="Multiple items" value={orderStatistics.multiItemOrders} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="interface">
                  <InterfaceSettings />
                </TabsContent>

                <TabsContent value="chat">
                  <ChatTab />
                </TabsContent>

                <TabsContent value="history">
                  <HistoryTable role="SUPER_ADMIN" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password</DialogTitle>
            <DialogDescription>
              Save this credential for {selectedPasswordAdminName}. The value is shown only once.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted p-4">
            <p className="break-all font-mono text-sm">{selectedPassword}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedPassword) {
                  void navigator.clipboard.writeText(selectedPassword)
                  toast.success('Password copied')
                }
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setPasswordModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(adminIdPendingDelete)}
        onOpenChange={(open) => {
          if (!open) setAdminIdPendingDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete admin</DialogTitle>
            <DialogDescription>
              This action permanently removes the selected middle admin account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminIdPendingDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleDeleteAdmin}
              disabled={Boolean(mutatingAdminId)}
            >
              {mutatingAdminId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string | number
  detail: string
  tone: 'teal' | 'sky' | 'emerald' | 'amber'
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: 'text-teal-200 bg-teal-300/12 border-teal-300/25',
    sky: 'text-sky-200 bg-sky-300/12 border-sky-300/25',
    emerald: 'text-emerald-200 bg-emerald-300/12 border-emerald-300/25',
    amber: 'text-amber-200 bg-amber-300/12 border-amber-300/25',
  }

  return (
    <div className="rounded-2xl border border-white/12 bg-[#081426]/74 p-4 text-white shadow-[0_30px_70px_-52px_rgba(2,6,23,0.95)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        </div>
        <div className={cn('rounded-xl border p-2.5', toneClass[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function StatusFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-9 rounded-full border-white/15 bg-white/6 px-3 text-xs uppercase tracking-[0.14em] text-white hover:bg-white/12 hover:text-white',
        active && 'border-[#f3c887]/35 bg-[#f3c887]/16 text-[#ffe2b5]'
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'rose' | 'sky' | 'amber'
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: 'text-emerald-200',
    rose: 'text-rose-200',
    sky: 'text-sky-200',
    amber: 'text-amber-200',
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#09182b] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn('mt-2 text-3xl font-semibold tracking-tight', toneClass[tone])}>{value}</p>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
