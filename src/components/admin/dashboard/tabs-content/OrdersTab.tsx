'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Utensils,
  CookingPot,
  Cherry,
  Save,
  Play,
  CalendarDays,
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
import { TabsContent } from '@/components/ui/tabs'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { CalendarDialog } from '@/components/admin/dashboard/shared/CalendarDialog'
import type { Order } from '@/components/admin/dashboard/types'
import type { DateRange } from 'react-day-picker'

interface OrdersTabProps {
  orders: Order[]
  selectedOrders: Set<string>
  onSelectOrder: (id: string) => void
  onSelectAll: () => void
  onDeleteSelected: () => void
  onEditOrder: (order: Order) => void
  onCreateOrder: () => void
  onDispatchOpen: () => void
  onRefresh: () => void
  isRefreshing: boolean
  isDeleting: boolean
  selectedDate: Date | null
  applySelectedDate: (date: Date | null) => void
  shiftSelectedDate: (days: number) => void
  selectedPeriod: DateRange | undefined
  applySelectedPeriod: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  dispatchActionLabel: string
  DispatchActionIcon: any
  profileUiText: any
}

export function OrdersTab({
  orders,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onDeleteSelected,
  onEditOrder,
  onCreateOrder,
  onDispatchOpen,
  onRefresh,
  isRefreshing,
  isDeleting,
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
  dispatchActionLabel,
  DispatchActionIcon,
  profileUiText,
}: OrdersTabProps) {
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

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const hay = [
        order.id,
        String(order.orderNumber),
        order.customer?.name,
        order.customer?.phone,
        order.deliveryAddress,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [orders, searchTerm])

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

  return (
    <TabsContent value="orders" className="min-h-0">
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
          <Utensils className="w-56 h-56 md:w-64 md:h-64 text-foreground dark:text-foreground" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-foreground dark:text-foreground tracking-tight"
          >
            {t.admin.manageOrders}
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-foreground dark:text-foreground font-medium"
          >
            {t.admin.manageOrdersDesc}
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
                placeholder={profileUiText.searchOrdersPlaceholder || "Qidirish..."}
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
                onClick={onCreateOrder}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                aria-label={t.admin.createOrder}
                title={t.admin.createOrder}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-foreground dark:text-foreground" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDispatchOpen}
                disabled={!selectedDate}
                className="group relative h-[50px] overflow-hidden rounded-full border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-teal-400 px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                aria-label={dispatchActionLabel}
                title={dispatchActionLabel}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative z-10 flex flex-row items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner">
                    <DispatchActionIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-extrabold text-white tracking-widest uppercase text-sm drop-shadow-md">
                    {dispatchActionLabel}
                  </span>
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDeleteSelected}
                disabled={selectedOrders.size === 0 || isDeleting}
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
              <Cherry className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
              <Utensils className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
            </div>

            <div className="overflow-auto relative flex-1 min-h-0">
              <OrdersTable
                orders={filteredOrders}
                selectedOrders={selectedOrders}
                onSelectOrder={onSelectOrder}
                onSelectAll={onSelectAll}
                onDeleteSelected={onDeleteSelected}
                onEditOrder={onEditOrder}
                isGourmetStyle
              />
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
              <button
                type="button"
                onClick={closeDatePicker}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted dark:hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-foreground dark:text-foreground" />
              </button>

              <div className="flex items-center justify-between mb-6 md:mb-8">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                </button>
                <h3 className="text-xl md:text-2xl font-black text-foreground dark:text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-muted dark:hover:bg-muted rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground dark:text-foreground" />
                </button>
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
                <button
                  type="button"
                  onClick={resetDraftRange}
                  className="text-sm md:text-base font-bold text-foreground dark:text-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                >
                  Reset
                </button>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={closeDatePicker}
                    className="px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm md:text-base text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted transition-all border border-border sm:border-none"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={applyDraftRange}
                    className="bg-primary dark:bg-primary text-foreground dark:text-foreground px-8 md:px-10 py-2 md:py-3 rounded-full font-bold text-sm md:text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all transition-colors duration-300"
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
  )
}
