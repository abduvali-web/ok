'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChefHat,
  DollarSign,
  History,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ className, activeTab, onTabChange, isOpen, onClose, onLogout }: SidebarProps) {
  const { t, language } = useLanguage();

  const menuItems = [
    { id: 'statistics', label: t.admin.statistics, icon: BarChart3, badge: null },
    { id: 'orders', label: t.admin.orders, icon: ShoppingCart, badge: 0 },
    { id: 'clients', label: t.admin.clients, icon: Users, badge: null },
    { id: 'admins', label: t.admin.admins, icon: Users, badge: null },
    { id: 'couriers', label: t.admin.couriers, icon: Truck, badge: null },
    { id: 'divider-1', type: 'divider' as const },
    { id: 'warehouse', label: t.warehouse.title, icon: Package, badge: null },
    { id: 'cooking', label: t.warehouse.cooking, icon: ChefHat, badge: null },
    { id: 'divider-2', type: 'divider' as const },
    { id: 'finance', label: t.finance.title, icon: DollarSign, badge: null },
    { id: 'history', label: t.admin.history, icon: History, badge: null },
    { id: 'divider-3', type: 'divider' as const },
    { id: 'chat', label: t.courier.chat, icon: MessageSquare, badge: null },
    { id: 'bin', label: t.admin.bin, icon: Trash2, badge: null },
    { id: 'divider-4', type: 'divider' as const },
    { id: 'profile', label: t.common.profile, icon: User, badge: null },
    { id: 'settings', label: t.admin.settings, icon: Settings, badge: null },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300" 
          onClick={onClose} 
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
          // Mobile: mock panel
          'border-r border-black/10 dark:border-white/[0.06] bg-gourmet-green/90 dark:bg-dark-green/90 backdrop-blur-2xl',
          // Desktop: mock pill
          'lg:static lg:translate-x-0 lg:border-none lg:w-32 lg:m-4 lg:rounded-[40px] lg:bg-gourmet-green/40 lg:dark:bg-dark-green/40 lg:p-4 lg:shadow-inner',
          isOpen && 'translate-x-0',
          className
        )}
      >
        {/* Premium top shine (desktop only) */}
        <div className="hidden lg:block absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none" />
        
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 lg:px-0 lg:py-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-dark-surface text-white shadow-lg shadow-black/10 border-2 border-white/20">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-gourmet-ink dark:text-dark-text">AutoFood</p>
                <p className="text-[11px] font-semibold text-gourmet-ink/70 dark:text-dark-text/70 tracking-wider uppercase">
                  {language === 'ru' ? 'Панель' : language === 'uz' ? 'Panel' : 'Dashboard'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden text-gourmet-ink/70 dark:text-dark-text/70 hover:text-gourmet-ink dark:hover:text-dark-text hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="mx-5 lg:mx-0 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/[0.08] to-transparent" />

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="flex flex-col items-center gap-2 px-3 lg:px-0">
              {menuItems.map((item) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={item.id} className="w-full my-2 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/[0.08] to-transparent" />;
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={cn(
                      'flex h-10 w-full items-center gap-3.5 rounded-xl px-3.5 text-[13.5px] font-semibold transition-all duration-300 relative overflow-hidden',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/[0.08] text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-zinc-500 dark:text-white/45 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-800 dark:hover:text-white/75'
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                    )}
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-white/35')} />
                    <span className="flex-1 text-left tracking-wide truncate">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <Badge className="h-5 min-w-5 bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-transparent px-1.5 text-[10px] shadow-none font-bold">{item.badge}</Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer - Logout */}
          <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/[0.06] to-transparent" />
          <div className="p-3">
            <button 
              className="flex h-10 w-full items-center gap-3.5 rounded-xl px-3.5 text-[13.5px] font-semibold text-rose-500 dark:text-rose-400/80 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08] hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-300" 
              onClick={onLogout}
            >
              <LogOut className="h-[18px] w-[18px]" />
              {t.common.logout}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
