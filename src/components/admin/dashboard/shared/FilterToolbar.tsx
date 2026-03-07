'use client'

import type { ReactNode, Ref } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

export function FilterToolbar({
  searchValue,
  searchPlaceholder,
  searchAriaLabel,
  onSearchChange,
  inputRef,
  children,
}: {
  searchValue: string
  searchPlaceholder: string
  searchAriaLabel?: string
  onSearchChange: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  children?: ReactNode
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="border-border bg-background pl-9"
          aria-label={searchAriaLabel || searchPlaceholder}
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
