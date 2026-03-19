'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  DollarSign,
  History,
  Package,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type DividerItem = { id: string; type: 'divider' };
type NavItem = {
  id: string;
  label: string;
  icon: typeof Users;
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

  const menuItems: MenuItem[] = [
    { id: 'orders', label: t.admin.orders, icon: ShoppingCart, badge: 0 },
    { id: 'clients', label: t.admin.clients, icon: Users, badge: null },
    { id: 'admins', label: t.admin.admins, icon: Users, badge: null },
    { id: 'divider-1', type: 'divider' },
    { id: 'warehouse', label: t.warehouse.title, icon: Package, badge: null },
    { id: 'divider-2', type: 'divider' },
    { id: 'finance', label: t.finance.title, icon: DollarSign, badge: null },
    { id: 'history', label: t.admin.history, icon: History, badge: null },
    { id: 'divider-3', type: 'divider' },
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
          'border-r-2 border-black/10 dark:border-white/[0.06] bg-gourmet-green/90 dark:bg-dark-green/90 backdrop-blur-2xl',
          'md:relative md:translate-x-0 md:border-2 md:w-32 md:m-4 md:rounded-[40px] md:bg-gourmet-green/40 md:dark:bg-dark-green/40 md:p-4 md:shadow-inner',
          isOpen && 'translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-6 md:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-dark-surface text-white shadow-lg shadow-black/10 border-2 border-white/20 shrink-0">
                <ChefHat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight text-gourmet-ink dark:text-dark-text truncate">AutoFood</p>
                <p className="text-[11px] font-semibold text-gourmet-ink/70 dark:text-dark-text/70 tracking-wider uppercase truncate">
                  {language === 'ru' ? 'Панель' : language === 'uz' ? 'Panel' : 'Dashboard'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-gourmet-ink/70 dark:text-dark-text/70 hover:text-gourmet-ink dark:hover:text-dark-text hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 py-4 md:py-1 overflow-y-auto overflow-x-visible">
            <nav className="flex flex-col items-center gap-2 md:gap-6 px-3 md:px-0 justify-start">
              {menuItems.map((item) => {
                if ('type' in item) {
                  return (
                    <div
                      key={item.id}
                      className="self-stretch my-1.5 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/[0.08] to-transparent"
                    />
                  );
                }

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 md:gap-2 group relative py-2 md:py-4 transition-all duration-300',
                      isActive && 'scale-105'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-bg"
                        className="absolute inset-y-0 w-16 md:w-[121px] left-1/2 -translate-x-1/2 bg-gourmet-cream dark:bg-dark-surface rounded-[20px] md:rounded-[30px] shadow-[-10px_0_15px_rgba(0,0,0,0.05)] z-0 transition-colors duration-300"
                        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                      />
                    )}

                    <motion.div
                      animate={{ y: 0 }}
                      whileHover={{
                        y: [0, -8, 8, 0],
                        transition: { duration: 3.375, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      whileTap={{ y: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                      className={cn(
                        'w-12 h-12 md:w-24 md:h-24 rounded-full flex items-center justify-center relative transition-all overflow-hidden z-10',
                        isActive
                          ? 'bg-gourmet-orange shadow-2xl border-b-4 border-black/20'
                          : 'bg-white dark:bg-dark-surface shadow-lg border-b-4 border-black/10 dark:border-white/10'
                      )}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 4 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={cn(
                          'absolute w-10 h-10 rounded-full pointer-events-none z-0',
                          isActive ? 'bg-white/20' : 'bg-gourmet-orange/20'
                        )}
                      />

                      <div
                        className={cn(
                          'w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 border-dashed relative z-10',
                          isActive ? 'border-white/30' : 'border-black/10 dark:border-white/10'
                        )}
                      >
                        <Icon className="w-5 h-5 md:w-10 md:h-10 text-gourmet-ink dark:text-dark-text" />
                      </div>
                    </motion.div>

                    <span className="text-[10px] md:text-sm font-bold transition-colors duration-300 relative z-10 text-gourmet-ink dark:text-dark-text text-center px-1">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>
      </aside>
    </>
  );
}
