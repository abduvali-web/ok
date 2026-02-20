import { Package, Users, CalendarDays, TrendingUp, TrendingDown, Clock, Truck } from 'lucide-react'

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
            description: 'Доставлено',
            Icon: TrendingUp,
            accent: 'text-emerald-600',
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
        },
        {
            title: 'В доставке',
            value: stats?.inDeliveryOrders ?? 0,
            description: 'Активные сейчас',
            Icon: Truck,
            accent: 'text-blue-600',
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
        },
        {
            title: 'Клиенты',
            value: stats?.dailyCustomers ?? 0,
            description: 'Ежедневные подписки',
            Icon: Users,
            accent: 'text-violet-600',
            bg: 'bg-violet-50',
            iconBg: 'bg-violet-100',
        },
        {
            title: 'Ожидают',
            value: stats?.pendingOrders ?? 0,
            description: 'В очереди',
            Icon: Clock,
            accent: 'text-amber-600',
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
        },
    ] as const

    return (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {cards.map(({ title, value, description, Icon, accent, iconBg }, i) => (
                <div
                    key={title}
                    className={`animate-fade-in-up stagger-${i + 1} group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-elegant`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{title}</span>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                            <Icon className={`h-4 w-4 ${accent}`} aria-hidden="true" />
                        </div>
                    </div>
                    <div className={`mt-3 text-2xl font-bold ${accent} animate-count-up`}>
                        {value}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
                </div>
            ))}
        </div>
    )
}
