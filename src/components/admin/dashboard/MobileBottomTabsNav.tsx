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

export function MobileBottomTabsNav({ visibleTabs, copy }: { visibleTabs: string[]; copy: Copy }) {
  const has = (tab: CanonicalTabId) => visibleTabs.includes(tab)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:hidden">
      <TabsList className="glass-card pointer-events-auto flex h-auto w-full flex-nowrap justify-between gap-2 overflow-x-auto rounded-base border-2 border-border p-2 shadow-shadow backdrop-blur-md">
        {DASHBOARD_TAB_ORDER.map((tabId) => {
          if (!has(tabId)) return null
          const meta = DASHBOARD_TAB_META[tabId]
          if (!meta) return null
          const Icon = meta.icon

          return (
            <TabsTrigger
              key={tabId}
              value={tabId}
              title={copy[tabId]}
              aria-label={copy[tabId]}
              className="group h-11 min-h-11 min-w-11 flex-1 items-center justify-center rounded-base border-2 border-border bg-background/70 p-0 shadow-shadow data-[state=active]:bg-main data-[state=active]:text-main-foreground data-[state=active]:shadow-none"
            >
              <Icon className="h-4 w-4" />
            </TabsTrigger>
          )
        })}
      </TabsList>
    </div>
  )
}
