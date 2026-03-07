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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            {tabLabels[currentTab] || currentTab}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-sm px-1 py-0 text-[10px]">
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="bg-accent text-[11px] font-semibold text-foreground">
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
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onLogout}>
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
