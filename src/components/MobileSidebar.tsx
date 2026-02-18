'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  BarChart3,
  ChevronRight,
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

  const tabs = [
    { id: 'orders', icon: Package, label: t.admin.orders },
    { id: 'clients', icon: Users, label: t.admin.clients },
    { id: 'admins', icon: Users, label: t.admin.admins },
    { id: 'bin', icon: Trash2, label: t.admin.bin },
    { id: 'statistics', icon: BarChart3, label: t.admin.statistics },
    { id: 'history', icon: History, label: t.admin.history },
    { id: 'interface', icon: Settings, label: t.admin.interface },
    { id: 'profile', icon: User, label: t.common.profile },
    { id: 'warehouse', icon: Package, label: t.warehouse.title },
    { id: 'finance', icon: DollarSign, label: t.finance.title },
  ]

  const effectiveTabs = visibleTabs?.length ? tabs.filter((tab) => visibleTabs.includes(tab.id)) : tabs

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border-border/70 bg-card/85 shadow-elegant backdrop-blur-md md:hidden"
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
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 290 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 overflow-y-auto border-r border-border/70 bg-card/92 backdrop-blur-xl md:hidden"
          >
            <div className="sticky top-0 border-b border-border/70 bg-card/92 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-smooth">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-semibold">AutoFood</h2>
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{t.admin.dashboard}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <nav className="space-y-2 p-4">
              {effectiveTabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => {
                      onTabChange(tab.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all',
                      isActive
                        ? 'border-primary/30 bg-primary/12 text-foreground shadow-[0_10px_20px_-14px_rgba(15,118,110,0.6)]'
                        : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                  </motion.button>
                )
              })}
            </nav>

            <div className="border-t border-border/70 p-4">
              <p className="text-center text-xs text-muted-foreground">(c) {new Date().getFullYear()} AutoFood</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
