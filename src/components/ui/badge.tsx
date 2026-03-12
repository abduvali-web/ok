import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.06] text-white/90 shadow-sm backdrop-blur-md",
        secondary: "border-white/[0.07] bg-white/[0.03] text-white/70 backdrop-blur-md",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_12px_-3px_rgba(239,68,68,0.2)]",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_-3px_rgba(52,211,153,0.2)]",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_-3px_rgba(251,191,36,0.2)]",
        outline: "border-white/10 text-white/70 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
