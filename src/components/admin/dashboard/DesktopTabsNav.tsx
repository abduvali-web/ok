'use client'

import { BarChart3, DollarSign, History, Package, Settings, Trash2, User, Users } from 'lucide-react'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type CanonicalTabId } from '@/components/admin/dashboard/tabs'

type Copy = {
  orders: string
  clients: string
  admins: string
  bin: string
  statistics: string
  history: string
  profile: string
  warehouse: string
  finance: string
  interface: string
}

const TAB_META: Record<string, { icon: typeof Package; accent: string }> = {
  orders: { icon: Package, accent: 'data-[state=active]:text-teal-600' },
  clients: { icon: Users, accent: 'data-[state=active]:text-cyan-600' },
  admins: { icon: Users, accent: 'data-[state=active]:text-amber-600' },
  bin: { icon: Trash2, accent: 'data-[state=active]:text-rose-600' },
  statistics: { icon: BarChart3, accent: 'data-[state=active]:text-emerald-600' },
  history: { icon: History, accent: 'data-[state=active]:text-yellow-600' },
  interface: { icon: Settings, accent: 'data-[state=active]:text-slate-600' },
  profile: { icon: User, accent: 'data-[state=active]:text-sky-600' },
  warehouse: { icon: Package, accent: 'data-[state=active]:text-emerald-600' },
  finance: { icon: DollarSign, accent: 'data-[state=active]:text-lime-600' },
}

export function DesktopTabsNav({ visibleTabs, copy }: { visibleTabs: string[]; copy: Copy }) {
  const has = (tab: CanonicalTabId) => visibleTabs.includes(tab)

  const renderTab = (id: CanonicalTabId) => {
    if (!has(id)) return null
    const meta = TAB_META[id]
    if (!meta) return null
    const Icon = meta.icon
    return (
      <TabsTrigger
        key={id}
        value={id}
        className={`h-10 gap-2 rounded-xl text-xs font-medium transition-all duration-200 data-[state=active]:bg-card data-[state=active]:shadow-smooth data-[state=active]:border-border data-[state=inactive]:text-muted-foreground ${meta.accent}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {copy[id]}
      </TabsTrigger>
    )
  }

  return (
    <TabsList className="desktop-tabs-list hidden h-auto w-full flex-wrap gap-1.5 rounded-2xl border border-border/60 bg-muted/50 p-1.5 backdrop-blur-sm md:flex">
      {renderTab('statistics')}
      {renderTab('orders')}
      {renderTab('clients')}
      {renderTab('admins')}
      {renderTab('warehouse')}
      {renderTab('finance')}
      {renderTab('history')}
      {renderTab('bin')}
      {renderTab('interface')}
      {renderTab('profile')}
    </TabsList>
  )
}
