'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06]" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold tracking-tight text-white/90">
            {tabLabels[currentTab] || currentTab}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06]">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <Avatar className="h-7 w-7 border border-white/[0.1] shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 text-[11px] font-semibold text-white/80">
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
              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={onLogout}>
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
