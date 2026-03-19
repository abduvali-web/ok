'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  BarChart3, 
  ChefHat, 
  CookingPot, 
  Database, 
  LogOut, 
  MessageSquare, 
  Moon, 
  Settings, 
  ShoppingCart, 
  Sun, 
  Users, 
  Utensils, 
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Activity,
  Archive,
  Menu,
} from 'lucide-react';
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
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  mode?: 'middle' | 'low';
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
}

export function AdminLayout({ children, mode, activeTab, onTabChange, onLogout, userName: _userName }: AdminLayoutProps) {
  const { t, language } = useLanguage();
  const { settings: adminSettings, updateSettings: updateAdminSettings } = useAdminSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        'min-h-screen flex flex-col selection:bg-gourmet-green/20 overflow-hidden',
        'bg-[#FDFCF9] dark:bg-dark-bg text-gourmet-ink dark:text-dark-text transition-colors duration-500'
      )}
    >
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="h-24 md:h-32 bg-gourmet-green dark:bg-dark-green flex items-center justify-between px-6 md:px-16 rounded-b-[60px] shadow-2xl z-50 transition-all duration-300 relative border-b-8 border-black/10"
      >
        <div className="flex items-center gap-6">
           <Button 
             variant="ghost" 
             size="icon" 
             className="md:hidden text-white h-12 w-12 rounded-full hover:bg-white/10"
             onClick={() => setIsSidebarOpen(true)}
           >
              <Menu className="w-8 h-8" />
           </Button>

           <motion.div 
             whileHover={{ scale: 1.05, rotate: -2 }} 
             className="flex items-center gap-4 cursor-pointer group"
             onClick={() => router.push('/admin')}
           >
             <div className="bg-white/10 backdrop-blur-xl p-4 rounded-[28px] shadow-inner border-2 border-dashed border-white/20 group-hover:border-white/40 transition-all duration-500">
                <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 text-white" />
             </div>
             <div className="hidden sm:block">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                  Gourmet
                </h1>
                <div className="flex items-center gap-2 mt-1">
                   <ShieldCheck className="w-3 h-3 text-white/40" />
                   <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">
                     Central Command
                   </p>
                </div>
             </div>
           </motion.div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:flex items-center gap-6 px-8 py-3 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</span>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                   <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                   Operational
                </span>
             </div>
             <Separator orientation="vertical" className="h-8 bg-white/10" />
             <div className="flex flex-col items-end text-white">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Mode</span>
                <span className="text-sm font-bold uppercase tracking-tight">{mode === 'middle' ? 'Master' : 'Associate'} Admin</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.15, rotate: 12, y: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => updateAdminSettings({ theme: isDark ? 'light' : 'dark' })}
              className="w-14 h-14 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-all duration-300 group"
            >
              <div className="w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center transition-all group-hover:border-white/40">
                {isDark ? (
                  <Sun className="w-6 h-6 md:w-8 md:h-8 text-white" />
                ) : (
                  <Moon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                )}
              </div>
            </motion.button>

            <LanguageSwitcherCompact
              className="w-14 h-14 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 rounded-full shadow-xl border-b-4 border-black/20 transition-all duration-300"
              align="end"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15, rotate: -12, y: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 md:w-16 md:h-16 bg-white/10 hover:bg-white/20 rounded-full shadow-xl flex items-center justify-center border-b-4 border-black/20 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center transition-all group-hover:border-white/40">
                    <ChefHat className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px] rounded-3xl border-none shadow-2xl p-2 bg-white/90 backdrop-blur-3xl animate-in fade-in zoom-in-95">
                <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40">System Access</DropdownMenuLabel>
                {showDatabase && (
                  <DropdownMenuItem onSelect={() => router.push('/middle-admin/database')} className="h-12 rounded-2xl gap-3 font-bold hover:bg-gourmet-green/10">
                    <Database className="h-5 w-5 opacity-60" />
                    <span>Database Engine</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => openModalParam('chat')} className="h-12 rounded-2xl gap-3 font-bold hover:bg-gourmet-green/10">
                  <MessageSquare className="h-5 w-5 opacity-60" />
                  <span>Communication Hub</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openModalParam('settings')} className="h-12 rounded-2xl gap-3 font-bold hover:bg-gourmet-green/10">
                  <Settings className="h-5 w-5 opacity-60" />
                  <span>Interface Engine</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onSelect={() => onLogout()} className="h-12 rounded-2xl gap-3 text-rose-600 focus:text-rose-600 font-bold hover:bg-rose-50">
                  <LogOut className="h-5 w-5" />
                  <span>Terminate Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-col md:flex-row flex-1 py-6 md:py-10 px-4 md:px-10 gap-6 md:gap-14 pb-28 md:pb-10 relative">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onLogout={onLogout} 
          className="z-[60]" 
        />

        <main className="flex-1 relative min-w-0 flex flex-col min-h-0 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex flex-row justify-around gap-2 bg-gourmet-green/95 dark:bg-dark-green/95 backdrop-blur-2xl p-4 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-t-2 border-white/10 md:hidden">
        {[
          { key: 'orders', label: 'Orders', icon: ShoppingCart },
          { key: 'statistics', label: 'Stats', icon: BarChart3 },
          { key: 'cooking', label: 'Chef', icon: ChefHat },
          { key: 'warehouse', label: 'Stock', icon: CookingPot },
          { key: 'bin', label: 'Bin', icon: Archive },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className="flex flex-col items-center gap-1 group relative p-2"
          >
            {activeTab === item.key && (
              <motion.div
                layoutId="active-nav-bg-mobile"
                className="absolute inset-0 bg-white/10 rounded-2xl z-0"
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            )}
            <div className={cn(
                "p-3 rounded-full transition-all duration-300 relative z-10",
                activeTab === item.key ? "bg-white text-gourmet-green scale-110 shadow-xl" : "text-white/40"
            )}>
               <item.icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest relative z-10",
              activeTab === item.key ? "text-white" : "text-white/20"
            )}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
