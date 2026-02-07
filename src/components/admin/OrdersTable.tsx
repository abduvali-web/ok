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
import { Trash2, Eye, Edit, Calendar, MapPin, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    onDeleteSelected,
    onViewOrder,
    onEditOrder
}: OrdersTableProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{t.admin.orders}</h2>
                {selectedOrders.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t.admin.deleteSelected} ({selectedOrders.size})
                    </Button>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                            <TableHead>{t.admin.table.payment}</TableHead>
                            <TableHead className="text-right">{t.admin.table.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedOrders.has(order.id)}
                                        onCheckedChange={() => onSelectOrder(order.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                <TableCell>
                                    <div>{order.customer.name}</div>
                                    <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={order.deliveryAddress}>
                                    {order.deliveryAddress}
                                </TableCell>
                                <TableCell>{order.deliveryTime}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {order.isAutoOrder ? t.admin.auto : t.admin.manual}
                                    </Badge>
                                </TableCell>
                                <TableCell>{order.quantity}</TableCell>
                                <TableCell>{order.calories}</TableCell>
                                <TableCell className="max-w-[150px] truncate" title={order.specialFeatures}>
                                    {order.specialFeatures || '-'}
                                </TableCell>
                                <TableCell>
                                    {order.courierName || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        order.orderStatus === 'DELIVERED' ? 'default' :
                                            order.orderStatus === 'PENDING' ? 'secondary' :
                                                order.orderStatus === 'IN_DELIVERY' ? 'outline' : 'destructive'
                                    }>
                                        {order.orderStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                                        {order.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onViewOrder?.(order)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onEditOrder?.(order)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={13} className="h-24 text-center">
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
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        {t.admin.noOrders}
                    </div>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border shadow-sm">
                            <CardHeader className="p-3 bg-muted/30 pb-2">
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
                                        className={`${order.orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                            order.orderStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                order.orderStatus === 'IN_DELIVERY' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                    >
                                        {order.orderStatus}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-3 space-y-2.5">
                                {/* Customer Info */}
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{order.customer.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{order.customer.phone}</div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full">
                                        <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="text-sm line-clamp-2 leading-tight">{order.deliveryAddress}</div>
                                </div>

                                {/* Time Information */}
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                                        className={order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                                    >
                                        {order.paymentStatus === 'PAID' ? t.common.paid : t.common.notPaid}
                                    </Badge>

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="h-10 px-4 flex-1" onClick={() => onViewOrder?.(order)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button variant="secondary" className="h-10 w-10 p-0 shrink-0" onClick={() => onEditOrder?.(order)}>
                                            <Edit className="w-4 h-4" />
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
