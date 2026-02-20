'use client'

import { motion } from 'framer-motion'
import { BarChart3, DollarSign, History, Package, Settings, Trash2, User, Users } from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'

interface MobileTabIndicatorProps {
  activeTab: string
}

const TAB_CONFIG: Record<string, { icon: typeof Package; accent: string }> = {
  orders: { icon: Package, accent: 'bg-teal-500' },
  clients: { icon: Users, accent: 'bg-cyan-500' },
  admins: { icon: Users, accent: 'bg-amber-500' },
  bin: { icon: Trash2, accent: 'bg-rose-500' },
  statistics: { icon: BarChart3, accent: 'bg-emerald-500' },
  history: { icon: History, accent: 'bg-yellow-500' },
  interface: { icon: Settings, accent: 'bg-slate-500' },
  profile: { icon: User, accent: 'bg-sky-500' },
  warehouse: { icon: Package, accent: 'bg-emerald-500' },
  finance: { icon: DollarSign, accent: 'bg-lime-500' },
}

export function MobileTabIndicator({ activeTab }: MobileTabIndicatorProps) {
  const { t } = useLanguage()

  const getLabel = (tab: string) => {
    const labels: Record<string, string> = {
      orders: t.admin.orders,
      clients: t.admin.clients,
      admins: t.admin.admins,
      bin: t.admin.bin,
      statistics: t.admin.statistics,
      history: t.admin.history,
      interface: t.admin.interface,
      profile: t.common.profile,
      warehouse: t.warehouse.title,
      finance: t.finance.title,
    }
    return labels[tab] || 'Tab'
  }

  const config = TAB_CONFIG[activeTab] || { icon: Package, accent: 'bg-slate-500' }
  const Icon = config.icon
  const label = getLabel(activeTab)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      key={activeTab}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="sticky top-0 z-30 border-b border-border/60 bg-card/90 px-4 py-3 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.accent} shadow-smooth`}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <motion.h2
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {label}
          </motion.h2>
          <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">AutoFood</p>
        </div>
      </div>
    </motion.div>
  )
}
