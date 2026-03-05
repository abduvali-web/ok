'use client'

import Link from 'next/link'
import { type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, LogIn, MessageCircle, Sparkles, UserRound, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'
import { cn } from '@/lib/utils'

function toCssVars(site: SiteConfig) {
  return {
    '--site-bg': site.palette.pageBackground,
    '--site-panel': site.palette.panelBackground,
    '--site-text': site.palette.textPrimary,
    '--site-muted': site.palette.textMuted,
    '--site-border': site.palette.border,
    '--site-accent': site.palette.accent,
    '--site-accent-soft': site.palette.accentSoft,
    '--site-hero-from': site.palette.heroFrom,
    '--site-hero-to': site.palette.heroTo,
    '--site-hero-text': site.palette.heroText,
  } as CSSProperties
}

export function SitePageSurface({ site, children }: { site: SiteConfig; children: ReactNode }) {
  return (
    <div
      className={cn('min-h-screen', site.bodyClass)}
      style={{
        ...toCssVars(site),
        backgroundColor: 'var(--site-bg)',
        color: 'var(--site-text)',
        backgroundImage: [
          'radial-gradient(circle at top left, color-mix(in srgb, var(--site-accent) 12%, transparent), transparent 26%)',
          'radial-gradient(circle at 85% 10%, color-mix(in srgb, var(--site-hero-to) 24%, transparent), transparent 24%)',
          'linear-gradient(180deg, color-mix(in srgb, var(--site-bg) 92%, white), var(--site-bg))',
        ].join(','),
      }}
    >
      {children}
    </div>
  )
}

export function SitePublicHeader({ site, rightSlot }: { site: SiteConfig; rightSlot?: ReactNode }) {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-2xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--site-panel) 92%, transparent)',
        borderColor: 'var(--site-border)',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={makeClientSiteHref(site.subdomain, '')} className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-bold uppercase tracking-[0.28em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--site-accent) 28%, var(--site-border))',
              backgroundColor: 'color-mix(in srgb, var(--site-accent-soft) 78%, white)',
              color: 'var(--site-accent)',
            }}
          >
            {site.siteName.slice(0, 2)}
          </span>
          <span>
            <span className={cn('block text-lg tracking-tight', site.headingClass)}>{site.siteName}</span>
            <span className="block text-[10px] uppercase tracking-[0.26em]" style={{ color: 'var(--site-muted)' }}>
              Customer portal
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {rightSlot}
          <Link href={makeClientSiteHref(site.subdomain, '/login')}>
            <Button variant="outline" size="sm" className="gap-1 rounded-full">
              <LogIn className="h-4 w-4" /> Login
            </Button>
          </Link>
          <Link href={makeClientSiteHref(site.subdomain, '/register')}>
            <Button variant="outline" size="sm" className="gap-1 rounded-full">
              <UserPlus className="h-4 w-4" /> Register
            </Button>
          </Link>
          <Link href={makeClientSiteHref(site.subdomain, '/client')}>
            <Button size="sm" className="gap-1 rounded-full">
              <UserRound className="h-4 w-4" /> Client
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteHero({
  title,
  subtitle,
  eyebrow = 'Daily delivery made legible',
  actions,
  asideTitle = 'Fast access',
  asideDetail = 'Client dashboard, balance, order history, and account tools stay in one place.',
}: {
  title: string
  subtitle: string
  eyebrow?: string
  actions?: ReactNode
  asideTitle?: string
  asideDetail?: string
}) {
  return (
    <section
      className="border-b"
      style={{
        borderColor: 'var(--site-border)',
        backgroundImage: 'linear-gradient(140deg, var(--site-hero-from), var(--site-hero-to))',
        color: 'var(--site-hero-text)',
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-[1fr_320px] md:items-end md:py-20">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--site-hero-text) 16%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--site-hero-text) 8%, transparent)',
              color: 'color-mix(in srgb, var(--site-hero-text) 76%, transparent)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg" style={{ color: 'color-mix(in srgb, var(--site-hero-text) 82%, transparent)' }}>
            {subtitle}
          </p>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div
          className="rounded-[1.75rem] border p-5 text-sm backdrop-blur-sm"
          style={{
            borderColor: 'color-mix(in srgb, var(--site-hero-text) 24%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--site-hero-text) 10%, transparent)',
            color: 'color-mix(in srgb, var(--site-hero-text) 88%, transparent)',
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.22em] opacity-80">{asideTitle}</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4" />
            <span>Client, orders, history</span>
          </div>
          <p className="mt-3 leading-6 opacity-85">{asideDetail}</p>
          <div className="mt-5 flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: 'color-mix(in srgb, var(--site-hero-text) 16%, transparent)' }}>
            <span className="text-xs uppercase tracking-[0.22em] opacity-70">Go to portal</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function SitePanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.45)] md:p-6 ${className}`}
      style={{
        borderColor: 'var(--site-border)',
        backgroundColor: 'color-mix(in srgb, var(--site-panel) 94%, white)',
        backdropFilter: 'blur(14px)',
      }}
    >
      {children}
    </div>
  )
}

export function SiteClientNav({ subdomain, currentPath }: { subdomain: string; currentPath?: string }) {
  const items = [
    { href: makeClientSiteHref(subdomain, '/client'), label: 'Client' },
    { href: makeClientSiteHref(subdomain, '/history'), label: 'History' },
  ]

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button variant={currentPath === item.href ? 'default' : 'outline'} size="sm" className="rounded-full">
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
