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
        className="group h-11 min-w-[52px] justify-center gap-2 rounded-base border-2 border-transparent bg-background/55 px-3 text-xs font-medium shadow-shadow transition-colors duration-150 data-[state=active]:border-border data-[state=active]:bg-main data-[state=active]:text-main-foreground data-[state=active]:shadow-none data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-background/75 sm:min-w-[116px] sm:justify-start"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-data-[state=active]:bg-foreground group-data-[state=active]:text-background">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="hidden truncate sm:inline">{copy[id]}</span>
      </TabsTrigger>
    )
  }

  return (
    <TabsList className="desktop-tabs-list glass-card hidden h-auto w-full flex-nowrap gap-2 overflow-x-auto rounded-base border-2 border-border bg-background/30 p-2 shadow-shadow backdrop-blur-md md:flex md:flex-wrap">
      {DASHBOARD_TAB_ORDER.map((tabId) => renderTab(tabId))}
    </TabsList>
  )
}
