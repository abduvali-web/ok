'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  DollarSign,
  History,
  Menu,
  Package,
  Settings,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface MobileSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  visibleTabs?: string[]
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

export function MobileSidebar({ activeTab, onTabChange, visibleTabs }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('keydown', onEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const allTabs = [
    { id: 'statistics', label: t.admin.statistics },
    { id: 'orders', label: t.admin.orders },
    { id: 'clients', label: t.admin.clients },
    { id: 'admins', label: t.admin.admins },
    { id: 'warehouse', label: t.warehouse.title },
    { id: 'finance', label: t.finance.title },
    { id: 'history', label: t.admin.history },
    { id: 'bin', label: t.admin.bin },
    { id: 'interface', label: t.admin.interface },
    { id: 'profile', label: t.common.profile },
  ]

  const effectiveTabs = visibleTabs?.length
    ? allTabs.filter((tab) => visibleTabs.includes(tab.id))
    : allTabs

  return (
    <>
      {/* ─── FAB ─── */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border-border/60 bg-card shadow-elevated backdrop-blur-md md:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* ─── Backdrop ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] overflow-y-auto border-r border-border/60 bg-card backdrop-blur-xl md:hidden"
          >
            {/* Header */}
            <div className="sticky top-0 border-b border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-semibold">AutoFood</h2>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {t.admin.dashboard}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="p-3 space-y-1">
              {effectiveTabs.map((tab, index) => {
                const config = TAB_CONFIG[tab.id] || { icon: Package, accent: 'bg-slate-500' }
                const Icon = config.icon
                const isActive = activeTab === tab.id

                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                        isActive ? `${config.accent} text-white shadow-sm` : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 bg-card p-4">
              <p className="text-center text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} AutoFood
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
