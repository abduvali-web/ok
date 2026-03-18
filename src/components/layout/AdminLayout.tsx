'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, Bell, ChefHat, CookingPot, Menu, Moon, Settings, ShoppingCart, Sun, Utensils, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

export function AdminLayout({ children, activeTab, onTabChange, onLogout, userName }: AdminLayoutProps) {
  const { t, language } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isGourmetMockTab = true;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === 'dark';
  const tabLabels = {
    statistics: t.admin.statistics,
    orders: t.admin.orders,
    map: language === 'ru' ? 'Карта' : language === 'uz' ? 'Xarita' : 'Map',
    warehouse: t.warehouse.title,
    cooking: t.warehouse.cooking,
    sets: language === 'ru' ? 'Наборы' : language === 'uz' ? "To'plamlar" : 'Sets',
    finance: t.finance.title,
    clients: t.admin.clients,
    couriers: t.admin.couriers,
    chat: t.courier.chat,
    settings: t.admin.settings,
    admins: t.admin.admins,
    bin: t.admin.bin,
    history: t.admin.history,
    profile: t.common.profile,
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div
      className={cn(
        'flex min-h-screen selection:bg-indigo-500/20 relative overflow-hidden',
        isGourmetMockTab
          ? 'bg-gourmet-cream dark:bg-dark-bg text-gourmet-ink dark:text-dark-text'
          : 'bg-[#fafbfc] dark:bg-[#06060a] text-foreground'
      )}
    >
      {/* ═══ Background Effects ═══ */}
      {!isGourmetMockTab ? <div className="fixed inset-0 z-0 bg-dot-grid pointer-events-none opacity-30" /> : null}
      {!isGourmetMockTab ? (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-500/[0.06] dark:from-indigo-500/[0.03] via-violet-500/[0.03] dark:via-violet-500/[0.015] to-transparent" />
        </div>
      ) : null}
      {/* Mesh gradient orbs */}
      {!isGourmetMockTab ? (
        <div className="fixed top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.05] dark:bg-indigo-500/[0.025] blur-[120px] pointer-events-none animate-pulse-glow" />
      ) : null}
      {!isGourmetMockTab ? (
        <div
          className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] dark:bg-violet-500/[0.025] blur-[100px] pointer-events-none animate-pulse-glow"
          style={{ animationDelay: '2s' }}
        />
      ) : null}

      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        className="z-50"
      />

      <div className="relative flex min-w-0 flex-1 flex-col z-10">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="h-20 md:h-24 bg-dark-green flex items-center justify-between px-4 md:px-10 rounded-b-[30px] md:rounded-b-[50px] shadow-xl z-30 transition-colors duration-300 sticky top-0"
        >
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-12 h-12 bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              title="Open menu"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <Menu className="w-6 h-6 text-gourmet-ink dark:text-dark-text" />
              </div>
            </Button>

            <motion.div whileHover={{ scale: 1.05, y: 4 }} className="flex items-center gap-2 md:gap-4 cursor-pointer min-w-0">
              <motion.div
                animate={{ rotate: [-12, 12, -12] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-dark-surface p-2 md:p-3 rounded-full shadow-inner border-2 border-white/20 transition-colors duration-300"
              >
                <Utensils className="w-6 h-6 md:w-10 md:h-10 text-gourmet-ink dark:text-dark-text" />
              </motion.div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gourmet-ink dark:text-dark-text tracking-tight truncate">AutoFood</h1>
                <p className="hidden md:block text-sm text-gourmet-ink dark:text-dark-text font-medium truncate">
                  {tabLabels[activeTab] || activeTab}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-3 md:gap-8">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1, y: 4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="w-12 h-12 md:w-16 md:h-16 bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10 group transition-colors duration-300"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                {isDark ? (
                  <Sun className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
                ) : (
                  <Moon className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
                )}
              </div>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.1, rotate: 5, y: 8 }}
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              className="w-12 h-12 md:w-16 md:h-16 bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10 group transition-colors duration-300"
              aria-label={t.common.logout}
              title={t.common.logout}
            >
              <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <Bell className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
              </div>
            </motion.button>
          </div>
        </motion.header>

        <main className="flex-1 overflow-auto relative z-10 pt-4 px-4 pb-20 lg:p-6 xl:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'h-full min-h-[80vh] relative',
                isGourmetMockTab
                  ? 'rounded-2xl md:rounded-[1.5rem] border border-transparent bg-transparent p-0 shadow-none backdrop-blur-0 overflow-visible'
                  : 'rounded-2xl md:rounded-[1.5rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.015] p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden'
              )}
            >
              {/* Premium top shine */}
              {!isGourmetMockTab ? (
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none" />
              ) : null}
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mock-style mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex flex-row justify-around gap-2 bg-gourmet-green/90 dark:bg-dark-green/90 p-2 rounded-t-[30px] shadow-2xl transition-colors duration-300 lg:hidden">
          {[
            { key: 'orders', label: 'Orders', icon: ShoppingCart },
            { key: 'admins', label: 'Staff', icon: Users },
            { key: 'cooking', label: 'Menu', icon: ChefHat },
            { key: 'warehouse', label: 'Inventory', icon: CookingPot },
            { key: 'statistics', label: 'Analytics', icon: BarChart3 },
            { key: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn('flex flex-col items-center gap-1 group relative py-2 transition-all duration-300', activeTab === item.key ? 'scale-105' : '')}
            >
              {activeTab === item.key && (
                <motion.div
                  layoutId="active-nav-bg-mobile"
                  className="absolute inset-y-0 w-16 left-1/2 -translate-x-1/2 bg-gourmet-cream dark:bg-dark-surface rounded-[20px] shadow-[-10px_0_15px_rgba(0,0,0,0.05)] z-0 transition-colors duration-300"
                  transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center relative transition-all overflow-hidden z-10',
                  activeTab === item.key
                    ? 'bg-gourmet-orange shadow-2xl border-b-4 border-black/20'
                    : 'bg-white dark:bg-dark-surface shadow-lg border-b-4 border-black/10 dark:border-white/10'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed relative z-10',
                    activeTab === item.key ? 'border-white/30' : 'border-black/10 dark:border-white/10'
                  )}
                >
                  <item.icon className="w-5 h-5 text-gourmet-ink dark:text-dark-text" />
                </div>
              </motion.div>
              <span className="text-[10px] font-bold relative z-10 text-gourmet-ink dark:text-dark-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}

