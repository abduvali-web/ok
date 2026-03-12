'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ChefHat, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileHeader } from './MobileHeader';
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
    <div className="flex min-h-screen bg-neutral-50 dark:bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
      {/* Layered Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-neutral-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-neutral-900 dark:via-background dark:to-background pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-500/[0.08] dark:from-blue-500/[0.04] via-violet-500/[0.04] dark:via-violet-500/[0.02] to-transparent pointer-events-none" />
      {/* Mesh gradient orbs */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-blue-500/[0.06] dark:bg-blue-500/[0.03] blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-violet-500/[0.06] dark:bg-violet-500/[0.03] blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        className="z-50"
      />

      <div className="relative flex min-w-0 flex-1 flex-col z-10">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-3 top-3 z-[120] h-9 w-9 bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/[0.08] backdrop-blur-2xl text-zinc-900 dark:text-white rounded-xl lg:hidden hover:bg-white dark:hover:bg-white/[0.08] shadow-sm"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>

        <MobileHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          currentTab={activeTab}
          tabLabels={tabLabels}
          userName={userName}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-auto relative z-10 pt-4 px-4 pb-20 lg:p-6 xl:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.35 }}
              className="h-full min-h-[80vh] rounded-2xl md:rounded-[1.5rem] border border-black/5 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.015] p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Premium floating mobile bottom nav */}
        <nav className="safe-area-inset-bottom fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-black/10 dark:border-white/[0.08] bg-white/95 dark:bg-black/70 backdrop-blur-2xl px-2 py-2.5 lg:hidden shadow-lg dark:shadow-[0_-4px_32px_-8px_rgba(0,0,0,0.5)]">
          <div className="mx-auto flex max-w-md items-center justify-around">
            <MobileNavItem
              isActive={activeTab === 'orders'}
              onClick={() => onTabChange('orders')}
              label="Orders"
              icon={ShoppingCart}
            />
            <MobileNavItem
              isActive={activeTab === 'clients'}
              onClick={() => onTabChange('clients')}
              label="Clients"
              icon={Users}
            />
            <MobileNavItem
              isActive={activeTab === 'cooking'}
              onClick={() => onTabChange('cooking')}
              label="Cooking"
              icon={ChefHat}
            />
            <MobileNavItem
              isActive={activeTab === 'finance'}
              onClick={() => onTabChange('finance')}
              label="Finance"
              icon={DollarSign}
            />
          </div>
        </nav>

        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
}

function MobileNavItem({
  isActive,
  onClick,
  label,
  icon: Icon,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex min-w-[60px] flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300',
        isActive
          ? 'text-zinc-950 dark:text-white'
          : 'text-zinc-400 dark:text-white/40 hover:text-zinc-600 dark:hover:text-white/60'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="mobile-nav-active"
          className="absolute inset-0 rounded-xl bg-black/5 dark:bg-white/[0.08] border border-black/10 dark:border-white/[0.1]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className="relative z-10 h-[18px] w-[18px]" />
      <span className="relative z-10 mt-1 text-[10px] font-bold tracking-wide">{label}</span>
    </button>
  );
}
