'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  CookingPot,
  Cherry,
  Pause,
  Play,
  Edit,
  Utensils,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Client } from '@/components/admin/dashboard/types'
import type { DateRange } from 'react-day-picker'

interface ClientsTabProps {
  clients: Client[]
  selectedClients: Set<string>
  onSelectClient: (id: string) => void
  onSelectAll: () => void
  onDeleteSelected: () => void
  onToggleStatus: () => void
  onEditClient: (client: Client) => void
  onCreateClient: () => void
  onRefresh: () => void
  isRefreshing: boolean
  isMutating: boolean
  shouldPauseSelectedClients: boolean
  selectedDate: Date | null
  applySelectedDate: (date: Date | null) => void
  shiftSelectedDate: (days: number) => void
  selectedPeriod: DateRange | undefined
  applySelectedPeriod: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  profileUiText: any
  clientFinanceById: Record<string, { balance: number; dailyPrice: number }>
  isClientFinanceLoading: boolean
}

export function ClientsTab({
  clients,
  selectedClients,
  onSelectClient,
  onSelectAll,
  onDeleteSelected,
  onToggleStatus,
  onEditClient,
  onCreateClient,
  onRefresh,
  isRefreshing,
  isMutating,
  shouldPauseSelectedClients,
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
  profileUiText,
  clientFinanceById,
  isClientFinanceLoading,
}: ClientsTabProps) {
  const { t, language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  // Calendar dialog state
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

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (!isDatePickerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isDatePickerOpen])

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((client) => {
      const hay = [client.name, client.phone, client.address, client.nickName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [clients, searchTerm])

  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const appliedRangeLabel = useMemo(() => {
    const from = selectedPeriod?.from ?? selectedDate ?? null
    const to = selectedPeriod?.to ?? null
    if (!from) return selectedPeriodLabel || 'All time'
    if (to && !isSameDay(from, to)) return `${format(from, 'd-MMM')} - ${format(to, 'd-MMM, yyyy')}`
    return format(from, 'd-MMM, yyyy')
  }, [selectedDate, selectedPeriod?.from, selectedPeriod?.to, selectedPeriodLabel])

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
              !isCurrentMonth ? 'text-muted-foreground/40 dark:text-muted-foreground/40' : 'text-foreground dark:text-foreground',
              isSelected
                ? 'bg-primary text-foreground dark:text-foreground shadow-md z-10'
                : 'hover:bg-muted dark:hover:bg-muted',
              isInRange && !isSelected ? 'bg-primary/20' : ''
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

  const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-foreground dark:text-foreground'
  const cellBorder = 'border-l-2 border-dashed border-border dark:border-border'

  return (
    <TabsContent value="clients" className="min-h-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card flex-1 min-h-0 flex flex-col gap-6 md:gap-10 relative overflow-hidden px-4 md:px-14 py-6 md:py-10 transition-colors duration-300"
      >
        {/* Background Watermark */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
        >
          <Users className="w-56 h-56 md:w-64 md:h-64 text-foreground dark:text-foreground" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-foreground dark:text-foreground tracking-tight"
          >
            {t.admin.manageClients}
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-foreground dark:text-foreground font-medium"
          >
            {t.admin.manageClientsDesc}
          </motion.p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative flex-1 bg-primary dark:bg-primary rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
          >
            <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-foreground dark:text-foreground mr-3 md:mr-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={profileUiText.searchClientPlaceholder || "Qidirish..."}
                className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
            <motion.button
              whileHover={{
                x: [0, -5],
                transition: { x: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
              }}
              whileTap={{ x: 0 }}
              onClick={openDatePicker}
              className="w-[50px] h-[50px] md:w-auto md:h-[50px] flex items-center gap-4 bg-primary dark:bg-primary rounded-full shadow-xl border-b-4 border-black/20 p-1 group cursor-pointer transition-colors duration-300"
            >
              <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
                <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-foreground dark:text-foreground md:mr-3" />
                <span className="hidden md:inline font-bold text-sm md:text-lg text-foreground dark:text-foreground whitespace-nowrap">
                  {appliedRangeLabel}
                </span>
              </div>
            </motion.button>

            <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCreateClient}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                aria-label={profileUiText.createClient}
                title={profileUiText.createClient}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground dark:text-foreground" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleStatus}
                disabled={selectedClients.size === 0 || isMutating}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={shouldPauseSelectedClients ? t.admin.pause : t.admin.resume}
                title={shouldPauseSelectedClients ? t.admin.pause : t.admin.resume}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  {shouldPauseSelectedClients ? (
                    <Pause className="w-6 h-6 text-foreground dark:text-foreground" />
                  ) : (
                    <Play className="w-6 h-6 text-foreground dark:text-foreground" />
                  )}
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDeleteSelected}
                disabled={selectedClients.size === 0 || isMutating}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={t.admin.deleteSelected}
                title={t.admin.deleteSelected}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-foreground dark:text-foreground" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                whileTap={{ scale: 0.8 }}
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={profileUiText.refresh || 'Refresh'}
                title={profileUiText.refresh || 'Refresh'}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <RotateCcw className={cn('w-5 h-5 text-foreground dark:text-foreground', isRefreshing && 'animate-spin')} />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Sheet */}
        <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
          <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-border dark:border-border overflow-hidden relative flex-1 flex flex-col min-h-0">
            <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-muted-foreground dark:text-muted-foreground">
              <CookingPot className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
              <Utensils className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
            </div>

            <div className="overflow-auto relative flex-1 min-h-0">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="h-12 bg-muted/60 dark:bg-muted/20">
                    <TableHead className="w-[60px] px-6">
                      <Checkbox
                        checked={clients.length > 0 && selectedClients.size === clients.length}
                        onCheckedChange={onSelectAll}
                        className="border-border dark:border-border"
                      />
                    </TableHead>
                    <TableHead className={headCell}>{t.common.name}</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>{t.common.phone}</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>{t.common.address}</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.calories}</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>{profileUiText.balance}</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>{t.common.status}</TableHead>
                    <TableHead className={cn(headCell, cellBorder, 'text-right pr-10')}>{t.admin.table.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const finance = clientFinanceById[client.id]
                    return (
                      <TableRow key={client.id} className="h-16 border-b-2 border-dashed border-border dark:border-border hover:bg-muted/5 dark:hover:bg-muted/10 transition-colors">
                        <TableCell className="px-6">
                          <Checkbox
                            checked={selectedClients.has(client.id)}
                            onCheckedChange={() => onSelectClient(client.id)}
                            className="border-border dark:border-border"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-foreground dark:text-foreground">{client.name}</div>
                          {client.nickName && <div className="text-sm font-medium text-muted-foreground/40 dark:text-muted-foreground/40">{client.nickName}</div>}
                        </TableCell>
                        <TableCell className={cn('font-bold text-foreground dark:text-foreground', cellBorder)}>{client.phone}</TableCell>
                        <TableCell className={cn('max-w-[300px] truncate font-medium text-foreground dark:text-foreground', cellBorder)} title={client.address}>
                          {client.address}
                        </TableCell>
                        <TableCell className={cn('font-bold text-foreground dark:text-foreground', cellBorder)}>
                          <Badge variant="outline" className="border-border text-foreground dark:border-border dark:text-foreground font-bold">
                            {client.calories}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(cellBorder)}>
                          {isClientFinanceLoading ? (
                            <div className="h-4 w-16 animate-pulse rounded bg-muted/40" />
                          ) : (
                            <div className={cn(
                              "font-bold",
                              (finance?.balance ?? 0) < 0 ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {finance?.balance?.toLocaleString() || '0'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cellBorder}>
                          <Badge variant={client.isActive ? 'default' : 'secondary'} className="font-bold">
                            {client.isActive ? profileUiText.active : profileUiText.pausedOnly}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn('text-right pr-10', cellBorder)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditClient(client)}
                            className="hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
                          >
                            <Edit className="size-5 text-foreground dark:text-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center font-bold text-foreground dark:text-foreground text-xl">
                        {profileUiText.noOrdersFound || "Mijozlar topilmadi"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Dialog */}
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
              className="relative bg-card dark:bg-card rounded-3xl md:rounded-[40px] shadow-2xl border-2 border-border p-6 md:p-10 z-[1000] w-full max-w-[450px] mx-auto overflow-hidden transition-colors duration-300"
              role="dialog"
              aria-modal="true"
              aria-label="Calendar"
            >
              <Button
                type="button"
                variant="ghost"
                size="refIconSm"
                onClick={closeDatePicker}
                className="absolute top-4 right-4 hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-foreground dark:text-foreground" />
              </Button>

              <div className="flex items-center justify-between mb-6 md:mb-8">
                <Button
                  type="button"
                  variant="ghost"
                  size="refIconSm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="hover:bg-muted"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                </Button>
                <h3 className="text-xl md:text-2xl font-black text-foreground dark:text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="refIconSm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="hover:bg-muted"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] md:text-sm font-black text-foreground dark:text-foreground uppercase tracking-widest py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="text-base md:text-lg">{renderCalendar()}</div>

              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-dashed border-border">
                <Button type="button" variant="link" size="refSm" onClick={resetDraftRange}>
                  Reset
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                  <Button type="button" variant="outline" size="ref" onClick={closeDatePicker} className="hover:bg-muted">
                    Bekor qilish
                  </Button>
                  <Button type="button" size="ref" onClick={applyDraftRange}>
                    Tayyor
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TabsContent>
  )
}
