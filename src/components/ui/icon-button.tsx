'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICON_BUTTON_SIZE = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
} as const

const ICON_BUTTON_INNER_SIZE = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
} as const

export type IconButtonProps = Omit<ButtonProps, 'size' | 'children'> & {
  label: string
  children: React.ReactNode
  iconSize?: keyof typeof ICON_BUTTON_SIZE
}

type ButtonProps = React.ComponentProps<typeof Button>

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, className, iconSize = 'md', variant, ...props },
  ref
) {
  const effectiveVariant: ButtonProps['variant'] = variant === 'destructive' ? 'destructive' : 'default'

  return (
    <Button
      ref={ref}
      size="icon"
      variant={effectiveVariant}
      aria-label={label}
      title={label}
      className={cn(
        ICON_BUTTON_SIZE[iconSize],
        'rounded-full p-1',
        'hover:scale-[1.08]',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          ICON_BUTTON_INNER_SIZE[iconSize],
          'rounded-full border-2 border-dashed border-white/10 flex items-center justify-center',
          effectiveVariant === 'destructive' ? 'text-white' : 'text-foreground'
        )}
      >
        {children}
      </span>
      <span className="sr-only">{label}</span>
    </Button>
  )
})
