import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, CalendarDays } from 'lucide-react'

interface Stats {
    successfulOrders: number
    failedOrders: number
    pendingOrders: number
    inDeliveryOrders: number
    dailyCustomers: number
}

interface StatsCardsProps {
    stats: Stats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: 'Успешные заказы',
            value: stats?.successfulOrders ?? 0,
            description: '+20.1% с прошлого месяца',
            Icon: Package,
        },
        {
            title: 'В доставке',
            value: stats?.inDeliveryOrders ?? 0,
            description: 'Активные заказы сейчас',
            Icon: Package,
        },
        {
            title: 'Клиенты (Ежедневно)',
            value: stats?.dailyCustomers ?? 0,
            description: 'Активные подписки',
            Icon: Users,
        },
        {
            title: 'Ожидают',
            value: stats?.pendingOrders ?? 0,
            description: 'Заказы в очереди',
            Icon: CalendarDays,
        },
    ] as const

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {cards.map(({ title, value, description, Icon }) => (
                <Card key={title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
