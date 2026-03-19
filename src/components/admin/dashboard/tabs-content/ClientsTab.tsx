'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
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
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
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
  const appliedRangeLabel = selectedPeriodLabel || 'All time'

  const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text'
  const cellBorder = 'border-l-2 border-dashed border-gourmet-green/25 dark:border-white/10'

  return (
    <TabsContent value="clients" className="min-h-0">
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
          <Users className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
          >
            {t.admin.manageClients}
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
          >
            {t.admin.manageClientsDesc}
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
                placeholder={profileUiText.searchClientPlaceholder || "Qidirish..."}
                className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-gourmet-ink dark:text-dark-text placeholder:text-gourmet-ink dark:placeholder:text-dark-text"
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
            <div className="relative flex-shrink-0">
              <CalendarDateSelector
                selectedDate={selectedDate}
                applySelectedDate={applySelectedDate}
                shiftSelectedDate={shiftSelectedDate}
                selectedDateLabel={selectedPeriodLabel}
                selectedPeriod={selectedPeriod}
                applySelectedPeriod={applySelectedPeriod}
                showShiftButtons={false}
                locale={dateLocale}
                profileUiText={profileUiText}
                customTrigger={(open) => (
                    <motion.div
                    whileHover={{
                        x: [0, -5],
                        transition: { x: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
                    }}
                    whileTap={{ x: 0 }}
                    onClick={open}
                    className="w-[50px] h-[50px] md:w-auto md:h-[50px] flex items-center gap-4 bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl border-b-4 border-black/20 p-1 group cursor-pointer transition-colors duration-300"
                    >
                    <div className="w-[42px] h-[42px] md:w-full md:h-full rounded-full border-2 border-dashed border-white/10 flex items-center justify-center md:px-6">
                        <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-gourmet-ink dark:text-dark-text md:mr-3" />
                        <span className="hidden md:inline font-bold text-sm md:text-lg text-gourmet-ink dark:text-dark-text whitespace-nowrap">
                        {appliedRangeLabel}
                        </span>
                    </div>
                    </motion.div>
                )}
              />
            </div>

            <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCreateClient}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                aria-label={profileUiText.createClient}
                title={profileUiText.createClient}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleStatus}
                disabled={selectedClients.size === 0 || isMutating}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={shouldPauseSelectedClients ? t.admin.pause : t.admin.resume}
                title={shouldPauseSelectedClients ? t.admin.pause : t.admin.resume}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  {shouldPauseSelectedClients ? (
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
                onClick={onDeleteSelected}
                disabled={selectedClients.size === 0 || isMutating}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
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
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={profileUiText.refresh || 'Refresh'}
                title={profileUiText.refresh || 'Refresh'}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <RotateCcw className={cn('w-5 h-5 text-gourmet-ink dark:text-dark-text', isRefreshing && 'animate-spin')} />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Sheet */}
        <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
          <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden relative flex-1 flex flex-col min-h-0">
            <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-gourmet-green-light dark:text-gourmet-green">
              <CookingPot className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
              <Utensils className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
            </div>

            <div className="overflow-auto relative flex-1 min-h-0">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20">
                    <TableHead className="w-[60px] px-6">
                      <Checkbox
                        checked={clients.length > 0 && selectedClients.size === clients.length}
                        onCheckedChange={onSelectAll}
                        className="border-gourmet-ink/20 dark:border-white/20"
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
                      <TableRow key={client.id} className="h-16 border-b-2 border-dashed border-gourmet-green/15 dark:border-white/5 hover:bg-gourmet-green/5 dark:hover:bg-dark-green/10 transition-colors">
                        <TableCell className="px-6">
                          <Checkbox
                            checked={selectedClients.has(client.id)}
                            onCheckedChange={() => onSelectClient(client.id)}
                            className="border-gourmet-ink/20 dark:border-white/20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-gourmet-ink dark:text-dark-text">{client.name}</div>
                          {client.nickName && <div className="text-sm font-medium text-gourmet-ink/40 dark:text-dark-text/40">{client.nickName}</div>}
                        </TableCell>
                        <TableCell className={cn('font-bold text-gourmet-ink dark:text-dark-text', cellBorder)}>{client.phone}</TableCell>
                        <TableCell className={cn('max-w-[300px] truncate font-medium text-gourmet-ink dark:text-dark-text', cellBorder)} title={client.address}>
                          {client.address}
                        </TableCell>
                        <TableCell className={cn('font-bold text-gourmet-ink dark:text-dark-text', cellBorder)}>
                            <Badge variant="outline" className="border-gourmet-ink/20 text-gourmet-ink dark:border-white/20 dark:text-dark-text font-bold">
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
                            className="hover:bg-gourmet-green/20 dark:hover:bg-dark-green/40 rounded-full transition-colors"
                          >
                            <Edit className="size-5 text-gourmet-ink dark:text-dark-text" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center font-bold text-gourmet-ink dark:text-dark-text text-xl">
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
    </TabsContent>
  )
}
