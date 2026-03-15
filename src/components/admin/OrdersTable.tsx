import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Edit, Calendar, MapPin, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

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
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="h-9">
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                                    onCheckedChange={onSelectAll}
                                />
                            </TableHead>
                            <TableHead>{t.admin.table.number}</TableHead>
                            <TableHead>{t.admin.table.client}</TableHead>
                            <TableHead>{t.admin.table.address}</TableHead>
                            <TableHead>{t.admin.table.time}</TableHead>
                            <TableHead>{t.admin.table.type}</TableHead>
                            <TableHead>{t.admin.table.amount}</TableHead>
                            <TableHead>{t.admin.table.calories}</TableHead>
                            <TableHead>{t.admin.table.features}</TableHead>
                            <TableHead>{t.admin.table.courier}</TableHead>
                            <TableHead>{t.admin.table.status}</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>ETA</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead>{t.admin.table.payment}</TableHead>
                            <TableHead className="text-right">{t.admin.table.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="h-10">
                                <TableCell className="py-1.5">
                                    <Checkbox
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => onSelectOrder(order.id)}
                                    />
                                </TableCell>
                                <TableCell className="py-1.5 font-medium">#{order.orderNumber}</TableCell>
                                <TableCell className="py-1.5">
                                    <div>{order.customer.name}</div>
                                    <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate py-1.5" title={order.deliveryAddress}>
                                    {order.deliveryAddress}
                                </TableCell>
                                <TableCell className="py-1.5">{order.deliveryTime}</TableCell>
                                <TableCell className="py-1.5">
                                    <Badge variant="outline">
                                        {order.isAutoOrder ? t.admin.auto : t.admin.manual}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5">{order.quantity}</TableCell>
                                <TableCell className="py-1.5">{order.calories}</TableCell>
                                <TableCell className="max-w-[150px] truncate py-1.5" title={order.specialFeatures}>
                                    {order.specialFeatures || '-'}
                                </TableCell>
                                <TableCell className="py-1.5">
                                    {order.courierName || '-'}
                                </TableCell>
                                <TableCell className="py-1.5">
                                    <Badge variant={
                                        order.orderStatus === 'DELIVERED' ? 'default' :
                                            order.orderStatus === 'PENDING' ? 'secondary' :
                                                order.orderStatus === 'IN_DELIVERY' ? 'outline' : 'destructive'
                                    }>
                                        {order.orderStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5">{order.priority ?? 3}</TableCell>
                                <TableCell className="py-1.5">{order.etaMinutes ? `${order.etaMinutes} min` : '-'}</TableCell>
                                <TableCell className="py-1.5 text-xs text-muted-foreground">
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
                                    <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-1.5 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditOrder?.(order)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={16} className="h-24 text-center">
                                    {t.admin.noOrders}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {orders.length === 0 ? (
                    <div className="rounded-md border border-dashed bg-card py-8 text-center text-muted-foreground">
                        {t.admin.noOrders}
                    </div>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="border bg-card">
                            <CardHeader className="p-3 pb-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={selectedOrders.has(order.id)}
                                            onCheckedChange={() => onSelectOrder(order.id)}
                                            className="h-5 w-5"
                                        />
                                        <span className="font-semibold text-sm">#{order.orderNumber}</span>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`${order.orderStatus === 'DELIVERED'
                                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                            : order.orderStatus === 'PENDING'
                                                ? 'border-amber-500/30 text-amber-600 dark:text-amber-400'
                                                : order.orderStatus === 'IN_DELIVERY'
                                                    ? 'border-sky-500/30 text-sky-600 dark:text-sky-400'
                                                    : 'border-rose-500/30 text-rose-600 dark:text-rose-400'
                                            }`}
                                    >
                                        {order.orderStatus}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-3 space-y-2.5">
                                {/* Customer Info */}
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{order.customer.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{order.customer.phone}</div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="text-sm line-clamp-2 leading-tight">{order.deliveryAddress}</div>
                                </div>

                                {/* Time Information */}
                                <div className="flex items-center gap-2.5">
                                    <div className="rounded-full bg-muted p-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div className="text-xs font-medium">
                                        {order.deliveryTime}
                                        {order.deliveryDate && <span className="text-muted-foreground font-normal"> • {order.deliveryDate}</span>}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-2 mt-2 border-t gap-2">
                                    <Badge
                                        variant="outline"
                                        className={order.paymentStatus === 'PAID'
                                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                            : 'border-rose-500/30 text-rose-600 dark:text-rose-400'}
                                    >
                                        {order.paymentStatus === 'PAID' ? t.common.paid : t.common.notPaid}
                                    </Badge>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">P{order.priority ?? 3}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => onEditOrder?.(order)}
                                            aria-label={t.admin.edit}
                                            title={t.admin.edit}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
