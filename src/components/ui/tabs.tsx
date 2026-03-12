"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-11 w-fit items-center justify-center rounded-2xl border border-black/5 dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.02] p-1.5 text-zinc-500 dark:text-white/50 backdrop-blur-xl gap-1 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-4 py-1.5 text-sm font-medium whitespace-nowrap text-zinc-500 dark:text-white/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
        "hover:text-zinc-900 hover:bg-black/5 dark:hover:text-white/70 dark:hover:bg-white/[0.04]",
        "data-[state=active]:border-black/5 dark:data-[state=active]:border-white/[0.1] data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.3)]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none animate-fade-in-up", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
