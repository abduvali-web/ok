'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useLanguage, Language } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
]

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    const current = LANGUAGES.find((l) => l.code === language)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{current?.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {LANGUAGES.map(({ code, label, flag }) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`gap-2 text-xs ${language === code ? 'font-medium' : ''}`}
                    >
                        <span>{flag}</span>
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function LanguageSwitcherCompact({
    className,
    align = 'end',
}: {
    className?: string
    align?: 'start' | 'end'
}) {
    const { language, setLanguage } = useLanguage()
    const current = LANGUAGES.find((l) => l.code === language)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('rounded-full', className)}
                    aria-label="Language"
                    title={current?.label ?? 'Language'}
                >
                    <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-36">
                {LANGUAGES.map(({ code, label, flag }) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`gap-2 text-xs ${language === code ? 'font-medium' : ''}`}
                    >
                        <span>{flag}</span>
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
