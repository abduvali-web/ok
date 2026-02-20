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
        className={`group h-11 min-w-[116px] gap-2 rounded-xl border border-transparent px-3 text-xs font-medium transition-all duration-200 data-[state=active]:border-border/80 data-[state=active]:bg-card data-[state=active]:shadow-smooth data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:border-border/70 data-[state=inactive]:hover:bg-card/70 ${meta.accent}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">{copy[id]}</span>
      </TabsTrigger>
    )
  }

  return (
    <TabsList className="desktop-tabs-list hidden h-auto w-full flex-wrap gap-1.5 rounded-2xl border border-border/70 bg-muted/35 p-2 md:flex">
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
