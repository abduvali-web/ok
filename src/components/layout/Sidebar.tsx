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
      {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full border-r border-white/10 bg-black/40 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:bg-transparent lg:border-none lg:w-64 lg:m-4 lg:rounded-[2rem] lg:bg-white/[0.02]',
          isOpen && 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-6 lg:border-none lg:pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-white/90">AutoFood</p>
                <p className="text-xs font-medium text-white/50">{language === 'ru' ? 'Панель' : language === 'uz' ? 'Panel' : 'Dashboard'}</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-4 lg:px-2">
              {menuItems.map((item) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={item.id} className="mx-4 my-3 h-[1px] bg-white/5" />;
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      'h-11 w-full justify-start gap-4 rounded-xl border px-4 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'border-white/10 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                        : 'border-transparent text-white/60 hover:border-white/5 hover:bg-white/5 hover:text-white'
                    )}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'text-white')} />
                    <span className="flex-1 text-left tracking-wide">{item.label}</span>
                    {item.badge !== null && item.badge > 0 && (
                      <Badge className="h-5 min-w-5 bg-white/20 text-white border-transparent px-1.5 text-[10px] shadow-none">{item.badge}</Badge>
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 lg:border-none">
            <Button 
              variant="ghost" 
              className="h-11 w-full justify-start gap-4 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" 
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {t.common.logout}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
