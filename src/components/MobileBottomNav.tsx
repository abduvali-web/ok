'use client'

import { motion } from 'framer-motion'
import {
    Package,
    BarChart3,
    Users,
    History,
    User,
    Truck,
    Settings,
    DollarSign,
    Calculator,
    Trash2
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Tab {
    id: string
    icon: React.ReactNode
    label: string
}

interface MobileBottomNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
    variant?: 'admin' | 'courier'
}

export function MobileBottomNav({ activeTab, onTabChange, variant = 'admin' }: MobileBottomNavProps) {
    const { t } = useLanguage()

    const adminTabs: Tab[] = [
        { id: 'statistics', icon: <BarChart3 className="w-5 h-5" />, label: t.admin.statistics },
        { id: 'orders', icon: <Package className="w-5 h-5" />, label: t.admin.orders },
        { id: 'clients', icon: <Users className="w-5 h-5" />, label: t.admin.clients },
        { id: 'couriers', icon: <Truck className="w-5 h-5" />, label: t.admin.couriers },
    ]

    const courierTabs: Tab[] = [
        { id: 'orders', icon: <Package className="w-5 h-5" />, label: t.courier.orders },
        { id: 'history', icon: <History className="w-5 h-5" />, label: t.courier.history },
        { id: 'profile', icon: <User className="w-5 h-5" />, label: t.courier.profile },
    ]

    const tabs = variant === 'courier' ? courierTabs : adminTabs

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
            <div className="flex justify-around items-center h-16 px-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBg"
                                    className="absolute inset-x-1 top-1 bottom-1 bg-primary/10 rounded-xl"
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                />
                            )}
                            <div className={`relative z-10 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {tab.icon}
                            </div>
                            <span className={`relative z-10 text-xs mt-1 font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute -bottom-0 w-8 h-1 bg-primary rounded-full"
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}

// Additional tabs menu component for accessing more tabs
interface MobileMoreTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showMoreMenu: boolean
    onToggleMore: () => void
}

export function MobileMoreTabs({ activeTab, onTabChange, showMoreMenu, onToggleMore }: MobileMoreTabsProps) {
    const { t } = useLanguage()

    const moreTabs: Tab[] = [
        { id: 'admins', icon: <Users className="w-5 h-5" />, label: t.admin.admins },
        { id: 'finance', icon: <DollarSign className="w-5 h-5" />, label: t.finance.title },
        { id: 'warehouse', icon: <Calculator className="w-5 h-5" />, label: t.warehouse.title },
        { id: 'bin', icon: <Trash2 className="w-5 h-5" />, label: t.admin.bin },
        { id: 'interface', icon: <Settings className="w-5 h-5" />, label: t.admin.interface },
        { id: 'history', icon: <History className="w-5 h-5" />, label: t.admin.history },
    ]

    if (!showMoreMenu) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="md:hidden fixed bottom-20 left-4 right-4 z-50 bg-background rounded-2xl shadow-xl border border-border p-4 safe-area-bottom"
        >
            <div className="grid grid-cols-3 gap-3">
                {moreTabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                onTabChange(tab.id)
                                onToggleMore()
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {tab.icon}
                            <span className="text-xs mt-1 font-medium">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}
