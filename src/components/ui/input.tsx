import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-white placeholder:text-white/25 selection:bg-primary/30 selection:text-white flex h-10 w-full min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm text-white shadow-inner transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "backdrop-blur-md",
        "focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-white/[0.08] focus-visible:bg-white/[0.06]",
        "hover:border-white/[0.12] hover:bg-white/[0.04]",
        "aria-invalid:border-red-500/40 aria-invalid:ring-red-500/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
