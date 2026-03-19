'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  RotateCcw,
  Trash2,
  Users,
  Utensils,
  Search,
  Filter,
  Package,
  History,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'

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

  const MetricCard = ({ label, value, sub, icon: Icon, color, dot }: any) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative rounded-[40px] border-2 border-dashed border-gourmet-green/20 dark:border-white/10 p-8 bg-white/40 dark:bg-dark-green/10 transition-all duration-300 overflow-hidden"
    >
        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
            {Icon && <Icon className="w-12 h-12 text-gourmet-ink dark:text-dark-text" />}
        </div>
        <div className="flex items-center gap-3 mb-4">
            <span className={cn("h-3 w-3 rounded-full", dot)} />
            <span className="text-sm font-black uppercase tracking-widest text-gourmet-ink/60 dark:text-dark-text/60">{label}</span>
        </div>
        <div className={cn("text-3xl font-black tracking-tighter", color)}>{value}</div>
        <p className="text-sm font-bold opacity-40 mt-2">{sub}</p>
    </motion.div>
  )

  return (
    <TabsContent value="bin" className="min-h-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="content-card flex-1 min-h-0 flex flex-col gap-8 md:gap-14 relative overflow-hidden px-4 md:px-14 py-8 md:py-16 transition-colors duration-300"
      >
        {/* Background Watermark */}
        <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none"
        >
            <Archive className="w-64 h-64 text-gourmet-ink dark:text-dark-text" />
        </motion.div>

        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 text-gourmet-ink dark:text-dark-text">
            <div className="flex flex-col gap-2">
                <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                    Data Archive
                </motion.h2>
                <motion.p className="text-sm md:text-base opacity-40 font-bold uppercase tracking-[0.3em]">
                    Safety Net & Recovery Center
                </motion.p>
            </div>

            <TabsList className="bg-white/40 dark:bg-dark-green/20 backdrop-blur-xl border border-white/20 p-1 rounded-[32px] h-14 md:h-16 flex items-center md:px-6 shadow-xl">
                <TabsTrigger 
                  value="orders" 
                  onClick={() => setActiveSubTab('orders')}
                  className="rounded-full px-8 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500"
                >
                    Orders
                </TabsTrigger>
                <TabsTrigger 
                  value="clients" 
                  onClick={() => setActiveSubTab('clients')}
                  className="rounded-full px-8 h-full data-[state=active]:bg-gourmet-green dark:data-[state=active]:bg-dark-green font-bold uppercase tracking-widest text-xs transition-all duration-500"
                >
                    Clients
                </TabsTrigger>
            </TabsList>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <MetricCard label="Archived Orders" value={deletedOrders.length} sub="Pending permanent cleanup" color="text-gourmet-ink" dot="bg-amber-500" icon={Utensils} />
            <MetricCard label="Archived Clients" value={deletedClients.length} sub="Exited from system" color="text-gourmet-ink" dot="bg-rose-500" icon={Users} />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
                <History className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
                <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-gourmet-ink dark:text-dark-text">Recycle Bin Items</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gourmet-ink/40" />
                    <Input 
                        className="h-10 w-48 rounded-2xl border-none bg-white/40 shadow-lg pl-9 font-medium" 
                        placeholder="Search bin..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <Button 
                  onClick={onRefresh} 
                  disabled={isRefreshing}
                  variant="outline" 
                  className="h-10 rounded-2xl bg-white/40 border-none px-4 shadow-lg"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                </Button>

                <div className="flex gap-2">
                    <Button 
                        onClick={activeSubTab === 'orders' ? onRestoreOrders : onRestoreClients}
                        disabled={activeSubTab === 'orders' ? selectedDeletedOrders.size === 0 : selectedDeletedClients.size === 0}
                        className="h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-lg uppercase text-[10px] tracking-widest"
                    >
                        <RotateCcw className="mr-2 w-4 h-4" />
                        Restore
                    </Button>
                    <Button 
                        onClick={activeSubTab === 'orders' ? onPermanentDeleteOrders : onPermanentDeleteClients}
                        disabled={activeSubTab === 'orders' ? selectedDeletedOrders.size === 0 : selectedDeletedClients.size === 0}
                        className="h-10 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 shadow-lg uppercase text-[10px] tracking-widest"
                    >
                        <Trash2 className="mr-2 w-4 h-4" />
                        Purge
                    </Button>
                </div>
            </div>
        </div>

        {/* List View */}
        <div className="flex-1 min-h-0 overflow-auto no-scrollbar rounded-[40px] border-2 border-dashed border-amber-500/20 bg-amber-500/5 p-4 md:p-8 relative z-10">
            <Tabs value={activeSubTab} className="h-full">
                <TabsContent value="orders" className="m-0 h-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-none hover:bg-transparent uppercase tracking-widest text-[10px] opacity-40 font-black">
                                <TableHead className="w-10">
                                  <Checkbox 
                                    checked={deletedOrders.length > 0 && selectedDeletedOrders.size === deletedOrders.length}
                                    onCheckedChange={() => onSelectAllDeletedOrders()}
                                  />
                                </TableHead>
                                <TableHead>Order #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Delivery Address</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredOrders.map((o) => (
                                    <motion.tr 
                                      key={o.id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="border-b border-amber-500/10 last:border-none hover:bg-white/40 transition-colors"
                                    >
                                        <TableCell>
                                          <Checkbox 
                                            checked={selectedDeletedOrders.has(o.id)}
                                            onCheckedChange={() => onSelectDeletedOrder(o.id)}
                                          />
                                        </TableCell>
                                        <TableCell className="font-bold tracking-tighter">#{o.orderNumber}</TableCell>
                                        <TableCell className="font-medium">{o.customer?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-xs opacity-60 max-w-xs truncate">{o.deliveryAddress}</TableCell>
                                        <TableCell>
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none uppercase text-[10px] font-black">Archived</Badge>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredOrders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                      <div className="flex flex-col items-center gap-4 opacity-30">
                                          <Package className="w-12 h-12" />
                                          <span className="font-black uppercase tracking-widest text-xs">No deleted orders</span>
                                      </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="clients" className="m-0 h-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-none hover:bg-transparent uppercase tracking-widest text-[10px] opacity-40 font-black">
                                <TableHead className="w-10">
                                  <Checkbox 
                                    checked={deletedClients.length > 0 && selectedDeletedClients.size === deletedClients.length}
                                    onCheckedChange={() => onSelectAllDeletedClients()}
                                  />
                                </TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Phone Contact</TableHead>
                                <TableHead>Calorie Plan</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredClients.map((c) => (
                                    <motion.tr 
                                      key={c.id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="border-b border-amber-500/10 last:border-none hover:bg-white/40 transition-colors"
                                    >
                                        <TableCell>
                                          <Checkbox 
                                            checked={selectedDeletedClients.has(c.id)}
                                            onCheckedChange={() => onSelectDeletedClient(c.id)}
                                          />
                                        </TableCell>
                                        <TableCell className="font-bold tracking-tight">{c.name}</TableCell>
                                        <TableCell className="font-mono text-xs opacity-60">{c.phone}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="border-gourmet-green/20 text-gourmet-green font-bold">
                                            {c.calories} kcal
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none uppercase text-[10px] font-black">Purgable</Badge>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredClients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                      <div className="flex flex-col items-center gap-4 opacity-30">
                                          <Users className="w-12 h-12" />
                                          <span className="font-black uppercase tracking-widest text-xs">No deleted clients</span>
                                      </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </div>

        {/* Warning Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-2 px-6 py-2 bg-rose-500/10 backdrop-blur-md rounded-full border border-rose-500/20 text-rose-600 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Permanent deletion is irreversible</span>
            </div>
        </div>
      </motion.div>
    </TabsContent>
  )
}
