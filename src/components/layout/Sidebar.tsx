'use client';

import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  DollarSign,
  History,
  Package,
  ShoppingCart,
  Users,
  X,
  BarChart3,
  Archive,
  LayoutDashboard,
  MessageSquare,
  CookingPot,
  Scale,
  Utensils,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type DividerItem = { id: string; type: 'divider' };
type NavItem = {
  id: string;
  label: string;
  icon: any;
  badge?: number | null;
};
type MenuItem = NavItem | DividerItem;

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ className, activeTab, onTabChange, isOpen, onClose, onLogout: _onLogout }: SidebarProps) {
  const { t, language } = useLanguage();

  const menuItems: (MenuItem & { subItems?: NavItem[] })[] = [
    { id: 'orders', label: t.admin.orders, icon: ShoppingCart, badge: 0 },
    { id: 'chat', label: t.chat?.title || 'Chat', icon: MessageSquare, badge: null },
    { id: 'clients', label: t.admin.clients, icon: Users, badge: null },
    { id: 'admins', label: t.admin.admins, icon: Users, badge: null },
    { id: 'divider-1', type: 'divider' },
    {
      id: 'warehouse',
      label: t.warehouse.title,
      icon: Package,
      badge: null,
      subItems: [
        { id: 'cooking', label: t.warehouse.cooking, icon: CookingPot },
        { id: 'ingredients', label: t.warehouse.inventory, icon: Scale },
        { id: 'sets', label: t.warehouse.sets || 'Sets', icon: Utensils },
      ]
    },
    { id: 'finance', label: t.finance?.title || 'Finance', icon: DollarSign, badge: null },
    { id: 'history', label: t.admin.history, icon: History, badge: null },
    { id: 'bin', label: t.admin.bin || 'Archive', icon: Archive, badge: null },
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
          'fixed inset-x-4 bottom-6 z-50 md:inset-y-0 md:left-0 md:w-[136px] md:m-4 md:bottom-auto transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'bg-white/80 dark:bg-black/80 backdrop-blur-3xl md:bg-white/50 md:dark:bg-white/5 rounded-[40px] md:rounded-[50px] border-2 border-dashed border-primary/20 md:dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:shadow-2xl md:h-fit md:self-start',
          className
        )}
      >
        <div className="flex h-full flex-col p-2 md:p-4">
          <div className="flex-1 overflow-x-auto no-scrollbar md:overflow-y-auto md:overflow-x-visible">
            <nav className="flex flex-row md:flex-col items-center gap-3 md:gap-4 px-2 md:px-0 justify-start h-full">
              {menuItems.map((item) => {
                if ('type' in item) {
                  return (
                    <div
                      key={item.id}
                      className="hidden md:block self-stretch my-2 h-[2px] border-t-2 border-dashed border-primary/20 dark:border-white/10"
                    />
                  );
                }

                const isActive = activeTab === item.id || item.subItems?.some(s => s.id === activeTab);
                const Icon = item.icon;

                return (
                  <div key={item.id} className="flex flex-col items-center gap-2 group relative">
                    <button
                      onClick={() => {
                        onTabChange(item.id);
                        onClose();
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 group relative py-2 md:py-4 transition-all duration-300 w-[72px] md:w-[100px] rounded-[30px] md:rounded-[40px] overflow-hidden shrink-0'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-bg"
                          className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-[30px] md:rounded-[40px] z-0 shadow-lg border-b-4 border-black/5 dark:border-black/20"
                          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                        />
                      )}

                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'w-10 h-10 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center relative transition-all overflow-hidden z-10',
                          isActive
                            ? 'bg-primary text-white shadow-xl'
                            : 'bg-muted/40 text-muted-foreground/60 hover:bg-muted/60 dark:bg-white/10 dark:text-white/40 dark:hover:text-white/60 dark:hover:bg-white/20'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center border-2 border-dashed relative z-10',
                          isActive ? 'border-white/20' : 'border-border'
                        )}>
                          <Icon className="w-4 h-4 md:w-7 md:h-7" />
                        </div>
                      </motion.div>

                      <span className={cn(
                        "text-[8px] md:text-[11px] font-black uppercase tracking-widest relative z-10 text-center px-1 w-full truncate transition-all duration-300",
                        isActive ? 'text-primary' : 'text-muted-foreground/40'
                      )}>
                        {item.label}
                      </span>
                    </button>

                    {/* Sub-items for active Warehouse in desktop */}
                    {item.id === 'warehouse' && isActive && item.subItems && (
                      <AnimatePresence>
                        <motion.div 
                          className="hidden md:flex flex-col gap-2 p-3 bg-muted/30 rounded-[32px] border-2 border-dashed border-border mt-2"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          {item.subItems.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => onTabChange(sub.id)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                                activeTab === sub.id 
                                  ? "bg-primary text-white shadow-lg" 
                                  : "hover:bg-muted text-muted-foreground/60 hover:text-foreground"
                              )}
                            >
                              <sub.icon className="w-3 h-3" />
                              {sub.label}
                            </button>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
