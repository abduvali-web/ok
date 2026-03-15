'use client'

import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Edit, Pause, Play, Plus, Search, Trash2, Users } from 'lucide-react'

import type { Admin } from '@/components/admin/dashboard/types'
import {
  type AdminRoleOption,
  type EditAdminFormData,
  DEFAULT_EDIT_ADMIN_FORM,
} from '@/components/admin/dashboard/types'
import { mapLegacyAllowedTabId, type CanonicalTabId } from '@/components/admin/dashboard/tabs'
import { AllowedTabsPicker } from '@/components/admin/dashboard/AllowedTabsPicker'
import { FormField } from '@/components/admin/dashboard/shared/FormField'
import { EntityStatusBadge } from '@/components/admin/dashboard/shared/EntityStatusBadge'
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchApi } from '@/lib/api-client'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TabsContent } from '@/components/ui/tabs'

type AdminStatusFilter = 'all' | 'active' | 'paused'
type AdminRoleFilter = 'all' | AdminRoleOption
type PendingAction = 'toggle' | 'delete'
type FormMode = 'create' | 'edit'

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

export function AdminsTab({
  lowAdmins,
  isLowAdminView,
  onRefresh,
  tabsCopy,
  orders = [],
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedDateLabel,
  profileUiText = {} as any,
}: {
  lowAdmins: Admin[]
  isLowAdminView: boolean
  onRefresh: () => void
  tabsCopy: Record<CanonicalTabId, string>
  orders?: any[]
  selectedDate?: Date | null
  applySelectedDate?: (date: Date | null) => void
  shiftSelectedDate?: (days: number) => void
  selectedDateLabel?: string
  profileUiText?: any
}) {
  const { t, language } = useLanguage()
  const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('all')
  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({})

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState<EditAdminFormData>({ ...DEFAULT_EDIT_ADMIN_FORM })

  const [adminPendingDelete, setAdminPendingDelete] = useState<Admin | null>(null)

  const roleLabel = useMemo(
    () => ({
      LOW_ADMIN: t.admin.lowAdmin,
      COURIER: t.courier.title,
      WORKER: t.admin.worker,
    }),
    [t.admin.lowAdmin, t.admin.worker, t.courier.title]
  )

  const salaryFormatter = useMemo(() => {
    if (language === 'uz') return new Intl.NumberFormat('uz-UZ')
    if (language === 'en') return new Intl.NumberFormat('en-US')
    return new Intl.NumberFormat('ru-RU')
  }, [language])

  const summary = useMemo(() => {
    let active = 0
    let paused = 0

    for (const admin of lowAdmins) {
      if (admin.isActive) active += 1
      else paused += 1
    }

    return {
      total: lowAdmins.length,
      active,
      paused,
    }
  }, [lowAdmins])

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return [...lowAdmins]
      .filter((admin) => {
        if (roleFilter !== 'all' && toRoleOption(admin.role) !== roleFilter) return false
        if (statusFilter === 'active' && !admin.isActive) return false
        if (statusFilter === 'paused' && admin.isActive) return false
        if (!query) return true
        return admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [lowAdmins, roleFilter, searchTerm, statusFilter])

  const adminStats = useMemo(() => {
    const stats: Record<string, { delivered: number, notDelivered: number }> = {}
    lowAdmins.forEach((a) => {
      stats[a.id] = { delivered: 0, notDelivered: 0 }
    })
    
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        if (!order.courierId) return
        if (!stats[order.courierId]) stats[order.courierId] = { delivered: 0, notDelivered: 0 }
        
        const status = order.orderStatus
        if (status === 'DELIVERED') {
          stats[order.courierId].delivered++
        } else if (status !== 'NEW' && status !== 'CANCELED') {
          stats[order.courierId].notDelivered++
        }
      })
    }
    return stats
  }, [lowAdmins, orders])

  const setPendingAction = useCallback((adminId: string, action: PendingAction | null) => {
    setPendingActions((prev) => {
      if (!action) {
        const { [adminId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [adminId]: action }
    })
  }, [])

  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_EDIT_ADMIN_FORM })
    setEditingAdmin(null)
    setFormError('')
    setIsSubmitting(false)
  }, [])

  const handleFormOpenChange = useCallback(
    (open: boolean) => {
      setIsFormModalOpen(open)
      if (!open) resetForm()
    },
    [resetForm]
  )

  const openCreateModal = () => {
    setFormMode('create')
    setFormData({ ...DEFAULT_EDIT_ADMIN_FORM })
    setIsFormModalOpen(true)
  }

  const openEditModal = (admin: Admin) => {
    setFormMode('edit')
    setEditingAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: toRoleOption(admin.role),
      salary: admin.salary || 0,
      isActive: admin.isActive,
      allowedTabs: normalizeAllowedTabsForForm(admin.allowedTabs),
    })
    setIsFormModalOpen(true)
  }

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
      } finally {
        setPendingAction(admin.id, null)
      }
    },
    [onRefresh, setPendingAction]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (formMode === 'edit' && !editingAdmin) return

    setIsSubmitting(true)
    setFormError('')

    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const password = formData.password.trim()

    if (!name || !email) {
      setFormError('Name and email are required')
      setIsSubmitting(false)
      return
    }

    if (formMode === 'create' && formData.role !== 'WORKER' && password.length < 6) {
      setFormError('Password must be at least 6 characters')
      setIsSubmitting(false)
      return
    }

    if (formMode === 'edit' && password && password.length < 6) {
      setFormError('Password must be at least 6 characters')
      setIsSubmitting(false)
      return
    }

    const basePayload = {
      name,
      email,
      role: formData.role,
      salary: formData.salary,
      allowedTabs: formData.role === 'LOW_ADMIN' ? formData.allowedTabs : [],
    }

    try {
      if (formMode === 'create') {
        const result = await fetchApi('/api/admin/low-admins', {
          method: 'POST',
          body: {
            ...basePayload,
            ...(password ? { password } : {}),
          },
        })

        if (!result.ok) {
          setFormError(result.error || 'Failed to create admin')
          return
        }
      } else {
        const result = await fetchApi(`/api/admin/low-admins/${editingAdmin!.id}`, {
          method: 'PATCH',
          body: {
            ...basePayload,
            isActive: formData.isActive,
            ...(password ? { password } : {}),
          },
        })

        if (!result.ok) {
          setFormError(result.error || 'Failed to update admin')
          return
        }
      }

      onRefresh()
      handleFormOpenChange(false)
      toast.success(formMode === 'create' ? t.admin.createAdmin : t.common.save)
    } finally {
      setIsSubmitting(false)
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

      onRefresh()
      setAdminPendingDelete(null)
    } finally {
      setPendingAction(adminId, null)
    }
  }

  return (
    <>
      <TabsContent value="admins" className="space-y-4">
        <Card className="border bg-card">
          <CardHeader className="space-y-4 pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>{t.admin.manageLowAdmins}</CardTitle>
                <CardDescription>{t.admin.manageLowAdminsDesc}</CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {applySelectedDate && shiftSelectedDate && selectedDateLabel && profileUiText && (
                  <CalendarDateSelector
                    selectedDate={selectedDate || null}
                    applySelectedDate={applySelectedDate}
                    shiftSelectedDate={shiftSelectedDate}
                    selectedDateLabel={selectedDateLabel}
                    locale={calendarLocale}
                    profileUiText={profileUiText}
                  />
                )}
                {!isLowAdminView && (
                  <Button onClick={openCreateModal} className="h-9 gap-2 px-3">
                    <Plus className="size-4" />
                    {t.admin.create}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.admin.searchPlaceholder}
                  className="h-9 pl-8"
                />
              </div>

              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as AdminRoleFilter)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t.admin.table.role} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.all}</SelectItem>
                  <SelectItem value="LOW_ADMIN">{roleLabel.LOW_ADMIN}</SelectItem>
                  <SelectItem value="COURIER">{roleLabel.COURIER}</SelectItem>
                  <SelectItem value="WORKER">{roleLabel.WORKER}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AdminStatusFilter)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t.common.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.all}</SelectItem>
                  <SelectItem value="active">{t.admin.table.active}</SelectItem>
                  <SelectItem value="paused">{t.admin.table.paused}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex h-9 items-center justify-end rounded-md border bg-muted/20 px-3 text-xs text-muted-foreground">
                {filteredAdmins.length}/{summary.total} · {t.admin.table.active}: {summary.active} · {t.admin.table.paused}: {summary.paused}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="h-9">
                    <TableHead className="w-[200px]">{t.admin.table.name}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[150px]">{t.admin.table.role}</TableHead>
                    <TableHead className="w-[100px]">Delivered</TableHead>
                    <TableHead className="w-[120px]">Not Delivered</TableHead>
                    <TableHead className="w-[130px]">{t.common.status}</TableHead>
                    <TableHead className="w-[130px]">{t.finance.salary}</TableHead>
                    <TableHead className="w-[260px] text-right">{t.admin.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredAdmins.map((admin) => {
                    const normalizedRole = toRoleOption(admin.role)
                    const pendingAction = pendingActions[admin.id]

                    return (
                      <TableRow key={admin.id} className="h-10">
                        <TableCell className="py-1.5 font-medium">{admin.name}</TableCell>
                        <TableCell className="py-1.5 text-muted-foreground">{admin.email}</TableCell>
                        <TableCell className="py-1.5">{roleLabel[normalizedRole]}</TableCell>
                        <TableCell className="py-1.5 font-medium text-emerald-600">
                          {normalizedRole === 'COURIER' ? adminStats[admin.id]?.delivered || 0 : '-'}
                        </TableCell>
                        <TableCell className="py-1.5 font-medium text-rose-600">
                          {normalizedRole === 'COURIER' ? adminStats[admin.id]?.notDelivered || 0 : '-'}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <EntityStatusBadge
                            isActive={admin.isActive}
                            activeLabel={t.admin.table.active}
                            inactiveLabel={t.admin.table.paused}
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          {admin.salary && admin.salary > 0 ? `${salaryFormatter.format(admin.salary)} UZS` : '-'}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {!isLowAdminView && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => openEditModal(admin)}
                                disabled={Boolean(pendingAction)}
                              >
                                <Edit className="size-4" />
                                {t.admin.edit}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleToggleStatus(admin)}
                                disabled={Boolean(pendingAction)}
                              >
                                {admin.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {admin.isActive ? t.admin.pause : t.admin.resume}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-destructive/40 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setAdminPendingDelete(admin)}
                                disabled={Boolean(pendingAction)}
                              >
                                <Trash2 className="size-4" />
                                {t.admin.delete}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {filteredAdmins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <Users className="size-4" />
                          No admins found for current filters
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={isFormModalOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? t.admin.createAdmin : t.admin.edit}</DialogTitle>
            <DialogDescription>
              {formMode === 'create' ? t.admin.manageLowAdminsDesc : editingAdmin?.email}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label={t.admin.table.name} htmlFor="admin-form-name">
                <Input
                  id="admin-form-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </FormField>

              <FormField label={t.auth.email} htmlFor="admin-form-email">
                <Input
                  id="admin-form-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </FormField>

              <FormField
                label={t.admin.table.password}
                htmlFor="admin-form-password"
                hint={formMode === 'edit' ? t.admin.leaveEmpty : undefined}
              >
                <Input
                  id="admin-form-password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  required={formMode === 'create' && formData.role !== 'WORKER'}
                />
              </FormField>

              <FormField label={t.admin.table.role} htmlFor="admin-form-role">
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: value as AdminRoleOption,
                      allowedTabs: value === 'LOW_ADMIN' ? prev.allowedTabs : [],
                    }))
                  }
                >
                  <SelectTrigger id="admin-form-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW_ADMIN">{roleLabel.LOW_ADMIN}</SelectItem>
                    <SelectItem value="COURIER">{roleLabel.COURIER}</SelectItem>
                    <SelectItem value="WORKER">{roleLabel.WORKER}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t.finance.salary} htmlFor="admin-form-salary">
                <Input
                  id="admin-form-salary"
                  type="number"
                  min={0}
                  value={formData.salary || 0}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      salary: parseSalaryInput(event.target.value),
                    }))
                  }
                />
              </FormField>
            </div>

            {formData.role === 'LOW_ADMIN' && (
              <div className="rounded-md border bg-muted/20 p-3">
                <Label className="mb-2 block text-sm font-medium">{t.admin.interface}</Label>
                <AllowedTabsPicker
                  idPrefix="admin-form-tab"
                  value={formData.allowedTabs}
                  onChange={(next) => setFormData((prev) => ({ ...prev, allowedTabs: next }))}
                  copy={tabsCopy}
                />
              </div>
            )}

            {formMode === 'edit' && (
              <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
                <div className="text-sm">
                  <p className="font-medium">{t.common.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.isActive ? t.admin.table.active : t.admin.table.paused}
                  </p>
                </div>
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked === true }))
                  }
                />
              </div>
            )}

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleFormOpenChange(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.common.loading : formMode === 'create' ? t.admin.create : t.common.save}
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
