'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICON_BUTTON_INNER_SIZE = {
  sm: 'h-[38px] w-[38px]',
  md: 'h-[42px] w-[42px]',
  lg: 'h-[46px] w-[46px]',
} as const

export type IconButtonProps = Omit<ButtonProps, 'size' | 'children'> & {
  label: string
  children: React.ReactNode
  iconSize?: keyof typeof ICON_BUTTON_INNER_SIZE
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
      size="refIcon"
      variant={effectiveVariant}
      aria-label={label}
      title={label}
      className={cn(
        'p-1',
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
