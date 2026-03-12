'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-md lg:hidden transition-opacity duration-300" 
          onClick={onClose} 
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
          // Mobile: full glassy panel
          'border-r border-black/10 dark:border-white/[0.06] bg-white/95 dark:bg-[#060606]/95 backdrop-blur-2xl',
          // Desktop: floating card
          'lg:static lg:translate-x-0 lg:border-none lg:w-[260px] lg:m-4 lg:rounded-[1.5rem] lg:bg-white/60 dark:lg:bg-white/[0.02] lg:border lg:border-black/5 dark:lg:border-white/[0.06] lg:backdrop-blur-xl',
          isOpen && 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 lg:pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-white dark:to-white/80 text-white dark:text-black shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white/95">AutoFood</p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-white/40 tracking-wide">
                  {language === 'ru' ? 'Панель' : language === 'uz' ? 'Panel' : 'Dashboard'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/[0.06] to-transparent" />

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-0.5 px-3 lg:px-2">
              {menuItems.map((item) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={item.id} className="mx-3 my-3 h-[1px] bg-gradient-to-r from-transparent via-black/5 dark:via-white/[0.04] to-transparent" />;
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    className={cn(
                      'flex h-10 w-full items-center gap-3.5 rounded-xl px-3.5 text-[14px] font-[600] transition-all duration-300 relative overflow-hidden',
                      isActive
                        ? 'bg-black/5 dark:bg-white/[0.08] text-zinc-950 dark:text-white shadow-sm dark:shadow-[0_2px_12px_-4px_rgba(255,255,255,0.08)]'
                        : 'text-zinc-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-white/80'
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                  >
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-zinc-900 dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                    )}
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-white/40')} />
                    <span className="flex-1 text-left tracking-wide truncate">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <Badge className="h-5 min-w-5 bg-black/10 dark:bg-white/10 text-zinc-800 dark:text-white border-transparent px-1.5 text-[10px] shadow-none">{item.badge}</Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer - Logout */}
          <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/[0.06] to-transparent" />
          <div className="p-3">
            <button 
              className="flex h-10 w-full items-center gap-3.5 rounded-xl px-3.5 text-[14px] font-[600] text-red-600 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:text-red-700 dark:hover:text-red-400 transition-all duration-300" 
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
