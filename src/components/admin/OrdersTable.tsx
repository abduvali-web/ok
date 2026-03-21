'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { IconButton } from '@/components/ui/icon-button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Order {
    id: string
    orderNumber: number
    customer: {
        name: string
        phone: string
    }
    deliveryAddress: string
    latitude?: number
    longitude?: number
    deliveryTime: string
    quantity: number
    calories: number
    specialFeatures: string
    paymentStatus: string
    paymentMethod: string
    orderStatus: string
    isPrepaid: boolean
    priority?: number
    etaMinutes?: number | null
    statusChangedAt?: string
    createdAt: string
    deliveryDate?: string
    isAutoOrder?: boolean
    customerName?: string
    customerPhone?: string
    courierId?: string
    courierName?: string
}

interface OrdersTableProps {
    orders: Order[]
    selectedOrders: Set<string>
    onSelectOrder: (id: string) => void
    onSelectAll: () => void
    onDeleteSelected: () => void
    onViewOrder?: (order: Order) => void
    onEditOrder?: (order: Order) => void
}

export function OrdersTable({
    orders,
    selectedOrders,
    onSelectOrder,
    onSelectAll,
    onDeleteSelected: _onDeleteSelected,
    onViewOrder: _onViewOrder,
    onEditOrder
}: OrdersTableProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl md:rounded-3xl border-2 border-dashed border-gourmet-green/30 dark:border-white/10 overflow-hidden relative"
            >
                {/* Background decoration */}
                <div className="absolute inset-0 flex justify-between px-10 md:px-20 opacity-5 pointer-events-none text-gourmet-green-light dark:text-gourmet-green">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-current" />
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-current" />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="h-12 bg-gourmet-cream/60 dark:bg-dark-green/20 cursor-pointer select-none hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                                    onCheckedChange={onSelectAll}
                                />
                            </TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.number}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.client}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.address}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.time}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.type}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.amount}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.calories}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.features}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.courier}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.status}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">Priority</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">ETA</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">Updated</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text">{t.admin.table.payment}</TableHead>
                            <TableHead className="text-xs md:text-sm font-black uppercase tracking-[0.14em] text-gourmet-ink dark:text-dark-text text-right">{t.admin.table.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order, index) => (
                            <motion.tr
                                key={order.id}
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
                                <TableCell className="py-1.5">
                                    <Checkbox
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => onSelectOrder(order.id)}
                                    />
                                </TableCell>
                                <TableCell className="py-1.5 font-bold text-gourmet-ink dark:text-dark-text">#{order.orderNumber}</TableCell>
                                <TableCell className="py-1.5 max-w-[200px]">
                                    <div className="truncate font-medium text-gourmet-ink dark:text-dark-text" title={order.customer.name}>
                                        {order.customer.name}
                                    </div>
                                    <div className="truncate text-sm text-gourmet-ink/70 dark:text-dark-text/70" title={order.customer.phone}>
                                        {order.customer.phone}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate py-1.5 text-gourmet-ink dark:text-dark-text" title={order.deliveryAddress}>
                                    {order.deliveryAddress}
                                </TableCell>
                                <TableCell className="py-1.5 text-gourmet-ink dark:text-dark-text">{order.deliveryTime}</TableCell>
                                <TableCell className="py-1.5">
                                    <Badge variant="outline" className="border-gourmet-green/25 dark:border-white/10 bg-gourmet-cream/50 dark:bg-dark-surface/30">
                                        {order.isAutoOrder ? t.admin.auto : t.admin.manual}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5 font-medium text-gourmet-ink dark:text-dark-text">{order.quantity}</TableCell>
                                <TableCell className="py-1.5 font-medium text-gourmet-ink dark:text-dark-text">{order.calories}</TableCell>
                                <TableCell className="max-w-[150px] truncate py-1.5 text-gourmet-ink/70 dark:text-dark-text/70" title={order.specialFeatures}>
                                    {order.specialFeatures || '-'}
                                </TableCell>
                                <TableCell className="max-w-[160px] truncate py-1.5 text-gourmet-ink dark:text-dark-text" title={order.courierName || ''}>
                                    {order.courierName || '-'}
                                </TableCell>
                                <TableCell className="py-1.5">
                                    <Badge variant={
                                        order.orderStatus === 'DELIVERED' ? 'success' :
                                            order.orderStatus === 'PENDING' ? 'secondary' :
                                                order.orderStatus === 'IN_DELIVERY' ? 'outline' : 'destructive'
                                    }>
                                        {order.orderStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5 font-medium text-gourmet-ink dark:text-dark-text">{order.priority ?? 3}</TableCell>
                                <TableCell className="py-1.5 text-gourmet-ink dark:text-dark-text">{order.etaMinutes ? `${order.etaMinutes} min` : '-'}</TableCell>
                                <TableCell className="py-1.5 text-xs text-gourmet-ink/60 dark:text-dark-text/60">
                                    {order.statusChangedAt
                                        ? new Date(order.statusChangedAt).toLocaleString('ru-RU', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : '-'}
                                </TableCell>
                                <TableCell className="py-1.5">
                                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'destructive'}>
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5 text-right">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onEditOrder?.(order)}
                                        className="w-8 h-8 rounded-full bg-gourmet-green dark:bg-dark-green border-b-4 border-black/20 flex items-center justify-center shadow-xl transition-colors duration-300"
                                    >
                                        <Edit className="w-4 h-4 text-gourmet-ink dark:text-dark-text" />
                                    </motion.button>
                                </TableCell>
                            </motion.tr>
                        ))}
                        {orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={16} className="h-24 text-center text-gourmet-ink/60 dark:text-dark-text/60">
                                    {t.admin.noOrders}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </div>
    )
}
