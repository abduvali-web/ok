'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { ChefHat, DollarSign, ShoppingCart, Users } from 'lucide-react';

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
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Button
          variant="outline"
          size="icon"
          className="fixed left-3 top-3 z-[120] h-9 w-9 bg-card lg:hidden"
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

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>

        <nav className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-2 py-2 lg:hidden">
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
        'flex min-w-[60px] flex-col items-center justify-center rounded-md px-3 py-1.5 transition-colors',
        isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="mt-1 text-[11px] font-medium">{label}</span>
    </button>
  );
}
