'use client'

import { motion } from 'framer-motion'
import { BarChart3, DollarSign, History, Package, Settings, Trash2, User, Users } from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'

interface MobileTabIndicatorProps {
  activeTab: string
}

export function MobileTabIndicator({ activeTab }: MobileTabIndicatorProps) {
  const { t } = useLanguage()

  const getTabInfo = (tab: string) => {
    switch (tab) {
      case 'orders':
        return { icon: Package, label: t.admin.orders, color: 'from-teal-500 to-emerald-500' }
      case 'clients':
        return { icon: Users, label: t.admin.clients, color: 'from-cyan-500 to-teal-500' }
      case 'admins':
        return { icon: Users, label: t.admin.admins, color: 'from-amber-500 to-orange-500' }
      case 'bin':
        return { icon: Trash2, label: t.admin.bin, color: 'from-rose-500 to-red-500' }
      case 'statistics':
        return { icon: BarChart3, label: t.admin.statistics, color: 'from-emerald-500 to-lime-500' }
      case 'history':
        return { icon: History, label: t.admin.history, color: 'from-yellow-500 to-amber-500' }
      case 'interface':
        return { icon: Settings, label: t.admin.interface, color: 'from-slate-500 to-slate-700' }
      case 'profile':
        return { icon: User, label: t.common.profile, color: 'from-sky-500 to-cyan-500' }
      case 'warehouse':
        return { icon: Package, label: t.warehouse.title, color: 'from-emerald-500 to-cyan-500' }
      case 'finance':
        return { icon: DollarSign, label: t.finance.title, color: 'from-lime-500 to-emerald-500' }
      default:
        return { icon: Package, label: 'Tab', color: 'from-slate-500 to-slate-600' }
    }
  }

  const tabInfo = getTabInfo(activeTab)
  const Icon = tabInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      key={activeTab}
      className="sticky top-0 z-30 border-b border-border/70 bg-card/85 px-4 py-3 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tabInfo.color} shadow-smooth`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <motion.h2
            key={tabInfo.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {tabInfo.label}
          </motion.h2>
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">AutoFood dashboard</p>
        </div>
      </div>
    </motion.div>
  )
}
