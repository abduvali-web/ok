'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { enUS, ru, uz } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, History } from 'lucide-react'
import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { RefreshIconButton } from '@/components/admin/dashboard/shared/RefreshIconButton'
import { SearchPanel } from '@/components/ui/search-panel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
import type { DateRange } from 'react-day-picker'
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

interface User {
  id: string
  name: string
  role: string
}

interface HistoryTableProps {
  role?: string
  limit?: number
  compactMode?: boolean
  selectedDate?: Date | null
  applySelectedDate?: (date: Date | null) => void
  shiftSelectedDate?: (days: number) => void
  selectedDateLabel?: string
  selectedPeriod?: DateRange | undefined
  applySelectedPeriod?: (range: DateRange | undefined) => void
  selectedPeriodLabel?: string
  profileUiText?: any
}

export function HistoryTable({
  role: _role,
  limit = 10,
  compactMode = false,
  selectedDate,
  applySelectedDate,
  shiftSelectedDate,
  selectedDateLabel,
  selectedPeriod,
  applySelectedPeriod,
  selectedPeriodLabel,
  profileUiText
}: HistoryTableProps) {
  const { t, language } = useLanguage()
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const dateLocale = language === 'ru' ? ru : language === 'uz' ? uz : enUS
  const calendarLocale = language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US'

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users-list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch {
      // ignore transient dashboard loading failures
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })

      if (selectedUser !== 'all') {
        params.append('adminId', selectedUser)
      }

      if (selectedPeriod?.from) {
        const toLocalIsoDate = (d: Date) => {
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }

        params.append('from', toLocalIsoDate(selectedPeriod.from))
        params.append('to', toLocalIsoDate(selectedPeriod.to ?? selectedPeriod.from))
      } else if (selectedDate) {
        params.append('date', selectedDate.toISOString())
      }

      const response = await fetch(`/api/admin/action-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
        setHasMore(data.hasMore || false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, selectedPeriod, selectedUser, selectedDate])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(0)
  }, [selectedUser, selectedPeriod, selectedDate])

  function getActionBadgeColor(action: string) {
    if (action.includes('CREATE')) return 'border border-border bg-background text-foreground'
    if (action.includes('UPDATE')) return 'border border-border bg-background text-foreground'
    if (action.includes('DELETE')) return 'border border-border bg-background text-foreground'
    return 'border border-border bg-background text-foreground'
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return t.admin.superAdmin
      case 'MIDDLE_ADMIN':
        return t.admin.middleAdmin
      case 'LOW_ADMIN':
        return t.admin.lowAdmin
      case 'COURIER':
        return t.courier.title
      case 'WORKER':
        return t.admin.worker
      default:
        return role
    }
  }

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return logs.filter((log) => {
      if (!query) return true

      const haystack = [
        log.action,
        log.entityType,
        log.description,
        log.admin.name,
        log.admin.role,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [logs, searchTerm])

  const pageRangeLabel = useMemo(() => {
    if (total === 0 || logs.length === 0) return `0 / ${total}`
    const start = page * limit + 1
    const end = page * limit + logs.length
    return `${start}-${end} / ${total}`
  }, [limit, logs.length, page, total])

  return (
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
        <History className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
      </motion.div>

      {/* Title */}
      <div className="flex flex-col gap-2 relative z-10">
        <motion.h2
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
        >
          {t.admin.actionHistory}
        </motion.h2>
        <motion.p
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
        >
          {t.admin.totalRecords}: {total}
        </motion.p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative flex-1 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
        >
          <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
            {users.length > 0 ? (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="border-0 bg-transparent focus:ring-0">
                  <SelectValue placeholder={t.admin.allUsers} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.admin.allUsers}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({getRoleLabel(user.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-gourmet-ink/70 dark:text-dark-text/70">{t.admin.allUsers}</span>
            )}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
          {applySelectedDate &&
            (applySelectedPeriod ? Boolean(selectedPeriodLabel) : Boolean(selectedDateLabel)) &&
            profileUiText ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex-shrink-0"
            >
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
            </motion.div>
          ) : null}

          <motion.button
            whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => void fetchLogs()}
            disabled={isLoading}
            className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
            aria-label={profileUiText?.refresh ?? 'Refresh'}
            title={profileUiText?.refresh ?? 'Refresh'}
          >
            <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <Loader2 className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isLoading && 'animate-spin')} />
            </div>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative flex-1 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
          >
            <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
              <SearchPanel
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t.admin.searchPlaceholder || 'Search logs'}
                className="w-full bg-transparent border-0 focus:ring-0"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sheet */}
      <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
        <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-gourmet-green-light dark:text-gourmet-green">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-current" />
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-current" />
          </div>

          <div className="overflow-auto relative flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20">
                  <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.common.date}</TableHead>
                  <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.common.user}</TableHead>
                  <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.common.action}</TableHead>
                  <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">Entity</TableHead>
                  <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.common.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gourmet-ink dark:text-dark-text" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-gourmet-ink/60 dark:text-dark-text/60">
                      {searchTerm ? t.admin.noMatches : t.admin.emptyHistory}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'h-12 transition-colors border-t border-gourmet-green/15 dark:border-white/10',
                        index % 2 === 0
                          ? 'bg-gourmet-cream dark:bg-dark-surface'
                          : 'bg-gourmet-cream/40 dark:bg-dark-green/20',
                        'hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30'
                      )}
                    >
                      <TableCell className="whitespace-nowrap text-sm text-gourmet-ink dark:text-dark-text">
                        {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: dateLocale })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-gourmet-ink dark:text-dark-text">{log.admin.name}</span>
                          <span className="text-xs text-gourmet-ink/70 dark:text-dark-text/70">{getRoleLabel(log.admin.role)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('border-gourmet-green/25 dark:border-white/10 bg-gourmet-cream/50 dark:bg-dark-surface/30', getActionBadgeColor(log.action))}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gourmet-green/25 dark:border-white/10 bg-gourmet-cream/50 dark:bg-dark-surface/30">{log.entityType || 'UNKNOWN'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate text-gourmet-ink dark:text-dark-text" title={log.description}>
                        {log.description}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 md:gap-4 pt-2">
          <motion.button
            whileHover={{ scale: 1.1, y: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || isLoading}
            className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
            aria-label={t.common.back}
            title={t.common.back}
          >
            <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
            </div>
          </motion.button>
          <div className="text-sm md:text-base font-bold text-gourmet-ink dark:text-dark-text">
            {t.common.page} {page + 1} - {pageRangeLabel}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, y: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasMore || isLoading}
            className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
            aria-label={t.common.next}
            title={t.common.next}
          >
            <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

