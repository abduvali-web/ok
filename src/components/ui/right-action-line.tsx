'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Right-aligned single-line action row.
 * - Keeps items on one line (no wrap) and enables horizontal scrolling on overflow.
 * - Visual order is right-to-left (small/icon buttons "first" sit on the far right).
 *   Render children in priority order: smallest -> largest (e.g. refresh, calendar, search).
 */
export function RightActionLine({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <div className={cn('no-scrollbar scroll-right ml-auto w-full overflow-x-auto', className)}>
      <div
        className={cn(
          'flex flex-nowrap flex-row-reverse items-center justify-end gap-2',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

