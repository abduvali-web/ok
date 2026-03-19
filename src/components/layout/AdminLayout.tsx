'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, ChefHat, CookingPot, Database, LogOut, MessageSquare, Moon, Settings, ShoppingCart, Sun, Users, Utensils } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAdminSettingsContext } from '@/contexts/AdminSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
  mode?: 'middle' | 'low';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

export function AdminLayout({ children, mode, activeTab, onTabChange, onLogout, userName: _userName }: AdminLayoutProps) {
  const { t } = useLanguage();
  const { settings: adminSettings, updateSettings: updateAdminSettings } = useAdminSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const systemPrefersDark =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const isDark = adminSettings.theme === 'dark' || (adminSettings.theme === 'system' && systemPrefersDark);

  const showDatabase = mode === 'middle';
  const openModalParam = (key: 'chat' | 'settings') => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('chat');
    params.delete('settings');
    params.set(key, '1');
    params.set('v', String(Date.now()));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col selection:bg-indigo-500/20',
        'bg-gourmet-cream dark:bg-dark-bg text-gourmet-ink dark:text-dark-text'
      )}
    >
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="h-20 md:h-24 bg-dark-green flex items-center justify-between px-4 md:px-10 rounded-b-[30px] md:rounded-b-[50px] shadow-xl z-30 transition-colors duration-300"
      >
        <motion.div whileHover={{ scale: 1.05, y: 4 }} className="flex items-center gap-2 md:gap-4 cursor-pointer min-w-0">
          <motion.div
            animate={{ rotate: [-12, 12, -12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-dark-surface p-2 md:p-3 rounded-full shadow-inner border-2 border-white/20 transition-colors duration-300"
            aria-hidden="true"
          >
            <Utensils className="w-6 h-6 md:w-10 md:h-10 text-gourmet-ink dark:text-dark-text" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gourmet-green tracking-tight truncate">Gourmet</h1>
            <p className="hidden md:block text-sm text-gourmet-green font-medium truncate">
              Management V1
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-3 md:gap-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, y: 4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => updateAdminSettings({ theme: isDark ? 'light' : 'dark' })}
            className="w-12 h-12 md:w-16 md:h-16 bg-gourmet-green dark:bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10 group transition-colors duration-300"
            aria-label={t.admin.theme}
            title={t.admin.theme}
          >
            <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
              {isDark ? (
                <Sun className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
              ) : (
                <Moon className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
              )}
            </div>
          </motion.button>

          <LanguageSwitcherCompact
            className="w-12 h-12 md:w-16 md:h-16 bg-gourmet-green dark:bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10 group transition-colors duration-300"
            align="end"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 5, y: 8 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 md:w-16 md:h-16 bg-gourmet-green dark:bg-dark-surface rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/10 group transition-colors duration-300"
                aria-label="Open menu"
                title="Open menu"
              >
                <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-gourmet-ink dark:text-dark-text" />
                </div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {showDatabase ? (
                <DropdownMenuItem onSelect={() => router.push('/middle-admin/database')} className="gap-2">
                  <Database className="h-4 w-4" />
                  <span>Database</span>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => openModalParam('chat')} className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{t.courier.chat}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openModalParam('settings')} className="gap-2">
                <Settings className="h-4 w-4" />
                <span>{t.admin.settings}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onLogout()} className="gap-2 text-rose-600 focus:text-rose-600">
                <LogOut className="h-4 w-4" />
                <span>{t.common.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <div className="flex flex-col md:flex-row flex-1 py-4 md:py-8 px-2 md:px-4 gap-4 md:gap-6 pb-24 md:pb-8">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} isOpen={false} onClose={() => {}} onLogout={onLogout} className="z-40" />

        <main className="flex-1 relative min-w-0 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="min-w-0 flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex flex-row justify-around gap-2 bg-gourmet-green/90 dark:bg-dark-green/90 p-2 rounded-t-[30px] shadow-2xl transition-colors duration-300 md:hidden">
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
    </div>
  );
}
