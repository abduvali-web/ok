import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-gourmet-ink/70 dark:file:text-dark-text/70 placeholder:text-gourmet-ink/45 dark:placeholder:text-dark-text/30 selection:bg-gourmet-green/30 selection:text-gourmet-ink flex h-10 w-full min-w-0 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "bg-gourmet-cream/60 dark:bg-dark-surface/20 border border-gourmet-green/25 dark:border-white/10 text-gourmet-ink dark:text-dark-text shadow-sm dark:shadow-inner",
        "backdrop-blur-md",
        "focus-visible:border-gourmet-green/45 dark:focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-gourmet-green/15 dark:focus-visible:ring-white/[0.08] focus-visible:bg-gourmet-cream/90 dark:focus-visible:bg-dark-surface/35",
        "hover:border-gourmet-green/35 dark:hover:border-white/15 hover:bg-gourmet-cream/80 dark:hover:bg-dark-surface/30",
        "aria-invalid:border-red-500/40 aria-invalid:ring-red-500/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
