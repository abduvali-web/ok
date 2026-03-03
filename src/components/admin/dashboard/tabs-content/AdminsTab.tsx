'use client'

import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Edit,
  Eye,
  EyeOff,
  Pause,
  Play,
  Plus,
  Search,
  Shield,
  Trash2,
  Truck,
  UserCog,
  Users,
} from 'lucide-react'

import type { Admin } from '@/components/admin/dashboard/types'
import {
  type AdminFormData,
  type AdminRoleOption,
  type EditAdminFormData,
  DEFAULT_ADMIN_FORM,
  DEFAULT_EDIT_ADMIN_FORM,
} from '@/components/admin/dashboard/types'
import { mapLegacyAllowedTabId, type CanonicalTabId } from '@/components/admin/dashboard/tabs'
import { AllowedTabsPicker } from '@/components/admin/dashboard/AllowedTabsPicker'
import { FormField } from '@/components/admin/dashboard/shared/FormField'
import { EntityStatusBadge } from '@/components/admin/dashboard/shared/EntityStatusBadge'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchApi } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'

type AdminStatusFilter = 'all' | 'active' | 'paused'
type AdminRoleFilter = 'all' | AdminRoleOption
type PendingAction = 'password' | 'toggle' | 'delete'

function normalizeAllowedTabsForForm(tabs: string[] | null | undefined) {
  const inputTabs = Array.isArray(tabs) ? tabs : []
  const mapped = inputTabs.map(mapLegacyAllowedTabId)
  return Array.from(new Set(mapped))
}

function toRoleOption(role: string): AdminRoleOption {
  if (role === 'COURIER') return 'COURIER'
  if (role === 'WORKER') return 'WORKER'
  return 'LOW_ADMIN'
}

