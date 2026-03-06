'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'

type AuthHighlight = {
  icon: LucideIcon
  label: string
  detail: string
}

interface AuthShellProps {
  badge: string
  headline: string
  description: string
  highlights: AuthHighlight[]
  cardTitle: string
  cardSubtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({
  badge,
  headline,
  description,
  highlights,
  cardTitle,
  cardSubtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-[1fr_420px]">
        <aside className="space-y-4 rounded-lg border bg-card p-5">
          <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm">AF</span>
            AutoFood
          </Link>

          <div>
            <p className="text-sm font-medium text-muted-foreground">{badge}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{headline}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-md border bg-background p-3">
                <div className="flex items-start gap-2">
                  <item.icon className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border bg-card p-5">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground">{cardTitle}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{cardSubtitle}</h2>
          </div>

          <div>{children}</div>

          {footer ? <div className="mt-6 border-t pt-4">{footer}</div> : null}
        </section>
      </div>
    </div>
  )
}
