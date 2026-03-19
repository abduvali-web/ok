"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto rounded-3xl border-2 border-dashed border-gourmet-green/25 dark:border-white/10 bg-gourmet-cream/70 dark:bg-dark-surface/10 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
      <table data-slot="table" className={cn("w-full caption-bottom text-sm text-gourmet-ink dark:text-dark-text", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b border-gourmet-green/15 dark:border-white/10 bg-gourmet-cream/60 dark:bg-dark-green/20", className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("bg-gourmet-cream/60 dark:bg-dark-green/20 border-t border-gourmet-green/15 dark:border-white/10 font-medium [&>tr]:last:border-b-0", className)} {...props} />
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("hover:bg-gourmet-green/10 dark:hover:bg-dark-green/30 border-b border-gourmet-green/15 dark:border-white/10 transition-all duration-300", className)} {...props} />
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-gourmet-ink/70 dark:text-dark-text/70 h-11 px-4 text-left align-middle text-[12px] uppercase tracking-[0.08em] font-bold dark:font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-4 align-middle text-gourmet-ink dark:text-dark-text whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("text-gourmet-ink/60 dark:text-dark-text/60 mt-3 text-sm pb-3", className)} {...props} />
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
