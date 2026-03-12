import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group/card relative flex flex-col gap-4 rounded-2xl py-5 text-zinc-950 dark:text-white transition-all duration-500",
        "bg-white/60 dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.07]",
        "shadow-sm dark:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)]",
        "backdrop-blur-xl",
        "hover:border-black/10 dark:hover:border-white/[0.12] hover:bg-white/80 dark:hover:bg-white/[0.04]",
        "hover:shadow-md dark:hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)]",
        "hover:-translate-y-[1px]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-bold tracking-tight text-zinc-900 dark:text-white/95", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-zinc-500 dark:text-white/45 text-sm font-medium dark:font-light leading-relaxed", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-5", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-5 [.border-t]:pt-4", className)} {...props} />
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
