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
  const { t } = useLanguage();

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
      {isOpen && <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full border-r border-border bg-sidebar/92 backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          isOpen && 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">AutoFood</p>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-3">
              {menuItems.map((item) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={item.id} className="mx-2 my-2 h-px bg-border/70" />;
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      'h-11 w-full justify-start gap-3 rounded-xl border px-3 text-sm font-medium transition-all',
                      isActive
                        ? 'border-primary/20 bg-primary/10 text-foreground shadow-smooth'
                        : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground'
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{item.badge}</Badge>
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-border/70 p-3">
            <Button variant="ghost" className="h-11 w-full justify-start gap-3 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              {t.common.logout}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
