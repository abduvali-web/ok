'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useLanguage, Language } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LANGUAGES: { code: Language; label: string; short: string }[] = [
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'uz', label: "O'zbek", short: 'UZ' },
]

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full px-3 text-xs">
                    <span className="font-semibold">{current.short}</span>
                    <span className="hidden sm:inline text-muted-foreground">{current.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {LANGUAGES.map(({ code, label, short }) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`gap-2 text-xs ${language === code ? 'font-medium' : ''}`}
                    >
                        <span className="w-8 font-semibold">{short}</span>
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function LanguageSwitcherCompact({
    className,
    align: _align = 'end',
}: {
    className?: string
    align?: 'start' | 'end'
}) {
    const { language, setLanguage } = useLanguage()
    const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]
    const nextLanguage: Language = current.code === 'uz' ? 'ru' : 'uz'
    const next = LANGUAGES.find((l) => l.code === nextLanguage) ?? LANGUAGES[0]

    return (
        <Button
            type="button"
            variant="ghost"
            className={cn('rounded-full p-0', className)}
            aria-label={`Language: ${current.label}. Switch to ${next.label}`}
            title={`Switch language to ${next.label}`}
            onClick={() => setLanguage(nextLanguage)}
        >
            <div className="w-10 h-10 md:w-13 md:h-13 rounded-full border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[10px] md:text-xs font-extrabold tracking-wider leading-none">
                    {current.short}
                </span>
                <span className="text-[8px] md:text-[10px] opacity-70 leading-none">{next.short}</span>
            </div>
        </Button>
    )
}

