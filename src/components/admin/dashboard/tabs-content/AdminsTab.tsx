'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CookingPot, Edit, Pause, Play, Plus, RotateCcw, Search, Trash2, Users } from 'lucide-react'

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
import type { DateRange } from 'react-day-picker'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchApi } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { IconButton } from '@/components/ui/icon-button'
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
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
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
  selectedPeriod?: DateRange | undefined
  applySelectedPeriod?: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  profileUiText?: any
}) {
  const { t, language } = useLanguage()
  const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const [searchTerm, setSearchTerm] = useState('')
  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({})
  const [selectedAdminIds, setSelectedAdminIds] = useState<Set<string>>(() => new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isBulkMutating, setIsBulkMutating] = useState(false)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState<EditAdminFormData>({ ...DEFAULT_EDIT_ADMIN_FORM })

  // Mobile UX: allow a "swipe down to close" gesture on the admin create/edit dialog.
  const swipeStartRef = useRef<{ y: number; x: number; at: number } | null>(null)
  const swipeLockRef = useRef<'none' | 'close' | 'ignore'>('none')
  const [swipeOffset, setSwipeOffset] = useState(0)

  useEffect(() => {
    setSelectedAdminIds(new Set())
  }, [searchTerm])

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

  const [salaryLedgerByAdminId, setSalaryLedgerByAdminId] = useState<
    Record<string, { balance: number; paid: number; accrued: number; days: number }>
  >({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const controller = new AbortController()
    const asOf = (selectedPeriod?.to ?? selectedPeriod?.from ?? selectedDate ?? new Date()).toISOString()

    void fetch(`/api/admin/finance/admin-balances?asOf=${encodeURIComponent(asOf)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return
        const rows: any[] = Array.isArray(data?.admins) ? data.admins : []
        const next: Record<string, { balance: number; paid: number; accrued: number; days: number }> = {}
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue
          const id = (row as any).id
          if (typeof id !== 'string') continue
          const balance = Number((row as any).balance ?? 0)
          const paid = Number((row as any).paid ?? 0)
          const accrued = Number((row as any).accrued ?? 0)
          const days = Number((row as any).days ?? 0)
          next[id] = {
            balance: Number.isFinite(balance) ? balance : 0,
            paid: Number.isFinite(paid) ? paid : 0,
            accrued: Number.isFinite(accrued) ? accrued : 0,
            days: Number.isFinite(days) ? days : 0,
          }
        }
        setSalaryLedgerByAdminId(next)
      })
      .catch(() => {
        // ignore transient loading failures
      })

    return () => controller.abort()
  }, [selectedDate, selectedPeriod])

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return [...lowAdmins]
      .filter((admin) => {
        if (!query) return true
        return admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [lowAdmins, searchTerm])

  const selectedAdminsSnapshot = useMemo(
    () => filteredAdmins.filter((admin) => selectedAdminIds.has(admin.id)),
    [filteredAdmins, selectedAdminIds]
  )

  const shouldPauseSelectedAdmins = useMemo(() => {
    if (selectedAdminsSnapshot.length === 0) return false
    return selectedAdminsSnapshot.every((admin) => admin.isActive)
  }, [selectedAdminsSnapshot])

  const toggleAdminSelection = useCallback((adminId: string) => {
    setSelectedAdminIds((prev) => {
      const next = new Set(prev)
      if (next.has(adminId)) next.delete(adminId)
      else next.add(adminId)
      return next
    })
  }, [])

  const toggleSelectAllFilteredAdmins = useCallback((checked: boolean) => {
    setSelectedAdminIds(() => {
      if (!checked) return new Set()
      return new Set(filteredAdmins.map((admin) => admin.id))
    })
  }, [filteredAdmins])

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

  const handleBulkToggleStatus = useCallback(async () => {
    if (selectedAdminsSnapshot.length === 0) return
    const targetIsActive = shouldPauseSelectedAdmins ? false : true

    setIsBulkMutating(true)
    try {
      for (const admin of selectedAdminsSnapshot) {
        setPendingAction(admin.id, 'toggle')
        try {
          const result = await fetchApi(`/api/admin/${admin.id}/toggle-status`, {
            method: 'PATCH',
            body: { isActive: targetIsActive },
          })
          if (!result.ok) {
            toast.error(result.error || t.common.error)
          }
        } finally {
          setPendingAction(admin.id, null)
        }
      }

      onRefresh()
      setSelectedAdminIds(new Set())
    } finally {
      setIsBulkMutating(false)
    }
  }, [onRefresh, selectedAdminsSnapshot, setPendingAction, shouldPauseSelectedAdmins, t.common.error])

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

  const confirmBulkDeleteAdmins = useCallback(async () => {
    if (selectedAdminsSnapshot.length === 0) return

    setIsBulkMutating(true)
    try {
      for (const admin of selectedAdminsSnapshot) {
        setPendingAction(admin.id, 'delete')
        try {
          const result = await fetchApi(`/api/admin/low-admins/${admin.id}`, { method: 'DELETE' })
          if (!result.ok) {
            toast.error(result.error || t.common.error)
          }
        } finally {
          setPendingAction(admin.id, null)
        }
      }

      onRefresh()
      setSelectedAdminIds(new Set())
      setIsBulkDeleteOpen(false)
    } finally {
      setIsBulkMutating(false)
    }
  }, [onRefresh, selectedAdminsSnapshot, setPendingAction, t.common.error])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.resolve(onRefresh())
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  return (
    <>
      <TabsContent value="admins" className="h-full">
        <div className="content-card h-full flex flex-col gap-6 md:gap-10 relative overflow-hidden px-4 md:px-14 py-6 md:py-10 transition-colors duration-300">
          {/* Background Watermark */}
          <div className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none">
            <CookingPot className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2 relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight">
              {t.admin.manageLowAdmins}
            </h2>
            <p className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium">
              {t.admin.manageLowAdminsDesc}
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
            <div className="relative flex-1 bg-gourmet-orange rounded-full shadow-xl border-b-4 border-black/20 p-1">
              <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text mr-3 md:mr-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.admin.searchPlaceholder}
                  aria-label={t.admin.searchPlaceholder}
                  className="w-full bg-transparent py-0 text-base md:text-lg focus:outline-none text-gourmet-ink dark:text-dark-text placeholder:text-gourmet-ink dark:placeholder:text-dark-text"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
              {applySelectedDate &&
              (applySelectedPeriod ? Boolean(selectedPeriodLabel) : Boolean(selectedDateLabel)) &&
              profileUiText ? (
                <div className="flex flex-shrink-0 items-center gap-2">
                  <CalendarDateSelector
                    selectedDate={selectedDate || null}
                    applySelectedDate={applySelectedDate}
                    shiftSelectedDate={shiftSelectedDate}
                    selectedDateLabel={selectedPeriodLabel ?? selectedDateLabel}
                    selectedPeriod={selectedPeriod}
                    applySelectedPeriod={applySelectedPeriod}
                    locale={calendarLocale}
                    profileUiText={profileUiText}
                  />
                </div>
              ) : null}

              {!isLowAdminView ? (
                <>
                  <Button
                    type="button"
                    onClick={openCreateModal}
                    variant="ghost"
                    className="w-[50px] h-[50px] p-1 bg-dark-green rounded-full shadow-xl border-b-4 border-black/20"
                    aria-label={t.admin.create}
                    title={t.admin.create}
                  >
                    <span className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-[50px] h-[50px] p-1 bg-dark-green rounded-full shadow-xl border-b-4 border-black/20"
                    onClick={() => void handleBulkToggleStatus()}
                    disabled={selectedAdminIds.size === 0 || isBulkMutating}
                    aria-label={shouldPauseSelectedAdmins ? t.admin.pause : t.admin.resume}
                    title={shouldPauseSelectedAdmins ? t.admin.pause : t.admin.resume}
                  >
                    <span className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      {shouldPauseSelectedAdmins ? (
                        <Pause className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                      ) : (
                        <Play className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                      )}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-[50px] h-[50px] p-1 bg-dark-green rounded-full shadow-xl border-b-4 border-black/20"
                    onClick={() => setIsBulkDeleteOpen(true)}
                    disabled={selectedAdminIds.size === 0 || isBulkMutating}
                    aria-label={`${t.admin.deleteSelected} (${selectedAdminIds.size})`}
                    title={`${t.admin.deleteSelected} (${selectedAdminIds.size})`}
                  >
                    <span className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      {isBulkMutating ? (
                        <span className="text-xs font-bold text-gourmet-ink dark:text-dark-text">{t.common.loading}</span>
                      ) : (
                        <Trash2 className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                      )}
                    </span>
                  </Button>
                </>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                className="w-[50px] h-[50px] p-1 bg-dark-green rounded-full shadow-xl border-b-4 border-black/20"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                aria-label={profileUiText?.refresh ?? 'Refresh'}
                title={profileUiText?.refresh ?? 'Refresh'}
              >
                <span className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <RotateCcw className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isRefreshing && 'animate-spin')} />
                </span>
              </Button>

              {!isLowAdminView && selectedAdminIds.size > 0 ? (
                <span className="flex-shrink-0 px-4 py-2 rounded-full bg-gourmet-cream/60 dark:bg-dark-green/20 border-2 border-dashed border-gourmet-green/30 dark:border-white/10 font-black text-xs uppercase tracking-widest text-gourmet-ink dark:text-dark-text">
                  {selectedAdminIds.size}
                </span>
              ) : null}
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-col gap-4 md:gap-6 relative z-10 pb-10">
            <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20">
                      {!isLowAdminView && (
                        <TableHead className="w-[44px] px-2">
                          <Checkbox
                            aria-label="Select all admins"
                            checked={
                              filteredAdmins.length > 0 && selectedAdminsSnapshot.length === filteredAdmins.length
                                ? true
                                : selectedAdminsSnapshot.length > 0
                                  ? 'indeterminate'
                                  : false
                            }
                            onCheckedChange={(checked) => toggleSelectAllFilteredAdmins(checked === true)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[200px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        {t.admin.table.name}
                      </TableHead>
                      <TableHead className="text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        Email
                      </TableHead>
                      <TableHead className="w-[150px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        {t.admin.table.role}
                      </TableHead>
                      <TableHead className="w-[100px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        Delivered
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        Not Delivered
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        {t.common.status}
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        {t.finance.salary}
                      </TableHead>
                      <TableHead className="w-[140px] text-right text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                        {profileUiText.balance ?? 'Balance'}
                      </TableHead>
                      {!isLowAdminView && (
                        <TableHead className="w-[140px] text-right text-xs font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">
                          {t.admin.table.actions}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredAdmins.map((admin, index) => {
                      const normalizedRole = toRoleOption(admin.role)
                      const pendingAction = pendingActions[admin.id]
                      const isSelected = selectedAdminIds.has(admin.id)

                      return (
                        <TableRow
                          key={admin.id}
                          className={cn(
                            'h-12 transition-colors border-b border-black/5 dark:border-white/5',
                            index % 2 === 0
                              ? 'bg-gourmet-cream dark:bg-dark-surface'
                              : 'bg-gourmet-cream/40 dark:bg-dark-green/20',
                            !isLowAdminView &&
                              'cursor-pointer hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30',
                            isSelected &&
                              "relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-8 before:bg-gourmet-orange before:rounded-r-full"
                          )}
                          onClick={() => {
                            if (isLowAdminView) return
                            if (pendingAction || isBulkMutating) return
                            toggleAdminSelection(admin.id)
                          }}
                        >
                          {!isLowAdminView && (
                            <TableCell className="px-2 py-2 align-middle">
                              <Checkbox
                                aria-label={`Select admin ${admin.name}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleAdminSelection(admin.id)}
                                disabled={Boolean(pendingAction) || isBulkMutating}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </TableCell>
                          )}
                          <TableCell className="py-2 font-bold text-gourmet-ink dark:text-dark-text">
                            {admin.name}
                          </TableCell>
                          <TableCell className="py-2 font-medium text-gourmet-ink/70 dark:text-dark-text/70">
                            {admin.email}
                          </TableCell>
                          <TableCell className="py-2 font-medium text-gourmet-ink dark:text-dark-text">
                            {roleLabel[normalizedRole]}
                          </TableCell>
                          <TableCell className="py-2 font-bold text-emerald-600">
                            {normalizedRole === 'COURIER' ? adminStats[admin.id]?.delivered || 0 : '-'}
                          </TableCell>
                          <TableCell className="py-2 font-bold text-rose-600">
                            {normalizedRole === 'COURIER' ? adminStats[admin.id]?.notDelivered || 0 : '-'}
                          </TableCell>
                          <TableCell className="py-2">
                            <EntityStatusBadge
                              isActive={admin.isActive}
                              activeLabel={t.admin.table.active}
                              inactiveLabel={t.admin.table.paused}
                            />
                          </TableCell>
                          <TableCell className="py-2 font-medium text-gourmet-ink dark:text-dark-text">
                            {admin.salary && admin.salary > 0 ? `${salaryFormatter.format(admin.salary)} UZS` : '-'}
                          </TableCell>
                          <TableCell className="py-2 text-right tabular-nums">
                            {salaryLedgerByAdminId[admin.id] ? (
                              <span
                                className={
                                  salaryLedgerByAdminId[admin.id].balance > 0
                                    ? 'font-bold text-rose-600'
                                    : salaryLedgerByAdminId[admin.id].balance < 0
                                      ? 'font-bold text-emerald-600'
                                      : 'text-gourmet-ink/60 dark:text-dark-text/60'
                                }
                                title={`Days: ${salaryLedgerByAdminId[admin.id].days}; Accrued: ${salaryFormatter.format(salaryLedgerByAdminId[admin.id].accrued)} UZS; Paid: ${salaryFormatter.format(salaryLedgerByAdminId[admin.id].paid)} UZS`}
                              >
                                {salaryLedgerByAdminId[admin.id].balance > 0 ? '+' : ''}
                                {salaryFormatter.format(Math.round(salaryLedgerByAdminId[admin.id].balance))} UZS
                              </span>
                            ) : (
                              <span className="text-gourmet-ink/60 dark:text-dark-text/60">-</span>
                            )}
                          </TableCell>
                          {!isLowAdminView && (
                            <TableCell className="py-2 text-right">
                              <div onClick={(event) => event.stopPropagation()}>
                                <IconButton
                                  label={t.admin.edit}
                                  variant="outline"
                                  iconSize="sm"
                                  onClick={() => openEditModal(admin)}
                                  disabled={Boolean(pendingAction) || isBulkMutating}
                                >
                                  <Edit className="size-4" />
                                </IconButton>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}

                    {filteredAdmins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={!isLowAdminView ? 10 : 8} className="h-20 text-center">
                          <div className="inline-flex items-center gap-2 text-sm font-bold text-gourmet-ink/60 dark:text-dark-text/60">
                            <Users className="size-4" />
                            {t.admin.noAdminsFound}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <Dialog open={isFormModalOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent
          // Fixed height + flex layout so the form body can scroll on small screens.
          className="sm:max-w-[640px] h-[min(92svh,860px)] max-h-[92svh] flex flex-col overflow-hidden transition-transform duration-200"
          style={swipeOffset ? { transform: `translateY(${swipeOffset}px)` } : undefined}
        >
          <div
            className="mb-2 flex justify-center sm:hidden"
            onTouchStart={(event) => {
              const touch = event.touches[0]
              if (!touch) return
              swipeStartRef.current = { y: touch.clientY, x: touch.clientX, at: Date.now() }
              swipeLockRef.current = 'none'
              setSwipeOffset(0)
            }}
            onTouchMove={(event) => {
              const start = swipeStartRef.current
              const touch = event.touches[0]
              if (!start || !touch) return

              const dy = touch.clientY - start.y
              const dx = Math.abs(touch.clientX - start.x)

              if (swipeLockRef.current === 'none') {
                if (dy > 8 && dy > dx) swipeLockRef.current = 'close'
                else if (dx > 8 && dx > dy) swipeLockRef.current = 'ignore'
              }

              if (swipeLockRef.current !== 'close') return
              if (dy <= 0) return
              setSwipeOffset(Math.min(220, dy))
            }}
            onTouchEnd={() => {
              const shouldClose = swipeLockRef.current === 'close' && swipeOffset >= 90
              swipeStartRef.current = null
              swipeLockRef.current = 'none'

              if (shouldClose) {
                setSwipeOffset(0)
                handleFormOpenChange(false)
                return
              }

              setSwipeOffset(0)
            }}
            onTouchCancel={() => {
              swipeStartRef.current = null
              swipeLockRef.current = 'none'
              setSwipeOffset(0)
            }}
          >
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? t.admin.createAdmin : t.admin.edit}</DialogTitle>
            <DialogDescription>
              {formMode === 'create' ? t.admin.manageLowAdminsDesc : editingAdmin?.email}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
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
            </div>

            <DialogFooter className="shrink-0">
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

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteSelected}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkMutating}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkMutating || selectedAdminIds.size === 0}
              onClick={(event) => {
                event.preventDefault()
                void confirmBulkDeleteAdmins()
              }}
            >
              {isBulkMutating ? t.common.loading : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
