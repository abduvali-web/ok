import { Button } from '@/components/ui/button'
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
    isGourmetStyle?: boolean
}

export function OrdersTable({
    orders,
    selectedOrders,
    onSelectOrder,
    onSelectAll,
    onDeleteSelected: _onDeleteSelected,
    onViewOrder: _onViewOrder,
    onEditOrder,
    isGourmetStyle
}: OrdersTableProps) {
    const { t, language } = useLanguage()

    if (isGourmetStyle) {
        const headCell = 'text-xs md:text-sm font-black uppercase tracking-[0.14em] text-foreground'
        const cellBorder = 'border-l-2 border-dashed border-border'

        return (
            <Table className="min-w-[1550px]">
                <TableHeader>
                    <TableRow className="h-12 bg-muted/60 dark:bg-muted/20">
                        <TableHead className="w-[60px] px-6">
                            <Checkbox
                                checked={orders.length > 0 && selectedOrders.size === orders.length}
                                onCheckedChange={onSelectAll}
                                className="border-border"
                            />
                        </TableHead>
                        <TableHead className={headCell}>{t.admin.table.number}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.client}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.address}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.time}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.type}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.amount}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.calories}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.features}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.courier}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.status}</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Priority</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>ETA</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>Updated</TableHead>
                        <TableHead className={cn(headCell, cellBorder)}>{t.admin.table.payment}</TableHead>
                        <TableHead className={cn(headCell, cellBorder, 'text-right pr-10')}>{t.admin.table.actions}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id} className="h-16 border-b-2 border-dashed border-border hover:bg-muted/5 dark:hover:bg-muted/10 transition-colors">
                            <TableCell className="px-6">
                                <Checkbox
                                    checked={selectedOrders.has(order.id)}
                                    onCheckedChange={() => onSelectOrder(order.id)}
                                    className="border-border"
                                />
                            </TableCell>
                            <TableCell className="font-bold text-foreground">#{order.orderNumber}</TableCell>
                            <TableCell className={cn('max-w-[200px]', cellBorder)}>
                                <div className="font-bold text-foreground truncate">{order.customer.name}</div>
                                <div className="text-sm font-medium text-muted-foreground/60 truncate">{order.customer.phone}</div>
                            </TableCell>
                            <TableCell className={cn('max-w-[250px] truncate font-medium text-foreground', cellBorder)}>
                                {order.deliveryAddress}
                            </TableCell>
                            <TableCell className={cn('font-bold text-foreground', cellBorder)}>{order.deliveryTime}</TableCell>
                            <TableCell className={cellBorder}>
                                <Badge variant="outline" className="border-border text-foreground font-bold">
                                    {order.isAutoOrder ? t.admin.auto : t.admin.manual}
                                </Badge>
                            </TableCell>
                            <TableCell className={cn('font-bold text-foreground', cellBorder)}>{order.quantity}</TableCell>
                            <TableCell className={cn('font-bold text-foreground', cellBorder)}>{order.calories}</TableCell>
                            <TableCell className={cn('max-w-[150px] truncate font-medium text-foreground', cellBorder)}>
                                {order.specialFeatures || '-'}
                            </TableCell>
                            <TableCell className={cn('max-w-[160px] truncate font-bold text-foreground', cellBorder)}>
                                {order.courierName || '-'}
                            </TableCell>
                            <TableCell className={cellBorder}>
                                <Badge variant={
                                    order.orderStatus === 'DELIVERED' ? 'default' :
                                        order.orderStatus === 'PENDING' ? 'secondary' :
                                            order.orderStatus === 'IN_DELIVERY' ? 'outline' : 'destructive'
                                } className="font-bold">
                                    {order.orderStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className={cn('font-bold text-foreground', cellBorder)}>{order.priority ?? 3}</TableCell>
                            <TableCell className={cn('font-bold text-foreground', cellBorder)}>
                                {order.etaMinutes ? `${order.etaMinutes} min` : '-'}
                            </TableCell>
                            <TableCell className={cn('text-xs font-bold text-muted-foreground/60', cellBorder)}>
                                {order.statusChangedAt
                                    ? new Date(order.statusChangedAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                    : '-'}
                            </TableCell>
                            <TableCell className={cellBorder}>
                                <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'} className="font-bold">
                                    {order.paymentStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className={cn('text-right pr-10', cellBorder)}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEditOrder?.(order)}
                                    className="hover:bg-muted/20 dark:hover:bg-muted/40 rounded-full transition-colors"
                                >
                                    <Edit className="size-5 text-foreground" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {orders.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={16} className="h-40 text-center font-bold text-foreground text-xl">
                                {t.admin.noOrders}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
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
                                <TableCell className="py-1.5 max-w-[200px]">
                                    <div className="truncate" title={order.customer.name}>
                                        {order.customer.name}
                                    </div>
                                    <div className="truncate text-sm text-muted-foreground" title={order.customer.phone}>
                                        {order.customer.phone}
                                    </div>
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
                                <TableCell className="max-w-[160px] truncate py-1.5" title={order.courierName || ''}>
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
                                    <IconButton
                                        label={t.admin.edit}
                                        variant="outline"
                                        iconSize="sm"
                                        onClick={() => onEditOrder?.(order)}
                                    >
                                        <Edit className="size-4" />
                                    </IconButton>
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
        </div>
    )
}
