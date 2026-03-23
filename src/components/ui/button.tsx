import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "!bg-primary !text-primary-foreground !shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30",
        success: "!bg-success !text-white !shadow-xl shadow-black/10 hover:bg-success/90",
        warning: "!bg-warning !text-white !shadow-xl shadow-black/10 hover:bg-warning/90",
        destructive: "!bg-destructive !text-destructive-foreground !shadow-xl shadow-black/10 hover:bg-destructive/90",
        outline: "!border !border-input !bg-background !shadow-xl shadow-black/5 hover:bg-accent hover:text-accent-foreground",
        secondary: "!bg-secondary !text-secondary-foreground !shadow-xl shadow-black/5 hover:bg-secondary/80",
        ghost: "shadow-none hover:bg-accent hover:text-accent-foreground",
        link: "shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6 text-base",
        icon: "size-9",
        ref: "!h-[50px] !px-8 md:!px-10 !rounded-full !text-sm md:!text-base !font-bold !transition-all !duration-300 hover:!scale-105 active:!scale-95",
        refSm: "!h-10 !px-6 !rounded-full !text-[13px] md:!text-sm !font-bold !transition-all !duration-300 hover:!scale-105 active:!scale-95",
        refLg: "!h-14 !px-12 !rounded-full !text-base md:!text-lg !font-bold !transition-all !duration-300 hover:!scale-105 active:!scale-95",
        refIcon: "!h-[50px] !w-[50px] !p-0 !rounded-full !transition-all !duration-300 hover:!scale-105 active:!scale-95",
        refIconSm: "!h-10 !w-10 !p-0 !rounded-full !transition-all !duration-300 hover:!scale-105 active:!scale-95",
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
  size = "ref",
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
