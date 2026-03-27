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
    <div className="flex min-h-screen bg-[#fafbfc] dark:bg-[#06060a] text-foreground selection:bg-indigo-500/20 relative overflow-hidden">
      {/* ═══ Background Effects ═══ */}
      <div className="fixed inset-0 z-0 bg-dot-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-indigo-500/[0.06] dark:from-indigo-500/[0.03] via-violet-500/[0.03] dark:via-violet-500/[0.015] to-transparent" />
      </div>
      {/* Mesh gradient orbs */}
      <div className="fixed top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.05] dark:bg-indigo-500/[0.025] blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] dark:bg-violet-500/[0.025] blur-[100px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

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
          className="fixed left-3 top-3 z-[120] h-9 w-9 bg-white/70 dark:bg-black/50 border-zinc-200 dark:border-white/[0.08] backdrop-blur-2xl text-zinc-700 dark:text-white rounded-xl lg:hidden hover:bg-white dark:hover:bg-white/[0.08] shadow-sm"
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
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full min-h-[80vh] rounded-2xl md:rounded-[1.5rem] border border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.015] p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] backdrop-blur-xl relative overflow-hidden"
            >
              {/* Premium top shine */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none" />
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Premium floating mobile bottom nav */}
        <nav className="safe-area-inset-bottom fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0c0c12]/90 backdrop-blur-2xl px-2 py-2.5 lg:hidden shadow-xl dark:shadow-[0_-4px_32px_-8px_rgba(0,0,0,0.5)]">
          {/* Top accent line */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent pointer-events-none" />
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
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'relative flex min-w-[60px] flex-col items-center justify-center rounded-xl px-3 py-2 transition-all duration-300',
        isActive
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-zinc-400 dark:text-white/35 hover:text-zinc-600 dark:hover:text-white/55'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="mobile-nav-active"
          className="absolute inset-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/[0.08] border border-indigo-200/50 dark:border-indigo-500/[0.15]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className="relative z-10 h-[18px] w-[18px]" />
      <span className="relative z-10 mt-1 text-[10px] font-bold tracking-wide">{label}</span>
    </Button>
  );
}
