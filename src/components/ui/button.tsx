import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:opacity-90 hover:scale-[0.98]",
        success: "border border-emerald-600 bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:opacity-90 hover:scale-[0.98]",
        warning: "border border-amber-500 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90 hover:scale-[0.98]",
        destructive: "border border-destructive bg-destructive text-destructive-foreground shadow-[0_0_15px_rgba(var(--destructive),0.3)] hover:opacity-90 hover:scale-[0.98]",
        outline: "border border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-sm",
        secondary: "border border-white/10 bg-white/10 text-white hover:bg-white/20 shadow-sm",
        ghost: "border border-transparent text-white/70 hover:bg-white/10 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-10 px-5 text-base",
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
