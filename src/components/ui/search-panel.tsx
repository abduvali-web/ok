'use client'

import { Search } from 'lucide-react'
import type { Ref } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SearchPanel({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  inputRef,
  tone = 'green',
  className,
  inputClassName,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel?: string
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  tone?: 'green' | 'orange'
  className?: string
  inputClassName?: string
}) {
  const wrapperTone =
    tone === 'orange'
      ? 'bg-orange-500'
      : 'bg-primary'

  return (
    <div
      className={cn(
        'relative min-w-0 w-full max-w-[520px] rounded-full shadow-xl border-b-4 border-black/20 p-1 transition-colors duration-300',
        wrapperTone,
        disabled && 'opacity-60',
        className
      )}
    >
      <div className="rounded-full border-2 border-dashed border-white/20 dark:border-white/10 flex items-center px-4 md:px-6 py-2 md:py-3">
        <Search className="pointer-events-none mr-3 md:mr-4 size-5 md:size-6 text-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          disabled={disabled}
          className={cn(
            'h-auto border-0 bg-transparent px-0 py-0 text-base md:text-lg font-bold shadow-none backdrop-blur-0 rounded-none',
            'text-foreground placeholder:text-muted-foreground/70',
            'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 focus-visible:bg-transparent',
            'hover:bg-transparent',
            inputClassName
          )}
        />
      </div>
    </div>
  )
}
