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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-command-center opacity-95" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(243,200,135,0.14),transparent_28%),radial-gradient(circle_at_90%_12%,rgba(45,212,191,0.16),transparent_24%)]" />

      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden border-r border-white/10 text-white lg:flex">
          <div className="flex w-full flex-col justify-between px-10 py-12">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/8 text-[11px] font-bold uppercase tracking-[0.28em]">
                AF
              </span>
              <span>
                <span className="block font-display text-xl tracking-tight">AutoFood</span>
                <span className="block text-[10px] uppercase tracking-[0.26em] text-white/45">Operations access</span>
              </span>
            </Link>

            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f3c887]">
                {badge}
              </div>
              <h1 className="mt-6 font-display text-5xl leading-[1] tracking-[-0.03em]">{headline}</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">{description}</p>

              <div className="mt-10 grid gap-4">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#f3c887]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.22em] text-white/35">&copy; {new Date().getFullYear()} AutoFood</p>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md animate-fade-in-up">
            <Link href="/" className="mb-8 block text-center font-display text-2xl font-semibold tracking-tight text-white lg:hidden">
              AutoFood
            </Link>

            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,17,29,0.94),rgba(11,23,40,0.92))] p-6 text-white shadow-[0_35px_90px_-50px_rgba(0,0,0,0.8)] sm:p-8">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#f3c887]">{cardTitle}</p>
                <h1 className="mt-3 font-display text-3xl tracking-tight">{cardSubtitle}</h1>
              </div>

              <div className="mt-8">{children}</div>

              {footer ? <div className="mt-8 border-t border-white/10 pt-6">{footer}</div> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