function parseSalaryInput(raw: string): number {
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminsTab({
  lowAdmins,
  isLowAdminView,
  onRefresh,
  tabsCopy,
}: {
  lowAdmins: Admin[]
  isLowAdminView: boolean
  onRefresh: () => void
  tabsCopy: Record<CanonicalTabId, string>
}) {
  const { t, language } = useLanguage()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('all')
  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({})

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [createFormData, setCreateFormData] = useState<AdminFormData>({ ...DEFAULT_ADMIN_FORM })

  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false)
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [editAdminFormData, setEditAdminFormData] = useState<EditAdminFormData>({ ...DEFAULT_EDIT_ADMIN_FORM })

  const [adminPendingDelete, setAdminPendingDelete] = useState<Admin | null>(null)

  const roleMeta = useMemo(
    () => ({
      LOW_ADMIN: { label: t.admin.lowAdmin, Icon: Shield },
      COURIER: { label: t.courier.title, Icon: Truck },
      WORKER: { label: t.admin.worker, Icon: UserCog },
    }),
    [t.admin.lowAdmin, t.admin.worker, t.courier.title]
  )

  const summary = useMemo(() => {
    let active = 0
    let paused = 0
    let lowAdminCount = 0
    let courierCount = 0
    let workerCount = 0

    for (const admin of lowAdmins) {
      if (admin.isActive) active += 1
      else paused += 1

      if (admin.role === 'COURIER') courierCount += 1
      else if (admin.role === 'WORKER') workerCount += 1
      else lowAdminCount += 1
    }

    return {
      total: lowAdmins.length,
      active,
      paused,
      lowAdminCount,
      courierCount,
      workerCount,
    }
  }, [lowAdmins])

  const salaryFormatter = useMemo(() => {
    if (language === 'uz') return new Intl.NumberFormat('uz-UZ')
    if (language === 'en') return new Intl.NumberFormat('en-US')
    return new Intl.NumberFormat('ru-RU')
  }, [language])

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return [...lowAdmins]
      .filter((admin) => {
        if (roleFilter !== 'all' && toRoleOption(admin.role) !== roleFilter) {
          return false
        }
        if (statusFilter === 'active' && !admin.isActive) {
          return false
        }
        if (statusFilter === 'paused' && admin.isActive) {
          return false
        }
        if (!query) {
          return true
        }
        return admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [lowAdmins, roleFilter, searchTerm, statusFilter])

  const setPendingAction = useCallback((adminId: string, action: PendingAction | null) => {
    setPendingActions((prev) => {
      if (!action) {
        const { [adminId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [adminId]: action }
    })
  }, [])

  const resetCreateForm = useCallback(() => {
    setCreateFormData({ ...DEFAULT_ADMIN_FORM })
    setShowCreatePassword(false)
    setCreateError('')
  }, [])

  const closeEditModal = useCallback(() => {
    setIsEditAdminModalOpen(false)
    setIsUpdatingAdmin(false)
    setShowEditPassword(false)
    setEditingAdmin(null)
    setEditAdminFormData({ ...DEFAULT_EDIT_ADMIN_FORM })
  }, [])

  const handleViewPassword = useCallback(
    async (adminId: string) => {
      setPendingAction(adminId, 'password')
      try {
        const result = await fetchApi<{ password?: string }>(`/api/admin/${adminId}/password`, {
          method: 'POST',
        })
        if (result.ok) {
          toast.info(
            result.data.password
              ? `${t.admin.table.password}: ${result.data.password}`
              : 'Password is hidden. Use reset when required.'
          )
          return
        }
        toast.error(result.error || 'Failed to load password')
      } finally {
        setPendingAction(adminId, null)
      }
    },
    [setPendingAction, t.admin.table.password]
  )

  const handleToggleStatus = useCallback(
    async (admin: Admin) => {
      setPendingAction(admin.id, 'toggle')
      try {
        const result = await fetchApi(`/api/admin/${admin.id}/toggle-status`, {
          method: 'PATCH',
          body: { isActive: !admin.isActive },
        })

        if (!result.ok) {
          toast.error(result.error || 'Failed to update status')
          return
        }

        onRefresh()
        toast.success(admin.isActive ? t.admin.pause : t.admin.resume)
      } finally {
        setPendingAction(admin.id, null)
      }
    },
    [onRefresh, setPendingAction, t.admin.pause, t.admin.resume]
  )

  const handleCreateModalChange = (open: boolean) => {
    setIsCreateModalOpen(open)
    if (!open) {
      resetCreateForm()
    }
  }

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)
    setCreateError('')

    const payload = {
      ...createFormData,
      name: createFormData.name.trim(),
      email: createFormData.email.trim().toLowerCase(),
      password: createFormData.password.trim(),
      allowedTabs: createFormData.role === 'LOW_ADMIN' ? createFormData.allowedTabs : [],
    }

    try {
      const result = await fetchApi('/api/admin/low-admins', {
        method: 'POST',
        body: payload,
      })

      if (!result.ok) {
        setCreateError(result.error || 'Failed to create admin')
        return
      }

      toast.success(t.admin.createAdmin)
      onRefresh()
      handleCreateModalChange(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin)
    setShowEditPassword(false)
    setEditAdminFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: toRoleOption(admin.role),
      isActive: admin.isActive,
      allowedTabs: normalizeAllowedTabsForForm(admin.allowedTabs),
      salary: admin.salary || 0,
    })
    setIsEditAdminModalOpen(true)
  }

  const handleUpdateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingAdmin) return

    setIsUpdatingAdmin(true)
    const payload = {
      name: editAdminFormData.name.trim(),
      email: editAdminFormData.email.trim().toLowerCase(),
      role: editAdminFormData.role,
      isActive: editAdminFormData.isActive,
      allowedTabs: editAdminFormData.role === 'LOW_ADMIN' ? editAdminFormData.allowedTabs : [],
      salary: editAdminFormData.salary,
      ...(editAdminFormData.password.trim() ? { password: editAdminFormData.password.trim() } : {}),
    }

    try {
      const result = await fetchApi(`/api/admin/low-admins/${editingAdmin.id}`, {
        method: 'PATCH',
        body: payload,
      })

      if (!result.ok) {
        toast.error(result.error, { description: result.details || undefined })
        return
      }

      toast.success(t.common.save)
      onRefresh()
      closeEditModal()
    } finally {
      setIsUpdatingAdmin(false)
    }
  }

  const confirmDeleteAdmin = async () => {
    if (!adminPendingDelete) return

    const adminId = adminPendingDelete.id
    setPendingAction(adminId, 'delete')
    try {
      const result = await fetchApi(`/api/admin/low-admins/${adminId}`, { method: 'DELETE' })
      if (!result.ok) {
        toast.error(result.error || 'Failed to delete admin')
        return
      }

      toast.success(t.admin.delete)
      onRefresh()
      setAdminPendingDelete(null)
    } finally {
      setPendingAction(adminId, null)
    }
  }

  const renderActionButtons = (admin: Admin, fullWidth = false) => {
    const pendingAction = pendingActions[admin.id]
    const baseClass = fullWidth ? 'w-full justify-start' : ''

    return (
      <div className={cn(fullWidth ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-4' : 'flex flex-wrap items-center gap-2')}>
        <Button
          variant="outline"
          size="sm"
          className={baseClass}
          disabled={Boolean(pendingAction)}
          onClick={() => handleViewPassword(admin.id)}
        >
          <Eye className="size-4" />
          {pendingAction === 'password' ? t.common.loading : t.admin.table.password}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={baseClass}
          disabled={Boolean(pendingAction)}
          onClick={() => handleOpenEditAdmin(admin)}
        >
          <Edit className="size-4" />
          {t.admin.edit}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={baseClass}
          disabled={Boolean(pendingAction)}
          onClick={() => handleToggleStatus(admin)}
        >
          {admin.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
          {pendingAction === 'toggle' ? t.common.loading : admin.isActive ? t.admin.pause : t.admin.resume}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className={baseClass}
          disabled={Boolean(pendingAction)}
          onClick={() => setAdminPendingDelete(admin)}
        >
          <Trash2 className="size-4" />
          {pendingAction === 'delete' ? t.common.loading : t.admin.delete}
        </Button>
      </div>
    )
  }

  return (
    <>
      <TabsContent value="admins" className="space-y-6">
        <Card className="glass-card border-none overflow-hidden">
          <CardHeader className="space-y-6 border-b border-border/60 bg-gradient-to-r from-primary/8 via-accent/40 to-background">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <CardTitle>{t.admin.manageLowAdmins}</CardTitle>
                <CardDescription>{t.admin.manageLowAdminsDesc}</CardDescription>
              </div>

              {!isLowAdminView && (
                <Dialog open={isCreateModalOpen} onOpenChange={handleCreateModalChange}>
                  <DialogTrigger asChild>
                    <Button className="w-full xl:w-auto">
                      <Plus className="size-4" />
                      {t.admin.add}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[640px]">
                    <DialogHeader>
                      <DialogTitle>{t.admin.createAdmin}</DialogTitle>
                      <DialogDescription>{t.admin.manageLowAdminsDesc}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateAdmin} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label={t.admin.table.name} htmlFor="create-admin-name">
                          <Input
                            id="create-admin-name"
                            value={createFormData.name}
                            onChange={(event) => setCreateFormData((prev) => ({ ...prev, name: event.target.value }))}
                            required
                          />
                        </FormField>

                        <FormField label={t.auth.email} htmlFor="create-admin-email">
                          <Input
                            id="create-admin-email"
                            type="email"
                            value={createFormData.email}
                            onChange={(event) =>
                              setCreateFormData((prev) => ({ ...prev, email: event.target.value }))
                            }
                            required
                          />
                        </FormField>

                        <FormField
                          label={t.admin.table.password}
                          htmlFor="create-admin-password"
                          hint={createFormData.role === 'WORKER' ? t.admin.leaveEmpty : undefined}
                        >
                          <div className="relative">
                            <Input
                              id="create-admin-password"
                              type={showCreatePassword ? 'text' : 'password'}
                              value={createFormData.password}
                              onChange={(event) =>
                                setCreateFormData((prev) => ({ ...prev, password: event.target.value }))
                              }
                              required={createFormData.role !== 'WORKER'}
                              minLength={createFormData.role === 'WORKER' ? undefined : 6}
                              className="pr-11"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1 h-8 w-8 p-0"
                              aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowCreatePassword((prev) => !prev)}
                            >
                              {showCreatePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </FormField>

                        <FormField label={t.admin.table.role} htmlFor="create-admin-role">
                          <Select
                            value={createFormData.role}
                            onValueChange={(value) =>
                              setCreateFormData((prev) => ({
                                ...prev,
                                role: value as AdminRoleOption,
                                allowedTabs: value === 'LOW_ADMIN' ? prev.allowedTabs : [],
                              }))
                            }
                          >
                            <SelectTrigger id="create-admin-role" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW_ADMIN">{roleMeta.LOW_ADMIN.label}</SelectItem>
                              <SelectItem value="COURIER">{roleMeta.COURIER.label}</SelectItem>
                              <SelectItem value="WORKER">{roleMeta.WORKER.label}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField label={t.finance.salary} htmlFor="create-admin-salary">
                          <Input
                            id="create-admin-salary"
                            type="number"
                            min={0}
                            value={createFormData.salary}
                            onChange={(event) =>
                              setCreateFormData((prev) => ({
                                ...prev,
                                salary: parseSalaryInput(event.target.value),
                              }))
                            }
                            placeholder="0"
                          />
                        </FormField>
                      </div>

                      {createFormData.role === 'LOW_ADMIN' && (
                        <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                          <Label className="mb-3 block text-sm font-semibold">{t.admin.interface}</Label>
                          <AllowedTabsPicker
                            idPrefix="create-tab"
                            value={createFormData.allowedTabs}
                            onChange={(next) => setCreateFormData((prev) => ({ ...prev, allowedTabs: next }))}
                            copy={tabsCopy}
                          />
                        </div>
                      )}

                      {createError && (
                        <Alert variant="destructive">
                          <AlertDescription>{createError}</AlertDescription>
                        </Alert>
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleCreateModalChange(false)}>
                          {t.common.cancel}
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? t.common.loading : t.admin.create}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{t.admin.admins}</p>
                  <Users className="size-4 text-primary" />
                </div>
                <p className="mt-1 text-2xl font-semibold">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{t.admin.table.active}</p>
                  <Play className="size-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-2xl font-semibold">{summary.active}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{t.admin.table.paused}</p>
                  <Pause className="size-4 text-amber-600" />
                </div>
                <p className="mt-1 text-2xl font-semibold">{summary.paused}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/70 px-4 py-3">
                <p className="text-sm text-muted-foreground">{t.admin.table.role}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{roleMeta.LOW_ADMIN.label}: {summary.lowAdminCount}</Badge>
                  <Badge variant="outline">{roleMeta.COURIER.label}: {summary.courierCount}</Badge>
                  <Badge variant="outline">{roleMeta.WORKER.label}: {summary.workerCount}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.admin.searchPlaceholder}
                  className="pl-9"
                  aria-label={t.admin.search}
                />
              </div>

              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AdminRoleFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.admin.table.role} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.all}</SelectItem>
                  <SelectItem value="LOW_ADMIN">{roleMeta.LOW_ADMIN.label}</SelectItem>
                  <SelectItem value="COURIER">{roleMeta.COURIER.label}</SelectItem>
                  <SelectItem value="WORKER">{roleMeta.WORKER.label}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AdminStatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.common.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.all}</SelectItem>
                  <SelectItem value="active">{t.admin.table.active}</SelectItem>
                  <SelectItem value="paused">{t.admin.table.paused}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredAdmins.length} / {lowAdmins.length}
            </p>

            <div className="space-y-3">
              {filteredAdmins.map((admin) => {
                const normalizedRole = toRoleOption(admin.role)
                const roleConfig = roleMeta[normalizedRole]
                const salaryLabel = admin.salary && admin.salary > 0 ? `${salaryFormatter.format(admin.salary)} UZS` : null
                const RoleIcon = roleConfig.Icon

                return (
                  <article
                    key={admin.id}
                    className="group rounded-2xl border border-border/80 bg-card/85 p-4 shadow-smooth transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elegant"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11 ring-2 ring-background">
                          <AvatarFallback
                            className={cn(
                              'font-semibold',
                              admin.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold leading-tight">{admin.name}</p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1 border-primary/25 bg-primary/8 text-primary">
                              <RoleIcon className="size-3.5" />
                              {roleConfig.label}
                            </Badge>
                            <EntityStatusBadge
                              isActive={admin.isActive}
                              activeLabel={t.admin.table.active}
                              inactiveLabel={t.admin.table.paused}
                            />
                            {salaryLabel && <Badge variant="secondary">{salaryLabel}</Badge>}
                          </div>
                        </div>
                      </div>

                      {!isLowAdminView && renderActionButtons(admin, true)}
                    </div>
                  </article>
                )
              })}
            </div>

            {filteredAdmins.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                <Search className="mx-auto mb-3 size-5 text-muted-foreground" />
                <p className="font-medium">No users match current filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Adjust search, role, or status filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={isEditAdminModalOpen} onOpenChange={(open) => (!open ? closeEditModal() : setIsEditAdminModalOpen(true))}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t.admin.edit}</DialogTitle>
            <DialogDescription>{editingAdmin?.email}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAdmin} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t.admin.table.name} htmlFor="edit-admin-name">
                <Input
                  id="edit-admin-name"
                  value={editAdminFormData.name}
                  onChange={(event) => setEditAdminFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </FormField>

              <FormField label={t.auth.email} htmlFor="edit-admin-email">
                <Input
                  id="edit-admin-email"
                  type="email"
                  value={editAdminFormData.email}
                  onChange={(event) => setEditAdminFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </FormField>

              <FormField
                label={t.admin.table.password}
                htmlFor="edit-admin-password"
                hint={t.admin.leaveEmpty}
              >
                <div className="relative">
                  <Input
                    id="edit-admin-password"
                    type={showEditPassword ? 'text' : 'password'}
                    value={editAdminFormData.password}
                    onChange={(event) =>
                      setEditAdminFormData((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowEditPassword((prev) => !prev)}
                  >
                    {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </FormField>

              <FormField label={t.admin.table.role} htmlFor="edit-admin-role">
                <Select
                  value={editAdminFormData.role}
                  onValueChange={(value) =>
                    setEditAdminFormData((prev) => ({
                      ...prev,
                      role: value as AdminRoleOption,
                      allowedTabs: value === 'LOW_ADMIN' ? prev.allowedTabs : [],
                    }))
                  }
                >
                  <SelectTrigger id="edit-admin-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW_ADMIN">{roleMeta.LOW_ADMIN.label}</SelectItem>
                    <SelectItem value="COURIER">{roleMeta.COURIER.label}</SelectItem>
                    <SelectItem value="WORKER">{roleMeta.WORKER.label}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t.finance.salary} htmlFor="edit-admin-salary">
                <Input
                  id="edit-admin-salary"
                  type="number"
                  min={0}
                  value={editAdminFormData.salary || 0}
                  onChange={(event) =>
                    setEditAdminFormData((prev) => ({
                      ...prev,
                      salary: parseSalaryInput(event.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{t.common.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {editAdminFormData.isActive ? t.admin.table.active : t.admin.table.paused}
                  </p>
                </div>
                <Checkbox
                  id="edit-admin-active"
                  checked={editAdminFormData.isActive}
                  onCheckedChange={(checked) =>
                    setEditAdminFormData((prev) => ({ ...prev, isActive: checked === true }))
                  }
                />
              </div>
            </div>

            {editAdminFormData.role === 'LOW_ADMIN' && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <Label className="mb-3 block text-sm font-semibold">{t.admin.interface}</Label>
                <AllowedTabsPicker
                  idPrefix="edit-tab"
                  value={editAdminFormData.allowedTabs}
                  onChange={(next) => setEditAdminFormData((prev) => ({ ...prev, allowedTabs: next }))}
                  copy={tabsCopy}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditModal}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isUpdatingAdmin}>
                {isUpdatingAdmin ? t.common.loading : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(adminPendingDelete)} onOpenChange={(open) => !open && setAdminPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {adminPendingDelete ? `${t.admin.table.name}: ${adminPendingDelete.name}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                void confirmDeleteAdmin()
              }}
            >
              {adminPendingDelete && pendingActions[adminPendingDelete.id] === 'delete'
                ? t.common.loading
                : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
