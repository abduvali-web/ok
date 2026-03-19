'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cherry,
  CookingPot,
  Edit,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Utensils,
  Users,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

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

  // Gourmet mock date picker state (local UI, persisted via applySelectedDate/applySelectedPeriod)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
  )
  const [draftStartDate, setDraftStartDate] = useState<Date>(() =>
    startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
  )
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(() =>
    selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
  )

  useEffect(() => {
    if (!isDatePickerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isDatePickerOpen])

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
    const stats: Record<string, { delivered: number; notDelivered: number }> = {}
    lowAdmins.forEach((a) => {
      stats[a.id] = { delivered: 0, notDelivered: 0 }
    })

    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        if (!order?.courierId) return
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

  const openDatePicker = useCallback(() => {
    const from = startOfDay(selectedPeriod?.from ?? selectedDate ?? new Date())
    const to = selectedPeriod?.to ? startOfDay(selectedPeriod.to) : null
    setDraftStartDate(from)
    setDraftEndDate(to && !isSameDay(from, to) ? to : null)
    setCurrentMonth(from)
    setIsDatePickerOpen(true)
  }, [selectedDate, selectedPeriod?.from, selectedPeriod?.to])

  const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])

  const handleDateClick = useCallback(
    (day: Date) => {
      const normalized = startOfDay(day)
      if (!draftStartDate || (draftStartDate && draftEndDate)) {
        setDraftStartDate(normalized)
        setDraftEndDate(null)
        return
      }

      if (draftStartDate && !draftEndDate) {
        if (isBefore(normalized, draftStartDate)) {
          setDraftStartDate(normalized)
          setDraftEndDate(null)
          return
        }

        if (isSameDay(normalized, draftStartDate)) {
          return
        }

        setDraftEndDate(normalized)
      }
    },
    [draftEndDate, draftStartDate]
  )

  const renderCalendar = useCallback(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDateView = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDateView = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows: any[] = []
    let days: any[] = []
    let day = startDateView
    const dateFormat = 'd'

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isSelected =
          (draftStartDate && isSameDay(cloneDay, draftStartDate)) || (draftEndDate && isSameDay(cloneDay, draftEndDate))
        const isInRange =
          draftStartDate && draftEndDate && isWithinInterval(cloneDay, { start: draftStartDate, end: draftEndDate })
        const isCurrentMonth = isSameMonth(cloneDay, monthStart)

        days.push(
          <div
            key={day.toString()}
            className={cn(
              'relative p-1 md:p-2 text-center cursor-pointer transition-all duration-200 rounded-lg md:rounded-xl',
              !isCurrentMonth ? 'text-gourmet-ink/40 dark:text-dark-text/40' : 'text-gourmet-ink dark:text-dark-text',
              isSelected
                ? 'bg-dark-green text-gourmet-ink dark:text-dark-text shadow-md z-10'
                : 'hover:bg-gourmet-green/10 dark:hover:bg-dark-green/40',
              isInRange && !isSelected ? 'bg-dark-green/20' : ''
            )}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span className="relative z-10 font-bold text-xs md:text-base">{format(cloneDay, dateFormat)}</span>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="flex flex-col gap-1">{rows}</div>
  }, [currentMonth, draftEndDate, draftStartDate, handleDateClick])

  const appliedRangeLabel = useMemo(() => {
    const from = selectedPeriod?.from ?? selectedDate ?? null
    const to = selectedPeriod?.to ?? null
    if (!from) return selectedPeriodLabel ?? selectedDateLabel ?? 'All time'
    if (to && !isSameDay(from, to)) return `${format(from, 'd-MMM')} - ${format(to, 'd-MMM, yyyy')}`
    return format(from, 'd-MMM, yyyy')
  }, [selectedDate, selectedDateLabel, selectedPeriod?.from, selectedPeriod?.to, selectedPeriodLabel])

  const applyDraftRange = useCallback(() => {
    if (typeof applySelectedPeriod === 'function') {
      applySelectedPeriod({ from: draftStartDate, to: draftEndDate ?? draftStartDate })
      closeDatePicker()
      return
    }

    if (typeof applySelectedDate === 'function') {
      applySelectedDate(draftStartDate)
    }
    closeDatePicker()
  }, [applySelectedDate, applySelectedPeriod, closeDatePicker, draftEndDate, draftStartDate])

  const resetDraftRange = useCallback(() => {
    const today = startOfDay(new Date())
    setDraftStartDate(today)
    setDraftEndDate(null)
    setCurrentMonth(today)

    if (typeof applySelectedPeriod === 'function') {
      applySelectedPeriod({ from: today, to: today })
    } else if (typeof applySelectedDate === 'function') {
      applySelectedDate(today)
    }

    closeDatePicker()
  }, [applySelectedDate, applySelectedPeriod, closeDatePicker])

  return (
    <>
      <TabsContent value="admins" className="min-h-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="content-card flex-1 min-h-0 flex flex-col gap-6 md:gap-10 relative overflow-hidden px-4 md:px-14 py-6 md:py-10 transition-colors duration-300"
        >
          {/* Background Watermark */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
          >
            <CookingPot className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
          </motion.div>

          {/* Title */}
          <div className="flex flex-col gap-2 relative z-10">
            <motion.h2
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
            >
              {t.admin.manageLowAdmins}
            </motion.h2>
            <motion.p
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
            >
              {t.admin.manageLowAdminsDesc}
            </motion.p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative flex-1 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
            >
              <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text mr-3 md:mr-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Qidirish..."
                  aria-label={t.admin.searchPlaceholder}
                  className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-gourmet-ink dark:text-dark-text placeholder:text-gourmet-ink dark:placeholder:text-dark-text"
                />
              </div>
            </motion.div>

            <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ x: 0 }}
                  whileHover={{
                    x: [0, -5],
                    transition: { x: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
                  }}
                  whileTap={{ x: 0 }}
                  onClick={openDatePicker}
                  className="w-[50px] h-[50px] md:w-auto md:h-[50px] flex items-center gap-4 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 group cursor-pointer transition-colors duration-300"
                >
                  <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
                    <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text md:mr-3" />
                    <span className="hidden md:inline font-bold text-sm md:text-lg text-gourmet-ink dark:text-dark-text whitespace-nowrap">
                      {appliedRangeLabel}
                    </span>
                  </div>
                </motion.div>
              </div>

              {!isLowAdminView ? (
                <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, y: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={openCreateModal}
                    disabled={isBulkMutating}
                    className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={t.admin.create}
                    title={t.admin.create}
                  >
                    <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, y: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => void handleBulkToggleStatus()}
                    disabled={selectedAdminIds.size === 0 || isBulkMutating}
                    className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={shouldPauseSelectedAdmins ? t.admin.pause : t.admin.resume}
                    title={shouldPauseSelectedAdmins ? t.admin.pause : t.admin.resume}
                  >
                    <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      {shouldPauseSelectedAdmins ? (
                        <Pause className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                      ) : (
                        <Play className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, y: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsBulkDeleteOpen(true)}
                    disabled={selectedAdminIds.size === 0 || isBulkMutating}
                    className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={t.admin.deleteSelected}
                    title={t.admin.deleteSelected}
                  >
                    <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
                    className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={profileUiText?.refresh ?? 'Refresh'}
                    title={profileUiText?.refresh ?? 'Refresh'}
                  >
                    <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                      <RotateCcw className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isRefreshing && 'animate-spin')} />
                    </div>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label={profileUiText?.refresh ?? 'Refresh'}
                  title={profileUiText?.refresh ?? 'Refresh'}
                >
                  <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <RotateCcw className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isRefreshing && 'animate-spin')} />
                  </div>
                </motion.button>
              )}

            </div>
          </div>

          {/* Sheet */}
          <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
            {(() => {
              const allSelected = filteredAdmins.length > 0 && selectedAdminIds.size === filteredAdmins.length
              const toggleSelectAll = () => {
                if (isLowAdminView) return
                toggleSelectAllFilteredAdmins(!allSelected)
              }

              const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text'
              const cellBorder = 'border-l-2 border-dashed border-gourmet-green/25 dark:border-white/10'

              return (
                <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-gourmet-green-light dark:text-gourmet-green">
                    <Cherry className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
                    <Utensils className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
                  </div>

                  <div className="overflow-auto relative flex-1 min-h-0">
                    <Table className="min-w-[1150px]">
                      <TableHeader>
                        <TableRow
                          className={cn(
                            'h-12 bg-gourmet-cream/60 dark:bg-dark-green/20 cursor-pointer select-none',
                            !isLowAdminView ? 'hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30' : 'cursor-default'
                          )}
                          onClick={toggleSelectAll}
                        >
                          <TableHead className="w-[18px] px-0" />
                          <TableHead className={cn('w-[220px]', headCell, 'pl-4 md:pl-6')}>{t.admin.table.name}</TableHead>
                          <TableHead className={cn(headCell, cellBorder)}>Email</TableHead>
                          <TableHead className={cn('w-[160px]', headCell, cellBorder)}>{t.admin.table.role}</TableHead>
                          <TableHead className={cn('w-[110px]', headCell, cellBorder)}>Delivered</TableHead>
                          <TableHead className={cn('w-[130px]', headCell, cellBorder)}>Not Delivered</TableHead>
                          <TableHead className={cn('w-[140px]', headCell, cellBorder)}>{t.common.status}</TableHead>
                          <TableHead className={cn('w-[140px]', headCell, cellBorder)}>{t.finance.salary}</TableHead>
                          <TableHead className={cn('w-[170px] text-right', headCell, cellBorder)}>
                            {profileUiText.balance ?? 'Balance'}
                          </TableHead>
                          {!isLowAdminView && <TableHead className={cn('w-[140px] text-right', headCell, cellBorder)}>{t.admin.table.actions}</TableHead>}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredAdmins.map((admin, index) => {
                          const normalizedRole = toRoleOption(admin.role)
                          const isSelected = selectedAdminIds.has(admin.id)
                          const pendingAction = pendingActions[admin.id]

                          return (
                            <TableRow
                              key={admin.id}
                              className={cn(
                                'h-12 transition-colors border-t border-gourmet-green/15 dark:border-white/10',
                                index % 2 === 0
                                  ? 'bg-gourmet-cream dark:bg-dark-surface'
                                  : 'bg-gourmet-cream/40 dark:bg-dark-green/20',
                                !isLowAdminView &&
                                  'cursor-pointer hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30',
                                isSelected && 'bg-gourmet-green/10 dark:bg-dark-green/30'
                              )}
                              onClick={() => {
                                if (isLowAdminView) return
                                if (pendingAction || isBulkMutating) return
                                toggleAdminSelection(admin.id)
                              }}
                              onDoubleClick={() => {
                                if (isLowAdminView) return
                                openEditModal(admin)
                              }}
                            >
                              <TableCell className="w-[18px] px-0">
                                <div className="h-full flex items-center justify-start">
                                  {isSelected ? <div className="w-1.5 h-8 bg-gourmet-orange rounded-r-full" /> : null}
                                </div>
                              </TableCell>
                              <TableCell className="pl-4 md:pl-6 font-bold text-gourmet-ink dark:text-dark-text">
                                {admin.name}
                              </TableCell>
                              <TableCell className={cn('font-medium text-gourmet-ink/70 dark:text-dark-text/70', cellBorder)}>
                                {admin.email}
                              </TableCell>
                              <TableCell className={cn('font-medium text-gourmet-ink dark:text-dark-text', cellBorder)}>
                                {roleLabel[normalizedRole]}
                              </TableCell>
                              <TableCell className={cn('font-bold text-emerald-600', cellBorder)}>
                                {normalizedRole === 'COURIER' ? adminStats[admin.id]?.delivered || 0 : '-'}
                              </TableCell>
                              <TableCell className={cn('font-bold text-rose-600', cellBorder)}>
                                {normalizedRole === 'COURIER' ? adminStats[admin.id]?.notDelivered || 0 : '-'}
                              </TableCell>
                              <TableCell className={cn(cellBorder)}>
                                <EntityStatusBadge
                                  isActive={admin.isActive}
                                  activeLabel={t.admin.table.active}
                                  inactiveLabel={t.admin.table.paused}
                                />
                              </TableCell>
                              <TableCell className={cn('font-medium text-gourmet-ink dark:text-dark-text', cellBorder)}>
                                {admin.salary && admin.salary > 0 ? `${salaryFormatter.format(admin.salary)} UZS` : '-'}
                              </TableCell>
                              <TableCell className={cn('text-right tabular-nums', cellBorder)}>
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
                                <TableCell className={cn('text-right', cellBorder)} onClick={(event) => event.stopPropagation()}>
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.15, y: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openEditModal(admin)}
                                    disabled={Boolean(pendingAction) || isBulkMutating}
                                    className="ml-auto w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                                    aria-label={t.admin.edit}
                                    title={t.admin.edit}
                                  >
                                    <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                      <Edit className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                                    </div>
                                  </motion.button>
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}

                        {filteredAdmins.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={!isLowAdminView ? 10 : 9} className="h-20 text-center">
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
              )
            })()}
          </div>
        </motion.div>

        {/* Date Picker Modal - Moved to root for z-index safety */}
        <AnimatePresence>
          {isDatePickerOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDatePicker}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-gourmet-cream dark:bg-dark-surface rounded-3xl md:rounded-[40px] shadow-2xl border-2 border-gourmet-green/20 p-6 md:p-10 z-[1000] w-full max-w-[450px] mx-auto overflow-hidden transition-colors duration-300"
                role="dialog"
                aria-modal="true"
                aria-label="Calendar"
              >
                <button
                  type="button"
                  onClick={closeDatePicker}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gourmet-green/10 dark:hover:bg-dark-green/40 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                </button>

                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gourmet-green/10 dark:hover:bg-dark-green/40 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
                  </button>
                  <h3 className="text-xl md:text-2xl font-black text-gourmet-ink dark:text-dark-text">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gourmet-green/10 dark:hover:bg-dark-green/40 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                  {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] md:text-sm font-black text-gourmet-ink dark:text-dark-text uppercase tracking-widest py-2"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="text-base md:text-lg">{renderCalendar()}</div>

                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-dashed border-gourmet-green/20">
                  <button
                    type="button"
                    onClick={resetDraftRange}
                    className="text-sm md:text-base font-bold text-gourmet-ink dark:text-dark-text hover:text-gourmet-ink dark:hover:text-dark-text transition-colors"
                  >
                    Reset
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={closeDatePicker}
                      className="px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm md:text-base text-gourmet-ink dark:text-dark-text hover:bg-gourmet-green/10 dark:hover:bg-dark-green/40 transition-all border border-gourmet-ink/5 sm:border-none"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={applyDraftRange}
                      className="bg-gourmet-green dark:bg-dark-green text-gourmet-ink dark:text-dark-text px-8 md:px-10 py-2 md:py-3 rounded-full font-bold text-sm md:text-base shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all transition-colors duration-300"
                    >
                      Tayyor
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
