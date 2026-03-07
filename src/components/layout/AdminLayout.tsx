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
    <div className="flex min-h-screen bg-background text-foreground dark selection:bg-primary/30 relative overflow-hidden">
      {/* Dynamic Background matching Landing/Login */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-background to-background pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-primary/10 to-transparent blur-[80px] pointer-events-none" />

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
          className="fixed left-3 top-3 z-[120] h-9 w-9 bg-black/40 border-white/10 backdrop-blur-xl text-white lg:hidden"
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
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.3 }}
              className="h-full min-h-[80vh] rounded-2xl md:rounded-[2rem] border border-white/10 bg-black/40 p-4 md:p-6 lg:p-8 shadow-2xl backdrop-blur-xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-xl px-2 py-2 lg:hidden">
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
        'flex min-w-[60px] flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-all duration-300',
        isActive 
          ? 'bg-white/10 text-white shadow-sm' 
          : 'text-white/50 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="mt-1 text-[11px] font-medium">{label}</span>
    </button>
  );
}
