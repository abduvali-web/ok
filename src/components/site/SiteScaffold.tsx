'use client'

import Link from 'next/link'
import { type CSSProperties, type ReactNode } from 'react'
import { LogIn, UserRound, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SiteConfig } from '@/hooks/useSiteConfig'
import { makeClientSiteHref } from '@/lib/site-urls'

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
      className="min-h-screen"
      style={{
        ...toCssVars(site),
        backgroundColor: 'var(--site-bg)',
        color: 'var(--site-text)',
      }}
    >
      {children}
    </div>
  )
}

export function SitePublicHeader({ site }: { site: SiteConfig }) {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--site-panel) 92%, transparent)',
        borderColor: 'var(--site-border)',
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={makeClientSiteHref(site.subdomain, '')} className="text-lg font-semibold tracking-tight">
          {site.siteName}
        </Link>

        <div className="flex items-center gap-2">
          <Link href={makeClientSiteHref(site.subdomain, '/login')}>
            <Button variant="outline" size="sm" className="gap-1">
              <LogIn className="h-4 w-4" /> Login
            </Button>
          </Link>
          <Link href={makeClientSiteHref(site.subdomain, '/register')}>
            <Button variant="outline" size="sm" className="gap-1">
              <UserPlus className="h-4 w-4" /> Register
            </Button>
          </Link>
          <Link href={makeClientSiteHref(site.subdomain, '/client')}>
            <Button size="sm" className="gap-1">
              <UserRound className="h-4 w-4" /> Client
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section
      className="border-b"
      style={{
        borderColor: 'var(--site-border)',
        backgroundImage: 'linear-gradient(140deg, var(--site-hero-from), var(--site-hero-to))',
        color: 'var(--site-hero-text)',
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-[1fr_300px] md:items-end md:py-20">
        <div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg" style={{ color: 'color-mix(in srgb, var(--site-hero-text) 82%, transparent)' }}>
            {subtitle}
          </p>
        </div>

        <div
          className="rounded-3xl border p-4 text-sm backdrop-blur-sm"
          style={{
            borderColor: 'color-mix(in srgb, var(--site-hero-text) 24%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--site-hero-text) 10%, transparent)',
            color: 'color-mix(in srgb, var(--site-hero-text) 88%, transparent)',
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Fast Access</p>
          <div className="mt-2 flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Client, History</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SitePanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-4 md:p-6 ${className}`}
      style={{
        borderColor: 'var(--site-border)',
        backgroundColor: 'var(--site-panel)',
      }}
    >
      {children}
    </div>
  )
}

export function SiteClientNav({ subdomain }: { subdomain: string }) {
  const items = [
    { href: makeClientSiteHref(subdomain, '/client'), label: 'Client' },
    { href: makeClientSiteHref(subdomain, '/history'), label: 'History' },
  ]

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button variant="outline" size="sm">{item.label}</Button>
        </Link>
      ))}
    </nav>
  )
}
