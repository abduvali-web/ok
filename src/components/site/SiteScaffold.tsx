'use client'

import Link from 'next/link'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { LogIn, UserRound, UserPlus } from 'lucide-react'
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
    <div className={cn('min-h-screen', site.bodyClass)} style={{ ...toCssVars(site), backgroundColor: 'var(--site-bg)', color: 'var(--site-text)' }}>
      {children}
    </div>
  )
}

function useCustomerAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('customerToken')
        const response = await fetch('/api/customers/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        })

        if (isMounted) {
          setIsAuthenticated(response.ok)
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false)
        }
      }
    }

    void checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  return isAuthenticated
}

export function SitePublicHeader({ site, rightSlot }: { site: SiteConfig; rightSlot?: ReactNode }) {
  const isAuthenticated = useCustomerAuthenticated()
  const showAuthButtons = isAuthenticated !== true

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur" style={{ borderColor: 'var(--site-border)' }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={makeClientSiteHref(site.subdomain, '')} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold" style={{ borderColor: 'var(--site-border)' }}>
            {site.siteName.slice(0, 2)}
          </span>
          <span className={cn('text-base font-semibold', site.headingClass)}>{site.siteName}</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {rightSlot}
          {showAuthButtons ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function SiteHero({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  eyebrow?: string
  actions?: ReactNode
  asideTitle?: string
  asideDetail?: string
}) {
  return (
    <section className="border-b" style={{ borderColor: 'var(--site-border)', backgroundColor: 'var(--site-panel)' }}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm" style={{ color: 'var(--site-muted)' }}>
          {subtitle}
        </p>
        {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

export function SitePanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border p-4 md:p-5 ${className}`}
      style={{
        borderColor: 'var(--site-border)',
        backgroundColor: 'var(--site-panel)',
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
          <Button variant={currentPath === item.href ? 'default' : 'outline'} size="sm">
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
