'use client'

import { motion } from 'framer-motion'
import {
    Package,
    Users,
    BarChart3,
    History,
    User,
    Trash2,
    DollarSign
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface MobileTabIndicatorProps {
    activeTab: string
}

export function MobileTabIndicator({ activeTab }: MobileTabIndicatorProps) {
    const { t } = useLanguage()

    const getTabInfo = (tab: string) => {
        switch (tab) {
            case 'orders':
                return { icon: Package, label: t.admin.orders, color: 'from-blue-500 to-cyan-500' }
            case 'clients':
                return { icon: Users, label: t.admin.clients, color: 'from-purple-500 to-pink-500' }
            case 'admins':
                return { icon: Users, label: t.admin.admins, color: 'from-orange-500 to-red-500' }
            case 'bin':
                return { icon: Trash2, label: t.admin.bin, color: 'from-red-500 to-rose-500' }
            case 'statistics':
                return { icon: BarChart3, label: t.admin.statistics, color: 'from-green-500 to-emerald-500' }
            case 'history':
                return { icon: History, label: t.admin.history, color: 'from-yellow-500 to-amber-500' }
            case 'profile':
                return { icon: User, label: t.common.profile, color: 'from-indigo-500 to-violet-500' }
            case 'warehouse':
                return { icon: Package, label: t.warehouse.title, color: 'from-teal-500 to-cyan-500' }
            case 'finance':
                return { icon: DollarSign, label: t.finance.title, color: 'from-green-500 to-lime-500' }
            default:
                return { icon: Package, label: 'Tab', color: 'from-gray-500 to-slate-500' }
        }
    }

    const tabInfo = getTabInfo(activeTab)
    const Icon = tabInfo.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeTab}
            className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-4 py-3"
        >
            <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tabInfo.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <motion.h2
                        key={tabInfo.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-semibold text-slate-900 dark:text-white"
                    >
                        {tabInfo.label}
                    </motion.h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        AutoFood Dashboard
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
