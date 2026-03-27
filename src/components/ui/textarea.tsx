import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "file:text-zinc-600 dark:file:text-white placeholder:text-zinc-400 dark:placeholder:text-white/25 selection:bg-primary/30 selection:text-white flex field-sizing-content min-h-16 w-full min-w-0 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "bg-white/50 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.07] text-zinc-900 dark:text-white shadow-sm dark:shadow-inner",
        "backdrop-blur-md",
        "focus-visible:border-black/30 dark:focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/[0.08] focus-visible:bg-white dark:focus-visible:bg-white/[0.06]",
        "hover:border-black/20 dark:hover:border-white/[0.12] hover:bg-white/80 dark:hover:bg-white/[0.04]",
        "aria-invalid:border-red-500/40 aria-invalid:ring-red-500/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
