'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, DollarSign, History, Package, Settings, Trash2, User, Users } from 'lucide-react'
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

export function DesktopTabsNav({
  visibleTabs,
  copy,
}: {
  visibleTabs: string[]
  copy: Copy
}) {
  const has = (tab: CanonicalTabId) => visibleTabs.includes(tab)

  return (
    <TabsList className="desktop-tabs-list hidden md:grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-10 h-auto gap-2 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
      {has('orders') && (
        <TabsTrigger
          value="orders"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Package className="w-4 h-4 mr-2" />
          {copy.orders}
        </TabsTrigger>
      )}
      {has('clients') && (
        <TabsTrigger
          value="clients"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Users className="w-4 h-4 mr-2" />
          {copy.clients}
        </TabsTrigger>
      )}
      {has('admins') && (
        <TabsTrigger
          value="admins"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Users className="w-4 h-4 mr-2" />
          {copy.admins}
        </TabsTrigger>
      )}
      {has('bin') && (
        <TabsTrigger
          value="bin"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {copy.bin}
        </TabsTrigger>
      )}
      {has('statistics') && (
        <TabsTrigger
          value="statistics"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {copy.statistics}
        </TabsTrigger>
      )}
      {has('history') && (
        <TabsTrigger
          value="history"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <History className="w-4 h-4 mr-2" />
          {copy.history}
        </TabsTrigger>
      )}
      {has('interface') && (
        <TabsTrigger
          value="interface"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Settings className="w-4 h-4 mr-2" />
          {copy.interface}
        </TabsTrigger>
      )}
      {has('profile') && (
        <TabsTrigger
          value="profile"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <User className="w-4 h-4 mr-2" />
          {copy.profile}
        </TabsTrigger>
      )}
      {has('warehouse') && (
        <TabsTrigger
          value="warehouse"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <Package className="w-4 h-4 mr-2" />
          {copy.warehouse}
        </TabsTrigger>
      )}
      {has('finance') && (
        <TabsTrigger
          value="finance"
          className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {copy.finance}
        </TabsTrigger>
      )}
    </TabsList>
  )
}
