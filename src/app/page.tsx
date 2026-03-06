'use client'

import Link from 'next/link'
import { ArrowRight, Check, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

const features = [
  'Order and client management',
  'Courier dispatch and status tracking',
  'Warehouse and menu operations',
  'Finance and debt tracking',
  'Role-based admin access',
  'Client portal and history',
]

const roles = [
  { title: 'Super Admin', detail: 'Governance, permissions, and platform-level controls.' },
  { title: 'Middle Admin', detail: 'Daily order flow, dispatch, and client operations.' },
  { title: 'Low Admin', detail: 'Limited operational views and assigned workflows.' },
  { title: 'Courier', detail: 'Route execution, status updates, and delivery completion.' },
]

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-base font-semibold">
            AutoFood
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button size="sm">{t.common.login}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="rounded-lg border bg-card p-6">
          <h1 className="text-3xl font-semibold tracking-tight">Delivery operations platform</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            AutoFood helps teams manage client subscriptions, dispatch couriers, monitor operations, and keep finance data consistent in one system.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login">
              <Button>
                Open dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="tel:+998977087373">
              <Button variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                +998 97 708 73 73
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">What you get</h2>
            <div className="mt-4 space-y-2">
              {features.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold">Built for team roles</h2>
            <div className="mt-4 space-y-3">
              {roles.map((role) => (
                <div key={role.title} className="rounded-md border bg-background p-3">
                  <p className="text-sm font-medium">{role.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{role.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Pricing</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">Monthly</p>
              <p className="mt-1 text-2xl font-semibold">$100</p>
              <p className="mt-1 text-xs text-muted-foreground">Flexible start for new teams.</p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <p className="text-sm font-medium">Quarterly</p>
              <p className="mt-1 text-2xl font-semibold">$200</p>
              <p className="mt-1 text-xs text-muted-foreground">Lower cost for stable operations.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
