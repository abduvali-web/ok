'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger'

const toneClassMap: Record<StatusTone, string> = {
  neutral: 'border-border bg-muted/40 text-muted-foreground',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function EntityStatusBadge({
  isActive,
  activeLabel,
  inactiveLabel,
  activeTone = 'success',
  inactiveTone = 'warning',
  showDot = false,
  className,
  onClick,
}: {
  isActive: boolean
  activeLabel: string
  inactiveLabel: string
  activeTone?: StatusTone
  inactiveTone?: StatusTone
  showDot?: boolean
  className?: string
  onClick?: () => void
}) {
  const toneClass = toneClassMap[isActive ? activeTone : inactiveTone]

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5',
        toneClass,
        onClick && 'cursor-pointer transition-opacity hover:opacity-85',
        className
      )}
      onClick={onClick}
    >
      {showDot && <span className={cn('size-2 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-500')} />}
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  )
}
