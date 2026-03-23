'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { enUS, ru, uz } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  User,
  Shield,
  Activity,
  Search,
  RotateCcw,
  Cherry,
  Utensils,
  CookingPot,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
import type { DateRange } from 'react-day-picker'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActionLog {
  id: string
  action: string
  entityType: string
  description: string
  createdAt: string
  admin: {
    name: string
    email: string
    role: string
  }
}

interface HistoryTabProps {
  selectedDate?: Date | null
  applySelectedDate?: (date: Date | null) => void
  shiftSelectedDate?: (days: number) => void
  selectedDateLabel?: string
  selectedPeriod?: DateRange | undefined
  applySelectedPeriod?: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  profileUiText?: any
}

export function HistoryTab({
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedDateLabel,
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
  profileUiText
}: HistoryTabProps) {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS
  const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

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

  const fetchUsers = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/users-list');
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data.users || []);
      }
    } catch { }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      if (selectedUser !== 'all') params.append('adminId', selectedUser);
      if (selectedPeriod?.from) {
        const toYmd = (d: Date) => d.toISOString().split('T')[0];
        params.append('from', toYmd(selectedPeriod.from));
        params.append('to', toYmd(selectedPeriod.to ?? selectedPeriod.from));
      } else if (selectedDate) {
        params.append('date', selectedDate.toISOString());
      }
      const resp = await fetch(`/api/admin/action-logs?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } finally { setIsLoading(false); }
  }, [page, selectedPeriod, selectedUser, selectedDate]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(l => [l.action, l.entityType, l.description, l.admin.name].join(' ').toLowerCase().includes(q));
  }, [logs, searchTerm]);

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
    <TabsContent value="history" className="min-h-0">
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
          <Activity className="w-56 h-56 md:w-64 md:h-64 text-foreground dark:text-foreground" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-foreground dark:text-foreground tracking-tight"
          >
            System Audit
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-foreground dark:text-foreground font-medium"
          >
            Operational Transparency Log
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
                placeholder="Filter events..."
                className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
            {applySelectedPeriod && profileUiText && (
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
            )}

            <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
              {/* User filter button */}
              <div className="relative flex-shrink-0">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-[50px] h-[50px] md:w-auto md:h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl border-b-4 border-black/20 border-none p-0 transition-colors duration-300 [&>svg]:hidden">
                    <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-foreground dark:text-foreground md:mr-3" />
                      <span className="hidden md:inline font-bold text-sm text-foreground dark:text-foreground whitespace-nowrap">
                        <SelectValue placeholder="All Admins" />
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl backdrop-blur-xl">
                    <SelectItem value="all">All Admins</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <motion.button
                type="button"
                whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => void fetchLogs()}
                disabled={isLoading}
                className="w-[50px] h-[50px] bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Refresh"
                title="Refresh"
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <RotateCcw className={cn('w-5 h-5 text-foreground dark:text-foreground', isLoading && 'animate-spin')} />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-border dark:border-border p-6 md:p-8 bg-muted/40 dark:bg-muted/10 hover:bg-muted/10 dark:hover:bg-muted/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <History className="w-12 h-12 text-foreground dark:text-foreground" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-blue-500" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/60">Action Count</span>
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-foreground dark:text-foreground">{total}</div>
            <p className="text-sm md:text-lg font-bold text-muted-foreground/40 dark:text-muted-foreground/40 mt-2">Total operations recorded</p>
            <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-blue-500" />
          </motion.div>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-border dark:border-border p-6 md:p-8 bg-muted/40 dark:bg-muted/10 hover:bg-muted/10 dark:hover:bg-muted/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-12 h-12 text-foreground dark:text-foreground" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-emerald-500" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground/60 dark:text-muted-foreground/60">Active Admins</span>
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-foreground dark:text-foreground">{users.length}</div>
            <p className="text-sm md:text-lg font-bold text-muted-foreground/40 dark:text-muted-foreground/40 mt-2">Staff members tracked</p>
            <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-emerald-500" />
          </motion.div>
        </div>

        {/* Table Sheet */}
        <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
          <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-border dark:border-border overflow-hidden relative flex-1 flex flex-col min-h-0">
            <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-muted-foreground dark:text-muted-foreground">
              <Cherry className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
              <Utensils className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
            </div>

            <div className="overflow-auto relative flex-1 min-h-0">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="h-12 bg-muted/60 dark:bg-muted/20 cursor-default">
                    <TableHead className={cn('w-[200px]', headCell, 'pl-4 md:pl-6')}>Execution Time</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>Initiator</TableHead>
                    <TableHead className={cn('w-[180px]', headCell, cellBorder)}>Operation</TableHead>
                    <TableHead className={cn(headCell, cellBorder)}>Impact Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log, idx) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'h-12 transition-colors border-t border-border dark:border-border',
                          idx % 2 === 0
                            ? 'bg-muted dark:bg-muted'
                            : 'bg-muted/40 dark:bg-muted/20',
                          'hover:bg-muted/10 dark:hover:bg-muted/30'
                        )}
                      >
                        <TableCell className="pl-4 md:pl-6 font-medium text-xs text-muted-foreground/60 dark:text-muted-foreground/60">
                          {format(new Date(log.createdAt), 'dd MMM HH:mm:ss', { locale: dateLocale })}
                        </TableCell>
                        <TableCell className={cn(cellBorder)}>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground dark:text-foreground tracking-tight">{log.admin.name}</span>
                            <span className="text-[10px] text-muted-foreground/40 dark:text-muted-foreground/40 uppercase font-black tracking-widest">{log.admin.role}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellBorder)}>
                          <Badge variant="outline" className="rounded-full border-border dark:border-border bg-muted/40 dark:bg-muted/20 px-3 uppercase text-[9px] font-black text-foreground dark:text-foreground">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn('max-w-sm truncate font-medium text-sm text-foreground/80 dark:text-foreground/80', cellBorder)} title={log.description}>
                          {log.description}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredLogs.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center">
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground/60 dark:text-muted-foreground/60">
                          <Activity className="size-4" />
                          No records found matching criteria.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {isLoading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground/20 dark:text-muted-foreground/20" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 dark:text-muted-foreground/30">Showing {logs.length} of {total} events</div>
            <div className="flex gap-2 md:gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="h-[42px] px-6 bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none font-bold text-sm text-foreground dark:text-foreground"
              >
                <ChevronLeft className="mr-2 w-4 h-4" /> Previous
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || isLoading}
                className="h-[42px] px-6 bg-primary dark:bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none font-bold text-sm text-foreground dark:text-foreground"
              >
                Next <ChevronRight className="ml-2 w-4 h-4" />
              </motion.button>
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
                    Cancel
                  </Button>
                  <Button type="button" size="ref" onClick={applyDraftRange}>
                    Apply
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
