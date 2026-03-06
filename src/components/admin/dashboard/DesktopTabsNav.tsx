'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type CanonicalTabId } from '@/components/admin/dashboard/tabs'
import { DASHBOARD_TAB_META, DASHBOARD_TAB_ORDER } from '@/components/admin/dashboard/tabMeta'

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

export function DesktopTabsNav({ visibleTabs, copy }: { visibleTabs: string[]; copy: Copy }) {
  const has = (tab: CanonicalTabId) => visibleTabs.includes(tab)

  const renderTab = (id: CanonicalTabId) => {
    if (!has(id)) return null
    const meta = DASHBOARD_TAB_META[id]
    if (!meta) return null
    const Icon = meta.icon
    return (
      <TabsTrigger
        key={id}
        value={id}
        className={`group h-11 min-w-[116px] gap-2 rounded-xl border border-transparent px-3 text-xs font-medium transition-all duration-200 data-[state=active]:border-border/80 data-[state=active]:bg-card data-[state=active]:shadow-smooth data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:border-border/70 data-[state=inactive]:hover:bg-card/70 ${meta.desktopAccent}`}
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
      {DASHBOARD_TAB_ORDER.map((tabId) => renderTab(tabId))}
    </TabsList>
  )
}
