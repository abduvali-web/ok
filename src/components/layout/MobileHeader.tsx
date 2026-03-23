'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Menu, Settings, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentTab: string;
  tabLabels: Record<string, string>;
  userName?: string;
  onLogout: () => void;
}

export function MobileHeader({
  onMenuClick,
  currentTab,
  tabLabels,
  userName,
  onLogout,
}: MobileHeaderProps) {
  const { t, language } = useLanguage();
  const defaultUserName = language === 'ru' ? 'Пользователь' : language === 'uz' ? 'Foydalanuvchi' : 'User';
  const resolvedUserName = userName ?? defaultUserName;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#06060a]/80 backdrop-blur-2xl lg:hidden accent-line">
      <div className="flex h-14 items-center justify-between px-4">
        <Button variant="default" size="refIcon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold tracking-tight text-zinc-800 dark:text-white/90">
            {tabLabels[currentTab] || currentTab}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="default" size="refIcon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1 text-[9px] font-bold text-white shadow-lg shadow-indigo-500/30">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="refIcon">
                <Avatar className="h-7 w-7 border border-zinc-200 dark:border-white/[0.1] shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                    {resolvedUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                {t.common.profile}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                {t.admin.settings}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-rose-500 focus:text-rose-500" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t.common.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
