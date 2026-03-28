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
      <TabsList className="pointer-events-auto flex h-auto w-full flex-nowrap gap-1.5 overflow-x-auto rounded-base border-2 border-border bg-background/95 p-2 shadow-shadow backdrop-blur-md">
        {DASHBOARD_TAB_ORDER.map((tabId) => {
          if (!has(tabId)) return null
          const meta = DASHBOARD_TAB_META[tabId]
          if (!meta) return null
          const Icon = meta.icon

          return (
            <TabsTrigger
              key={tabId}
              value={tabId}
              className="group min-w-[86px] flex-1 items-center justify-center gap-1 rounded-base border-2 border-transparent px-2 py-1.5 text-[10px] font-heading data-[state=active]:border-border data-[state=active]:bg-main data-[state=active]:text-main-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{copy[tabId]}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </div>
  )
}

