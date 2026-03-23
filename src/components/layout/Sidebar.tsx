'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import {
  Archive,
  Calculator,
  CookingPot,
  Database,
  DollarSign,
  History,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

type DividerItem = { id: string; type: 'divider' }
type NavItem = {
  id: string
  label: string
  icon: React.ElementType<{ className?: string }>
  badge?: number | null
}
type MenuItem = NavItem | DividerItem

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  showDatabase?: boolean
}

export function Sidebar({
  className,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  onLogout: _onLogout,
  showDatabase,
}: SidebarProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const openModalParam = (key: 'chat' | 'settings') => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('chat')
    params.delete('settings')
    params.set(key, '1')
    params.set('v', String(Date.now()))
    router.push(`${pathname}?${params.toString()}`)
  }

  const warehouseSubItems = [
    { id: 'cooking', label: t.warehouse.cooking, icon: CookingPot },
    { id: 'sets', label: language === 'ru' ? 'Сеты' : language === 'uz' ? 'Setlar' : 'Sets', icon: Layers },
    { id: 'inventory', label: t.warehouse.inventory, icon: Package },
    { id: 'calculator', label: t.warehouse.calculator, icon: Calculator },
  ]

  const adminSubItems = [
    ...(showDatabase ? [{ id: 'database', label: 'Database', icon: Database }] : []),
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const menuItems: MenuItem[] = [
    { id: 'orders', label: t.admin.orders, icon: ShoppingCart, badge: 0 },
    { id: 'clients', label: t.admin.clients, icon: Users, badge: null },
    { id: 'admins', label: t.admin.admins, icon: Users, badge: null },
    { id: 'divider-1', type: 'divider' },
    { id: 'warehouse', label: t.warehouse.title, icon: Package, badge: null },
    { id: 'finance', label: t.finance?.title || 'Finance', icon: DollarSign, badge: null },
    { id: 'history', label: t.admin.history, icon: History, badge: null },
    { id: 'bin', label: t.admin.bin || 'Archive', icon: Archive, badge: null },
  ]

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'bg-background/95 backdrop-blur-2xl',
          'md:relative md:translate-x-0 md:w-[136px] md:m-4 md:rounded-[50px] md:bg-white/50 md:dark:bg-white/5 md:border-2 md:border-dashed md:border-primary/20 md:dark:border-white/10 md:p-4 md:shadow-2xl md:self-start md:h-fit',
          isOpen && 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-6 md:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-black/10 border-2 border-primary/30 dark:border-white/20 shrink-0">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black tracking-tight text-foreground dark:text-white truncate">AutoFood</p>
                <p className="text-[10px] font-black text-muted-foreground/40 dark:text-white/40 tracking-[0.2em] uppercase truncate">
                  {language === 'ru' ? 'Панель' : 'Dashboard'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="refIcon"
              className="text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 rounded-xl"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 py-4 md:py-2 overflow-y-auto md:overflow-y-visible overflow-x-visible">
            <nav className="flex flex-col items-center gap-2 md:gap-4 px-3 md:px-0 justify-start">
              {menuItems.map((item) => {
                if ('type' in item) {
                  return (
                    <div
                      key={item.id}
                      className="self-stretch my-2 h-[2px] border-t-2 border-dashed border-primary/20 dark:border-white/10"
                    />
                  )
                }

                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <div key={item.id} className="w-full flex flex-col items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="refSm"
                      onClick={() => {
                        onTabChange(item.id)
                        onClose()
                      }}
                      className={cn(
                        'flex flex-col items-center gap-2 group relative transition-all duration-300 w-full md:w-[100px] rounded-[30px] md:rounded-[40px] overflow-hidden',
                        '!h-auto !py-3 md:!py-4 !px-0 hover:!bg-primary/5 dark:hover:!bg-white/10'
                      )}
                    >
                      {isActive ? (
                        <motion.div
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-primary/10 dark:bg-primary/60 rounded-[30px] md:rounded-[40px] z-0 shadow-lg border-b-4 border-black/5 dark:border-black/20"
                          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                        />
                      ) : null}

                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'w-12 h-12 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center relative transition-all overflow-hidden z-10',
                          isActive
                            ? 'bg-primary text-white dark:bg-white dark:text-primary shadow-xl'
                            : 'bg-[#dcfce7] text-emerald-800 hover:bg-[#bbf7d0] dark:bg-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/20'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center border-2 border-dashed relative z-10',
                            isActive ? 'border-white/20 dark:border-primary/20' : 'border-emerald-700/20 dark:border-white/10'
                          )}
                        >
                          <Icon className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                      </motion.div>

                      <span
                        className={cn(
                          'text-[10px] md:text-[11px] font-black uppercase tracking-widest relative z-10 text-center px-1 w-full truncate transition-all duration-300',
                          isActive
                            ? 'text-foreground dark:text-white'
                            : 'text-muted-foreground/60 group-hover:text-foreground dark:text-white/40 dark:group-hover:text-white/60'
                        )}
                      >
                        {item.label}
                      </span>
                    </Button>

                    {item.id === 'warehouse' && (isActive || isOpen) ? (
                      <div className="relative z-10 mt-2 w-full px-2">
                        <div className="rounded-3xl border-2 border-dashed border-primary/15 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2 space-y-1">
                          {warehouseSubItems.map((sub) => {
                            const SubIcon = sub.icon
                            return (
                              <Button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  try {
                                    localStorage.setItem('warehouseSubTab', sub.id)
                                    window.dispatchEvent(
                                      new CustomEvent('warehouse:set-subtab', { detail: { subTab: sub.id } })
                                    )
                                  } catch {
                                    // ignore
                                  }
                                  onTabChange('warehouse')
                                  onClose()
                                }}
                                variant="ghost"
                                size="refSm"
                                className="w-full justify-start gap-2 rounded-2xl text-left text-xs uppercase tracking-widest hover:bg-primary/10"
                              >
                                <SubIcon className="h-4 w-4 opacity-70" />
                                <span className="truncate">{sub.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {item.id === 'admins' && (isActive || isOpen) ? (
                      <div className="relative z-10 mt-2 w-full px-2">
                        <div className="rounded-3xl border-2 border-dashed border-primary/15 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2 space-y-1">
                          {adminSubItems.map((sub) => {
                            const SubIcon = sub.icon
                            return (
                              <Button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  if (sub.id === 'database') router.push('/middle-admin/database')
                                  if (sub.id === 'chat') openModalParam('chat')
                                  if (sub.id === 'settings') openModalParam('settings')
                                  onClose()
                                }}
                                variant="ghost"
                                size="refSm"
                                className="w-full justify-start gap-2 rounded-2xl text-left text-xs uppercase tracking-widest hover:bg-primary/10"
                              >
                                <SubIcon className="h-4 w-4 opacity-70" />
                                <span className="truncate">{sub.label}</span>
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}

