'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  RotateCcw,
  Trash2,
  Users,
  Utensils,
  Search,
  Package,
  History,
  AlertTriangle,
  Cherry,
  CookingPot,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useMemo } from 'react'

interface BinTabProps {
  deletedOrders: any[]
  deletedClients: any[]
  selectedDeletedOrders: Set<string>
  selectedDeletedClients: Set<string>
  onSelectDeletedOrder: (id: string) => void
  onSelectDeletedClient: (id: string) => void
  onSelectAllDeletedOrders: () => void
  onSelectAllDeletedClients: () => void
  onRestoreOrders: () => void
  onRestoreClients: () => void
  onPermanentDeleteOrders: () => void
  onPermanentDeleteClients: () => void
  isRestoring: boolean
  isPermanentlyDeleting: boolean
  onRefresh: () => void
  isRefreshing: boolean
}

export function BinTab({
  deletedOrders,
  deletedClients,
  selectedDeletedOrders,
  selectedDeletedClients,
  onSelectDeletedOrder,
  onSelectDeletedClient,
  onSelectAllDeletedOrders,
  onSelectAllDeletedClients,
  onRestoreOrders,
  onRestoreClients,
  onPermanentDeleteOrders,
  onPermanentDeleteClients,
  isRestoring,
  isPermanentlyDeleting,
  onRefresh,
  isRefreshing,
}: BinTabProps) {
  const { t, language } = useLanguage()
  const [activeSubTab, setActiveSubTab] = useState('orders')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return deletedOrders
    return deletedOrders.filter((o) => (
      o.customer?.name?.toLowerCase().includes(q) ||
      o.deliveryAddress?.toLowerCase().includes(q) ||
      String(o.orderNumber).includes(q)
    ))
  }, [deletedOrders, searchTerm])

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return deletedClients
    return deletedClients.filter((c) => (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    ))
  }, [deletedClients, searchTerm])

  const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-foreground'
  const cellBorder = 'border-l-2 border-dashed border-border'

  return (
    <TabsContent value="bin" className="min-h-0">
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
          <Archive className="w-56 h-56 md:w-64 md:h-64 text-foreground" />
        </motion.div>

        {/* Title */}
        <div className="flex flex-col gap-2 relative z-10">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight"
          >
            Data Archive
          </motion.h2>
          <motion.p
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-foreground font-medium"
          >
            Safety Net & Recovery Center
          </motion.p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6 relative z-10">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative flex-1 bg-primary rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300"
          >
            <div className="rounded-full border-2 border-dashed border-white/30 flex items-center px-4 md:px-6 py-2 md:py-3">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-foreground mr-3 md:mr-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search archive..."
                className="w-full bg-transparent py-0 !text-base md:!text-lg focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto lg:overflow-visible py-4 lg:py-6 no-scrollbar">
            {/* Sub-tab toggle */}
            <div className="flex bg-primary/80 rounded-full shadow-xl border-b-4 border-black/20 p-1 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="refSm"
                onClick={() => setActiveSubTab('orders')}
                className={cn(
                  'uppercase tracking-widest',
                  activeSubTab === 'orders'
                    ? 'bg-white/20 text-foreground shadow-lg'
                    : 'text-muted-foreground/60 hover:text-foreground'
                )}
              >
                Orders
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="refSm"
                onClick={() => setActiveSubTab('clients')}
                className={cn(
                  'uppercase tracking-widest',
                  activeSubTab === 'clients'
                    ? 'bg-white/20 text-foreground shadow-lg'
                    : 'text-muted-foreground/60 hover:text-foreground'
                )}
              >
                Clients
              </Button>
            </div>

            <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={activeSubTab === 'orders' ? onRestoreOrders : onRestoreClients}
                disabled={activeSubTab === 'orders' ? selectedDeletedOrders.size === 0 : selectedDeletedClients.size === 0}
                className="w-[50px] h-[50px] bg-emerald-600 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Restore"
                title="Restore selected"
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.15, y: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={activeSubTab === 'orders' ? onPermanentDeleteOrders : onPermanentDeleteClients}
                disabled={activeSubTab === 'orders' ? selectedDeletedOrders.size === 0 : selectedDeletedClients.size === 0}
                className="w-[50px] h-[50px] bg-rose-600 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Purge"
                title="Permanently delete"
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ rotate: 180, scale: 1.1, y: 5 }}
                whileTap={{ scale: 0.8 }}
                onClick={onRefresh}
                disabled={isRefreshing}
                className="w-[50px] h-[50px] bg-primary rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 group transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none"
                aria-label="Refresh"
                title="Refresh"
              >
                <div className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <RotateCcw className={cn('w-5 h-5 text-foreground', isRefreshing && 'animate-spin')} />
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-border p-6 md:p-8 bg-muted/40 dark:bg-muted/10 hover:bg-muted/10 dark:hover:bg-muted/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Utensils className="w-12 h-12 text-foreground" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-amber-500" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground/60">Archived Orders</span>
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">{deletedOrders.length}</div>
            <p className="text-sm md:text-lg font-bold text-muted-foreground/40 mt-2">Pending permanent cleanup</p>
            <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-amber-500" />
          </motion.div>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl md:rounded-[40px] border-2 border-dashed border-border p-6 md:p-8 bg-muted/40 dark:bg-muted/10 hover:bg-muted/10 dark:hover:bg-muted/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-12 h-12 text-foreground" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-3 w-3 rounded-full shadow-lg bg-rose-500" />
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground/60">Archived Clients</span>
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">{deletedClients.length}</div>
            <p className="text-sm md:text-lg font-bold text-muted-foreground/40 mt-2">Exited from system</p>
            <div className="absolute bottom-0 left-0 h-2 w-0 group-hover:w-full transition-all duration-500 bg-rose-500" />
          </motion.div>
        </div>

        {/* Table Sheet */}
        <div className="flex flex-col gap-4 md:gap-6 relative z-10 flex-1 min-h-0">
          <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-border overflow-hidden relative flex-1 flex flex-col min-h-0">
            <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-primary">
              <Cherry className="w-10 h-10 md:w-14 md:h-14 rotate-12" />
              <CookingPot className="w-10 h-10 md:w-14 md:h-14 -rotate-12" />
            </div>

            <div className="overflow-auto relative flex-1 min-h-0">
              <Tabs value={activeSubTab} className="h-full">
                <TabsContent value="orders" className="m-0 h-full">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="h-12 bg-muted/60 dark:bg-muted/20 cursor-default">
                        <TableHead className="w-[60px] px-6">
                          <Checkbox
                            checked={deletedOrders.length > 0 && selectedDeletedOrders.size === deletedOrders.length}
                            onCheckedChange={() => onSelectAllDeletedOrders()}
                            className="border-border"
                          />
                        </TableHead>
                        <TableHead className={cn(headCell, 'pl-4')}>Order #</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Client</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Delivery Address</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredOrders.map((o, idx) => (
                          <motion.tr
                            key={o.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                              'h-12 transition-colors border-t border-border',
                              idx % 2 === 0
                                ? 'bg-card'
                                : 'bg-muted/40',
                              'hover:bg-muted',
                              selectedDeletedOrders.has(o.id) && 'bg-muted'
                            )}
                          >
                            <TableCell className="px-6">
                              <Checkbox
                                checked={selectedDeletedOrders.has(o.id)}
                                onCheckedChange={() => onSelectDeletedOrder(o.id)}
                                className="border-border"
                              />
                            </TableCell>
                            <TableCell className="pl-4 font-bold text-foreground tracking-tighter">#{o.orderNumber}</TableCell>
                            <TableCell className={cn('font-medium text-foreground', cellBorder)}>{o.customer?.name || 'Unknown'}</TableCell>
                            <TableCell className={cn('text-sm font-medium text-muted-foreground/70 max-w-xs truncate', cellBorder)}>{o.deliveryAddress}</TableCell>
                            <TableCell className={cellBorder}>
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none uppercase text-[10px] font-black dark:bg-amber-500/20 dark:text-amber-400">Archived</Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {filteredOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center">
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground/60">
                              <Package className="size-4" />
                              No deleted orders
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="clients" className="m-0 h-full">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="h-12 bg-muted/60 dark:bg-muted/20 cursor-default">
                        <TableHead className="w-[60px] px-6">
                          <Checkbox
                            checked={deletedClients.length > 0 && selectedDeletedClients.size === deletedClients.length}
                            onCheckedChange={() => onSelectAllDeletedClients()}
                            className="border-border"
                          />
                        </TableHead>
                        <TableHead className={cn(headCell, 'pl-4')}>Full Name</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Phone Contact</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Calorie Plan</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredClients.map((c, idx) => (
                          <motion.tr
                            key={c.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                              'h-12 transition-colors border-t border-border',
                              idx % 2 === 0
                                ? 'bg-card'
                                : 'bg-muted/40',
                              'hover:bg-muted',
                              selectedDeletedClients.has(c.id) && 'bg-muted'
                            )}
                          >
                            <TableCell className="px-6">
                              <Checkbox
                                checked={selectedDeletedClients.has(c.id)}
                                onCheckedChange={() => onSelectDeletedClient(c.id)}
                                className="border-border"
                              />
                            </TableCell>
                            <TableCell className="pl-4 font-bold text-foreground tracking-tight">{c.name}</TableCell>
                            <TableCell className={cn('font-medium text-muted-foreground/70', cellBorder)}>{c.phone}</TableCell>
                            <TableCell className={cellBorder}>
                              <Badge variant="outline" className="border-border text-foreground font-bold">
                                {c.calories} kcal
                              </Badge>
                            </TableCell>
                            <TableCell className={cellBorder}>
                              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none uppercase text-[10px] font-black dark:bg-rose-500/20 dark:text-rose-400">Purgable</Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {filteredClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center">
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground/60">
                              <Users className="size-4" />
                              No deleted clients
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Warning Indicator */}
        <div className="flex justify-center relative z-10">
          <div className="flex items-center gap-2 px-6 py-2 bg-rose-500/10 backdrop-blur-md rounded-full border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Permanent deletion is irreversible</span>
          </div>
        </div>
      </motion.div>
    </TabsContent>
  )
}
