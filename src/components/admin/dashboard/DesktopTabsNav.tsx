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

export function DesktopTabsNav({ visibleTabs, copy }: { visibleTabs: string[]; copy: Copy }) {
  const has = (tab: CanonicalTabId) => visibleTabs.includes(tab)

  return (
    <TabsList className="desktop-tabs-list hidden h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-card/75 p-1.5 backdrop-blur-sm md:grid md:grid-cols-4 lg:grid-cols-11">
      {has('orders') && (
        <TabsTrigger value="orders" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Package className="mr-2 h-4 w-4" />
          {copy.orders}
        </TabsTrigger>
      )}
      {has('clients') && (
        <TabsTrigger value="clients" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Users className="mr-2 h-4 w-4" />
          {copy.clients}
        </TabsTrigger>
      )}
      {has('admins') && (
        <TabsTrigger value="admins" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Users className="mr-2 h-4 w-4" />
          {copy.admins}
        </TabsTrigger>
      )}
      {has('bin') && (
        <TabsTrigger value="bin" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Trash2 className="mr-2 h-4 w-4" />
          {copy.bin}
        </TabsTrigger>
      )}
      {has('statistics') && (
        <TabsTrigger value="statistics" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <BarChart3 className="mr-2 h-4 w-4" />
          {copy.statistics}
        </TabsTrigger>
      )}
      {has('history') && (
        <TabsTrigger value="history" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <History className="mr-2 h-4 w-4" />
          {copy.history}
        </TabsTrigger>
      )}
      {has('interface') && (
        <TabsTrigger value="interface" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Settings className="mr-2 h-4 w-4" />
          {copy.interface}
        </TabsTrigger>
      )}
      {has('profile') && (
        <TabsTrigger value="profile" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <User className="mr-2 h-4 w-4" />
          {copy.profile}
        </TabsTrigger>
      )}
      {has('warehouse') && (
        <TabsTrigger value="warehouse" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <Package className="mr-2 h-4 w-4" />
          {copy.warehouse}
        </TabsTrigger>
      )}
      {has('finance') && (
        <TabsTrigger value="finance" className="h-10 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none">
          <DollarSign className="mr-2 h-4 w-4" />
          {copy.finance}
        </TabsTrigger>
      )}
    </TabsList>
  )
}
