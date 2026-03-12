import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "border border-white/20 bg-white text-black shadow-[0_1px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_2px_20px_rgba(255,255,255,0.25)] hover:bg-white/95",
        success: "border border-emerald-500/30 bg-emerald-600 text-white shadow-[0_1px_12px_rgba(52,211,153,0.25)] hover:shadow-[0_2px_20px_rgba(52,211,153,0.35)] hover:bg-emerald-500",
        warning: "border border-amber-500/30 bg-amber-500 text-black shadow-[0_1px_12px_rgba(251,191,36,0.25)] hover:shadow-[0_2px_20px_rgba(251,191,36,0.35)] hover:bg-amber-400",
        destructive: "border border-red-500/30 bg-red-600 text-white shadow-[0_1px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_2px_20px_rgba(239,68,68,0.35)] hover:bg-red-500",
        outline: "border border-white/10 bg-white/[0.03] text-white backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 shadow-sm",
        secondary: "border border-white/10 bg-white/[0.06] text-white backdrop-blur-md hover:bg-white/[0.12] hover:border-white/15 shadow-sm",
        ghost: "border border-transparent text-white/70 hover:bg-white/[0.06] hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
