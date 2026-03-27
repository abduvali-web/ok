'use client'

import { Search } from 'lucide-react'
import type { Ref } from 'react'

import { AnimatedInput } from '@/components/smoothui'
import { cn } from '@/lib/utils'

export function SearchPanel({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  inputRef,
  className,
  inputClassName,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel?: string
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
  className?: string
  inputClassName?: string
}) {
  return (
    <div className={cn('min-w-0 w-full max-w-[360px]', className)}>
      <AnimatedInput
        inputRef={inputRef}
        value={value}
        onChange={onChange}
        label={ariaLabel || placeholder}
        placeholder={placeholder}
        disabled={disabled}
        icon={<Search className="size-4 text-muted-foreground" />}
        className="h-9"
        inputClassName={cn('h-9 border-border bg-background', inputClassName)}
        labelClassName="text-muted-foreground"
      />
    </div>
  )
}
