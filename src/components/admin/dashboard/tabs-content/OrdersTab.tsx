'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabsContent } from '@/components/ui/tabs'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { CalendarDateSelector } from '@/components/admin/dashboard/shared/CalendarDateSelector'
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
    // This is a bit redundant since we have CalendarDateSelector, 
    // but following AdminsTab pattern of showing it in the button.
    return selectedPeriodLabel || 'All time'
  }, [selectedPeriodLabel])

  return (
    <TabsContent value="orders" className="min-h-0">
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
          <Utensils className="w-56 h-56 md:w-64 md:h-64 text-gourmet-ink dark:text-dark-text" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-gourmet-ink dark:text-dark-text tracking-tight"
          >
            {t.admin.manageOrders}
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-gourmet-ink dark:text-dark-text font-medium"
          >
            {t.admin.manageOrdersDesc}
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
                placeholder={profileUiText.searchOrdersPlaceholder || "Qidirish..."}
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
                onClick={onCreateOrder}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300"
                aria-label={t.admin.createOrder}
                title={t.admin.createOrder}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDispatchOpen}
                disabled={!selectedDate}
                className="w-[50px] h-[50px] bg-gourmet-green dark:bg-dark-green rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50"
                aria-label={dispatchActionLabel}
                title={dispatchActionLabel}
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <DispatchActionIcon className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDeleteSelected}
                disabled={selectedOrders.size === 0 || isDeleting}
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
    </TabsContent>
  )
}
